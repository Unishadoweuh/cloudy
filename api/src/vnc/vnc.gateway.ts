import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import * as https from 'https';
import { IncomingMessage } from 'http';

@WebSocketGateway({
    path: '/ws/vnc',
    cors: {
        origin: '*',
    },
})
export class VncGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(VncGateway.name);

    constructor(private configService: ConfigService) { }

    async handleConnection(client: WebSocket, req: IncomingMessage) {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const node = url.searchParams.get('node');
        const vmid = url.searchParams.get('vmid');
        const type = url.searchParams.get('type') || 'qemu';

        if (!node || !vmid) {
            this.logger.error('Missing node or vmid parameters');
            client.close(1008, 'Missing node or vmid');
            return;
        }

        this.logger.log(`VNC connection request: ${type}/${vmid} on ${node}`);

        try {
            // Get VNC ticket from Proxmox
            const proxmoxUrl = this.configService.get<string>('PROXMOX_API_URL') || '';
            const apiToken = this.configService.get<string>('PROXMOX_API_TOKEN') || '';

            const parsedUrl = new URL(proxmoxUrl);
            const hostname = parsedUrl.hostname;
            const port = parsedUrl.port || '8006';

            // Request VNC proxy ticket
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/vncproxy`
                : `/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`;

            const ticketResponse = await this.makeProxmoxRequest(hostname, port, endpoint, apiToken, {
                websocket: 1,
            });

            const { ticket, port: vncPort } = ticketResponse.data;

            // Connect to Proxmox VNC WebSocket
            const vncPath = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/vncwebsocket?port=${vncPort}&vncticket=${encodeURIComponent(ticket)}`
                : `/api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket?port=${vncPort}&vncticket=${encodeURIComponent(ticket)}`;

            this.logger.log(`Connecting to Proxmox WebSocket: wss://${hostname}:${port}${vncPath}`);

            const proxmoxWs = new WebSocket(`wss://${hostname}:${port}${vncPath}`, ['binary'], {
                headers: {
                    Authorization: `PVEAPIToken=${apiToken}`,
                },
                rejectUnauthorized: false,
            });

            // Relay data between client and Proxmox
            proxmoxWs.on('open', () => {
                this.logger.log(`Connected to Proxmox VNC WebSocket for ${type}/${vmid}`);
            });

            proxmoxWs.on('message', (data: Buffer) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });

            proxmoxWs.on('error', (error: Error) => {
                this.logger.error(`Proxmox WebSocket error: ${error.message}`);
                client.close(1011, 'Proxmox connection error');
            });

            proxmoxWs.on('close', (code: number, reason: Buffer) => {
                this.logger.log(`Proxmox VNC WebSocket closed for ${type}/${vmid}, code: ${code}, reason: ${reason.toString()}`);
                client.close();
            });

            client.on('message', (data: Buffer) => {
                if (proxmoxWs.readyState === WebSocket.OPEN) {
                    proxmoxWs.send(data);
                }
            });

            client.on('close', () => {
                this.logger.log(`Client WebSocket closed for ${type}/${vmid}`);
                proxmoxWs.close();
            });

            client.on('error', (error: Error) => {
                this.logger.error(`Client WebSocket error: ${error.message}`);
                proxmoxWs.close();
            });

        } catch (error) {
            this.logger.error(`Failed to establish VNC connection: ${error.message}`);
            client.close(1011, 'Failed to connect to VNC');
        }
    }

    handleDisconnect(client: WebSocket) {
        this.logger.log('Client disconnected from VNC');
    }

    private makeProxmoxRequest(
        hostname: string,
        port: string,
        path: string,
        apiToken: string,
        data: Record<string, any>,
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const postData = new URLSearchParams(data).toString();

            const options = {
                hostname,
                port: parseInt(port),
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    Authorization: `PVEAPIToken=${apiToken}`,
                },
                rejectUnauthorized: false,
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => (body += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed.data) {
                            resolve(parsed);
                        } else {
                            reject(new Error(parsed.errors ? JSON.stringify(parsed.errors) : 'Unknown error'));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
}
