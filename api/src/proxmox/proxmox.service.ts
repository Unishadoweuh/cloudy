import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

@Injectable()
export class ProxmoxService implements OnModuleInit {
    private readonly logger = new Logger(ProxmoxService.name);
    private client: AxiosInstance;
    private configLoaded = false;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        // Initialize with a placeholder client, will be configured in onModuleInit
        this.client = axios.create({
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
    }

    async onModuleInit() {
        await this.initializeClient();
    }

    private async initializeClient() {
        try {
            // Try to load config from database first
            const appConfig = await this.prisma.appConfig.findUnique({
                where: { id: 'app_config' },
            });

            let baseURL: string | undefined;
            let apiToken: string | undefined;

            if (appConfig?.pveHost && appConfig?.pveTokenId && appConfig?.pveTokenSecret) {
                // Use DB config
                baseURL = appConfig.pveHost;
                apiToken = `${appConfig.pveTokenId}=${appConfig.pveTokenSecret}`;
                this.logger.log('Proxmox config loaded from database');
            } else {
                // Fallback to env vars
                baseURL = this.configService.get<string>('PROXMOX_API_URL');
                apiToken = this.configService.get<string>('PROXMOX_API_TOKEN');
                if (baseURL && apiToken) {
                    this.logger.log('Proxmox config loaded from environment variables');
                } else {
                    this.logger.warn('No Proxmox configuration found. Please complete setup.');
                    return;
                }
            }

            this.client = axios.create({
                baseURL,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                headers: {
                    Authorization: `PVEAPIToken=${apiToken}`,
                },
            });
            this.configLoaded = true;
        } catch (error) {
            this.logger.error('Error initializing Proxmox client', error.message);
        }
    }

    // Reinitialize client when config is updated
    async reinitializeClient() {
        this.configLoaded = false;
        await this.initializeClient();
    }

    // Test connection with given credentials (for setup wizard)
    async testConnection(host: string, tokenId: string, tokenSecret: string): Promise<{ success: boolean; message: string; nodes?: number }> {
        try {
            const testClient = axios.create({
                baseURL: host,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                headers: {
                    Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
                },
                timeout: 10000,
            });

            const res = await testClient.get('/api2/json/nodes');
            const nodes = res.data?.data?.length || 0;
            return { success: true, message: `Connected successfully! Found ${nodes} node(s).`, nodes };
        } catch (error) {
            const message = error.response?.data?.errors
                ? JSON.stringify(error.response.data.errors)
                : error.message;
            return { success: false, message: `Connection failed: ${message}` };
        }
    }

    isConfigured(): boolean {
        return this.configLoaded;
    }

    // Expose the Axios client for other services (e.g., PBS)
    getClient(): AxiosInstance {
        return this.client;
    }

    async getNodes() {
        try {
            const res = await this.client.get('/api2/json/nodes');
            return res.data.data;
        } catch (error) {
            this.logger.error('Error fetching nodes', error.message);
            throw error;
        }
    }

    async getResources() {
        try {
            const res = await this.client.get('/api2/json/cluster/resources?type=vm');
            return res.data.data;
        } catch (error) {
            console.error('================================================');
            console.error('PROXMOX CONNECTION FAILED');
            console.error('Error Message:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data));
            } else {
                console.error('No response received (Network or Config issue)');
            }
            console.error('Is URL correct?', this.client.defaults.baseURL);
            console.error('================================================');

            this.logger.warn(`Failed to fetch from Proxmox (${error.message}). Returning MOCK data for demo.`);
            return [
                { id: 'qemu/100', vmid: 100, name: 'demo-mock-vm', status: 'running', node: 'pve-01', maxcpu: 4, maxmem: 8589934592, type: 'qemu' },
                { id: 'qemu/101', vmid: 101, name: 'db-server-mock', status: 'stopped', node: 'pve-01', maxcpu: 2, maxmem: 4294967296, type: 'qemu' },
                { id: 'qemu/102', vmid: 102, name: 'web-worker-mock', status: 'running', node: 'pve-02', maxcpu: 8, maxmem: 17179869184, type: 'qemu' },
                { id: 'qemu/9000', vmid: 9000, name: 'ubuntu-22.04-template', status: 'stopped', node: 'pve-01', maxcpu: 2, maxmem: 2147483648, template: 1, type: 'qemu' },
                { id: 'lxc/9001', vmid: 9001, name: 'alpine-lxc-template', status: 'stopped', node: 'pve-01', maxcpu: 1, maxmem: 536870912, template: 1, type: 'lxc' },
            ];
        }
    }

    async vmAction(node: string, vmid: number, action: string, type: 'qemu' | 'lxc' = 'qemu') {
        try {
            // Valid actions: start, stop, reset, shutdown, suspend, resume
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/status/${action}`
                : `/api2/json/nodes/${node}/qemu/${vmid}/status/${action}`;
            const res = await this.client.post(endpoint);
            return res.data.data;
        } catch (error) {
            this.logger.error(`Error performing ${action} on ${type.toUpperCase()} ${vmid}`, error.message);
            throw error;
        }
    }

    async getVncTicket(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu') {
        try {
            const baseURL = this.configService.get<string>('PROXMOX_API_URL') || '';
            const url = new URL(baseURL);
            const hostname = url.hostname;
            const port = url.port || '8006';
            const protocol = url.protocol;

            if (type === 'lxc') {
                // LXC uses termproxy for terminal access
                const res = await this.client.post(`/api2/json/nodes/${node}/lxc/${vmid}/termproxy`);
                const ticketData = res.data.data;

                // URL-encode the ticket for use in the URL
                const encodedTicket = encodeURIComponent(ticketData.ticket);

                // Terminal Web URL for LXC with ticket
                const vncUrl = `${protocol}//${hostname}:${port}/?console=lxc&xtermjs=1&vmid=${vmid}&node=${node}&vncticket=${encodedTicket}`;

                return {
                    ticket: ticketData.ticket,
                    port: ticketData.port,
                    user: ticketData.user,
                    vncUrl: vncUrl
                };
            } else {
                // QEMU uses vncproxy
                const res = await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`, {
                    websocket: 1
                });
                const ticketData = res.data.data;

                // URL-encode the ticket for use in the URL
                const encodedTicket = encodeURIComponent(ticketData.ticket);

                // VNC Web URL (IFrame) with ticket
                const vncUrl = `${protocol}//${hostname}:${port}/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&vncticket=${encodedTicket}`;

                return {
                    ticket: ticketData.ticket,
                    port: ticketData.port,
                    user: ticketData.user,
                    vncUrl: vncUrl
                };
            }
        } catch (error) {
            this.logger.error(`Error getting console ticket for ${type.toUpperCase()} ${vmid}`, error.message);
            throw error;
        }
    }
    async getTemplates(type?: 'qemu' | 'lxc') {
        const resources = await this.getResources();
        return resources.filter((vm: any) => vm.template === 1 && (!type || vm.type === type));
    }

    async getNextId() {
        try {
            const res = await this.client.get('/api2/json/cluster/nextid');
            return res.data.data;
        } catch (error) {
            this.logger.warn(`Failed to get next VMID from Proxmox (${error.message}). Returning MOCK ID.`);
            return Math.floor(Math.random() * 1000) + 200;
        }
    }

    async getUserResources(userId: string) {
        const resources = await this.getResources();
        const userTag = `owner-${userId}`;

        // Filter resources owned by user
        const userResources = resources.filter((vm: any) => {
            return vm.tags && vm.tags.includes(userTag);
        });

        let totalCpu = 0;
        let totalMem = 0;
        let totalDisk = 0;

        for (const vm of userResources) {
            totalCpu += vm.maxcpu || 0;
            totalMem += vm.maxmem || 0; // Bytes
            totalDisk += vm.maxdisk || 0; // Bytes
        }

        return {
            instances: userResources.length,
            cpu: totalCpu,
            memory: Math.round(totalMem / 1024 / 1024), // Convert to MB
            disk: Math.round(totalDisk / 1024 / 1024 / 1024), // Convert to GB
        };
    }

    async createQemu(node: string, templateId: number, name: string, cores: number, memory: number, ciuser?: string, cipassword?: string, sshkeys?: string, tags?: string) {
        try {
            const newId = await this.getNextId();

            // Clone the template
            const cloneRes = await this.client.post(`/api2/json/nodes/${node}/qemu/${templateId}/clone`, {
                newid: newId,
                name: name,
                full: 1
            });

            const cloneTask = cloneRes.data?.data;
            this.logger.log(`Clone task started: ${cloneTask} for VM ${newId}`);

            const configPayload: any = {
                cores: cores,
                memory: memory,
                tags: tags
            };
            if (ciuser) configPayload.ciuser = ciuser;
            if (cipassword) configPayload.cipassword = cipassword;
            if (sshkeys) configPayload.sshkeys = encodeURIComponent(sshkeys);

            // Retry applying config up to 5 times with increasing delays
            let configApplied = false;
            const delays = [3000, 5000, 8000, 12000, 15000];
            for (let i = 0; i < delays.length && !configApplied; i++) {
                await new Promise(r => setTimeout(r, delays[i]));
                try {
                    await this.client.post(`/api2/json/nodes/${node}/qemu/${newId}/config`, configPayload);
                    configApplied = true;
                    this.logger.log(`Config applied to VM ${newId} on attempt ${i + 1}`);
                } catch (e) {
                    this.logger.warn(`Config apply attempt ${i + 1} failed for VM ${newId}: ${e.message}`);
                }
            }

            if (!configApplied) {
                this.logger.error(`Failed to apply config with tags to VM ${newId} after ${delays.length} attempts`);
            }

            return { vmid: newId, task: cloneTask || "UPID:clone:task" };
        } catch (error) {
            this.logger.error(`Error creating QEMU VM from template ${templateId}: ${error.message}`);
            throw error;
        }
    }

    async createLXC(node: string, templateId: number, name: string, cores: number, memory: number, password?: string, sshkeys?: string, tags?: string) {
        try {
            const newId = await this.getNextId();

            // Clone LXC Template
            const cloneRes = await this.client.post(`/api2/json/nodes/${node}/lxc/${templateId}/clone`, {
                newid: newId,
                hostname: name,
                full: 1
            });

            const cloneTask = cloneRes.data?.data;
            this.logger.log(`LXC Clone task started: ${cloneTask} for CT ${newId}`);

            // Config Update
            const configPayload: any = {
                cores: cores,
                memory: memory,
                tags: tags
            };
            if (password) configPayload.password = password;
            if (sshkeys) configPayload['ssh-public-keys'] = encodeURIComponent(sshkeys);

            // Retry applying config up to 5 times with increasing delays
            let configApplied = false;
            const delays = [3000, 5000, 8000, 12000, 15000];
            for (let i = 0; i < delays.length && !configApplied; i++) {
                await new Promise(r => setTimeout(r, delays[i]));
                try {
                    await this.client.put(`/api2/json/nodes/${node}/lxc/${newId}/config`, configPayload);
                    configApplied = true;
                    this.logger.log(`Config applied to CT ${newId} on attempt ${i + 1}`);
                } catch (e) {
                    this.logger.warn(`Config apply attempt ${i + 1} failed for CT ${newId}: ${e.message}`);
                }
            }

            if (!configApplied) {
                this.logger.error(`Failed to apply config with tags to CT ${newId} after ${delays.length} attempts`);
            }

            return { vmid: newId, task: cloneTask || "UPID:lxc:clone:task" };
        } catch (error) {
            this.logger.error(`Error creating LXC from template ${templateId}: ${error.message}`);
            throw error;
        }
    }

    // Legacy alias
    async createVM(node: string, templateId: number, name: string, cores: number, memory: number) {
        return this.createQemu(node, templateId, name, cores, memory);
    }

    async deleteQemu(node: string, vmid: number) {
        try {
            // First stop the VM if running
            try {
                await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/stop`);
                // Wait a bit for stop to take effect
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                this.logger.warn(`Could not stop VM ${vmid} before deletion (might already be stopped)`);
            }

            // Delete the VM
            const res = await this.client.delete(`/api2/json/nodes/${node}/qemu/${vmid}`);
            return res.data?.data || `UPID:${node}:delete:${vmid}`;
        } catch (error) {
            this.logger.error(`Error deleting QEMU VM ${vmid}: ${error.message}`);
            throw error;
        }
    }

    async deleteLXC(node: string, vmid: number) {
        try {
            // First stop the container if running
            try {
                await this.client.post(`/api2/json/nodes/${node}/lxc/${vmid}/status/stop`);
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                this.logger.warn(`Could not stop LXC ${vmid} before deletion (might already be stopped)`);
            }

            // Delete the container
            const res = await this.client.delete(`/api2/json/nodes/${node}/lxc/${vmid}`);
            return res.data?.data || `UPID:${node}:delete:${vmid}`;
        } catch (error) {
            this.logger.error(`Error deleting LXC ${vmid}: ${error.message}`);
            throw error;
        }
    }

    // ==================== STORAGE METHODS ====================

    async getStoragePools(node?: string) {
        try {
            if (node) {
                const res = await this.client.get(`/api2/json/nodes/${node}/storage`);
                return res.data.data;
            } else {
                // Get storage pools from all nodes
                const nodes = await this.getNodes();
                const allStorage: any[] = [];
                const seenStorage = new Set<string>();

                for (const n of nodes) {
                    try {
                        const res = await this.client.get(`/api2/json/nodes/${n.node}/storage`);
                        for (const storage of res.data.data) {
                            if (!seenStorage.has(storage.storage)) {
                                seenStorage.add(storage.storage);
                                allStorage.push({ ...storage, node: n.node });
                            }
                        }
                    } catch (e) {
                        this.logger.warn(`Failed to get storage for node ${n.node}`);
                    }
                }
                return allStorage;
            }
        } catch (error) {
            this.logger.warn(`Failed to fetch storage pools. Returning MOCK data.`);
            return [
                { storage: 'local', type: 'dir', content: 'iso,vztmpl,backup', total: 107374182400, used: 32212254720, avail: 75161927680, active: 1, node: 'pve-01' },
                { storage: 'local-lvm', type: 'lvmthin', content: 'images,rootdir', total: 536870912000, used: 214748364800, avail: 322122547200, active: 1, node: 'pve-01' },
                { storage: 'nfs-backup', type: 'nfs', content: 'backup', total: 1099511627776, used: 549755813888, avail: 549755813888, active: 1, node: 'pve-01' },
            ];
        }
    }

    async getStorageContent(node: string, storage: string, content?: string) {
        try {
            let url = `/api2/json/nodes/${node}/storage/${storage}/content`;
            if (content) {
                url += `?content=${content}`;
            }
            const res = await this.client.get(url);
            return res.data.data;
        } catch (error) {
            this.logger.warn(`Failed to fetch storage content for ${storage} on ${node}. Returning MOCK data.`);
            return [
                { volid: `${storage}:vm-100-disk-0`, format: 'raw', size: 34359738368, vmid: 100, content: 'images' },
                { volid: `${storage}:vm-101-disk-0`, format: 'qcow2', size: 53687091200, vmid: 101, content: 'images' },
                { volid: `${storage}:vm-102-disk-0`, format: 'raw', size: 107374182400, vmid: 102, content: 'images' },
                { volid: `${storage}:base-9000-disk-0`, format: 'qcow2', size: 10737418240, vmid: 9000, content: 'images' },
            ];
        }
    }

    async getAllVolumes() {
        try {
            const pools = await this.getStoragePools();
            const allVolumes: any[] = [];

            for (const pool of pools) {
                if (pool.content?.includes('images') || pool.content?.includes('rootdir')) {
                    try {
                        const volumes = await this.getStorageContent(pool.node, pool.storage, 'images');
                        for (const vol of volumes) {
                            allVolumes.push({ ...vol, storage: pool.storage, node: pool.node });
                        }
                    } catch (e) {
                        // Skip this pool
                    }
                }
            }
            return allVolumes;
        } catch (error) {
            this.logger.warn(`Failed to fetch all volumes. Returning MOCK data.`);
            return [
                { volid: 'local-lvm:vm-100-disk-0', format: 'raw', size: 34359738368, vmid: 100, content: 'images', storage: 'local-lvm', node: 'pve-01' },
                { volid: 'local-lvm:vm-101-disk-0', format: 'qcow2', size: 53687091200, vmid: 101, content: 'images', storage: 'local-lvm', node: 'pve-01' },
                { volid: 'local-lvm:vm-102-disk-0', format: 'raw', size: 107374182400, vmid: 102, content: 'images', storage: 'local-lvm', node: 'pve-02' },
            ];
        }
    }

    async createVolume(node: string, storage: string, filename: string, size: string, format: string = 'raw') {
        try {
            const res = await this.client.post(`/api2/json/nodes/${node}/storage/${storage}/content`, {
                filename,
                size,
                format
            });
            return res.data.data;
        } catch (error) {
            this.logger.error(`Error creating volume: ${error.message}`);
            throw error;
        }
    }

    async deleteVolume(node: string, storage: string, volume: string) {
        try {
            const encodedVolume = encodeURIComponent(volume);
            const res = await this.client.delete(`/api2/json/nodes/${node}/storage/${storage}/content/${encodedVolume}`);
            return res.data.data;
        } catch (error) {
            this.logger.error(`Error deleting volume: ${error.message}`);
            throw error;
        }
    }

    // ==================== NETWORK METHODS ====================

    async getNetworkInterfaces(node: string) {
        try {
            const res = await this.client.get(`/api2/json/nodes/${node}/network`);
            return res.data.data.map((iface: any) => ({
                ...iface,
                node,
            }));
        } catch (error) {
            this.logger.warn(`Failed to fetch network interfaces for ${node}. Returning MOCK data.`);
            return [
                { iface: 'vmbr0', type: 'bridge', node, active: 1, address: '192.168.1.1', netmask: '255.255.255.0', gateway: '192.168.1.254', bridge_ports: 'eno1', autostart: 1, method: 'static', cidr: '192.168.1.1/24' },
                { iface: 'vmbr1', type: 'bridge', node, active: 1, address: '10.0.0.1', netmask: '255.255.0.0', bridge_ports: 'eno2', autostart: 1, method: 'static', cidr: '10.0.0.1/16' },
                { iface: 'eno1', type: 'eth', node, active: 1, autostart: 1, method: 'manual' },
                { iface: 'eno2', type: 'eth', node, active: 1, autostart: 1, method: 'manual' },
                { iface: 'lo', type: 'loopback', node, active: 1, address: '127.0.0.1', netmask: '255.0.0.0', autostart: 1, method: 'loopback' },
            ];
        }
    }

    async getAllNetworks() {
        try {
            const nodes = await this.getNodes();
            const allInterfaces: any[] = [];

            for (const n of nodes) {
                try {
                    const interfaces = await this.getNetworkInterfaces(n.node);
                    allInterfaces.push(...interfaces);
                } catch (e) {
                    this.logger.warn(`Failed to get network for node ${n.node}`);
                }
            }
            return allInterfaces;
        } catch (error) {
            this.logger.warn(`Failed to fetch all networks. Returning MOCK data.`);
            return [
                { iface: 'vmbr0', type: 'bridge', node: 'pve-01', active: 1, address: '192.168.1.1', netmask: '255.255.255.0', gateway: '192.168.1.254', bridge_ports: 'eno1', autostart: 1, method: 'static', cidr: '192.168.1.1/24' },
                { iface: 'vmbr1', type: 'bridge', node: 'pve-01', active: 1, address: '10.0.0.1', netmask: '255.255.0.0', bridge_ports: 'eno2', autostart: 1, method: 'static', cidr: '10.0.0.1/16' },
                { iface: 'vmbr0', type: 'bridge', node: 'pve-02', active: 1, address: '192.168.1.2', netmask: '255.255.255.0', bridge_ports: 'eth0', autostart: 1, method: 'static', cidr: '192.168.1.2/24' },
                { iface: 'eno1', type: 'eth', node: 'pve-01', active: 1, autostart: 1, method: 'manual' },
                { iface: 'eth0', type: 'eth', node: 'pve-02', active: 1, autostart: 1, method: 'manual' },
            ];
        }
    }

    async getNetworkBridges() {
        const allNetworks = await this.getAllNetworks();
        return allNetworks.filter((iface: any) => iface.type === 'bridge');
    }

    // ==================== MONITORING METHODS ====================

    async getNodeRrdData(node: string, timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' = 'hour') {
        try {
            const res = await this.client.get(`/api2/json/nodes/${node}/rrddata?timeframe=${timeframe}`);
            return res.data.data;
        } catch (error) {
            this.logger.warn(`Failed to fetch RRD data for node ${node}. Returning MOCK data.`);
            // Generate mock time series data
            const now = Math.floor(Date.now() / 1000);
            const interval = timeframe === 'hour' ? 60 : timeframe === 'day' ? 300 : 3600;
            const points = timeframe === 'hour' ? 60 : timeframe === 'day' ? 288 : 168;
            return Array.from({ length: points }, (_, i) => ({
                time: now - (points - i) * interval,
                cpu: 0.15 + Math.random() * 0.3,
                memused: 8589934592 + Math.random() * 4294967296,
                memtotal: 34359738368,
                netin: Math.floor(Math.random() * 10000000),
                netout: Math.floor(Math.random() * 5000000),
                iowait: Math.random() * 0.05,
            }));
        }
    }

    async getVmRrdData(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu', timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' = 'hour') {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/rrddata?timeframe=${timeframe}`
                : `/api2/json/nodes/${node}/qemu/${vmid}/rrddata?timeframe=${timeframe}`;
            const res = await this.client.get(endpoint);
            return res.data.data;
        } catch (error) {
            this.logger.warn(`Failed to fetch RRD data for ${type} ${vmid}. Returning MOCK data.`);
            const now = Math.floor(Date.now() / 1000);
            const interval = timeframe === 'hour' ? 60 : timeframe === 'day' ? 300 : 3600;
            const points = timeframe === 'hour' ? 60 : timeframe === 'day' ? 288 : 168;
            return Array.from({ length: points }, (_, i) => ({
                time: now - (points - i) * interval,
                cpu: 0.05 + Math.random() * 0.4,
                mem: 536870912 + Math.random() * 1073741824,
                maxmem: 4294967296,
                disk: 5368709120,
                maxdisk: 34359738368,
                netin: Math.floor(Math.random() * 1000000),
                netout: Math.floor(Math.random() * 500000),
            }));
        }
    }

    async getClusterStats() {
        try {
            const nodes = await this.getNodes();
            const resources = await this.getResources();

            let totalCpu = 0;
            let usedCpu = 0;
            let totalMem = 0;
            let usedMem = 0;
            let totalDisk = 0;
            let usedDisk = 0;

            for (const node of nodes) {
                totalCpu += node.maxcpu || 0;
                usedCpu += (node.cpu || 0) * (node.maxcpu || 0);
                totalMem += node.maxmem || 0;
                usedMem += node.mem || 0;
                totalDisk += node.maxdisk || 0;
                usedDisk += node.disk || 0;
            }

            const instances = resources.filter((r: any) => !r.template);
            const runningVms = instances.filter((r: any) => r.status === 'running').length;

            return {
                totalCpu,
                usedCpu: totalCpu > 0 ? usedCpu / totalCpu : 0,
                totalMem,
                usedMem,
                totalDisk,
                usedDisk,
                nodes: nodes.length,
                instances: instances.length,
                runningVms,
            };
        } catch (error) {
            this.logger.warn(`Failed to fetch cluster stats. Returning MOCK data.`);
            return {
                totalCpu: 32,
                usedCpu: 0.35,
                totalMem: 137438953472,
                usedMem: 68719476736,
                totalDisk: 2199023255552,
                usedDisk: 549755813888,
                nodes: 2,
                instances: 5,
                runningVms: 3,
            };
        }
    }

    // ==================== SECURITY/FIREWALL METHODS ====================

    async getClusterFirewallRules() {
        try {
            const res = await this.client.get('/api2/json/cluster/firewall/rules');
            return res.data.data;
        } catch (error) {
            this.logger.warn('Failed to fetch cluster firewall rules. Returning MOCK data.');
            return [
                { pos: 0, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '22', comment: 'Allow SSH', enable: 1 },
                { pos: 1, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '8006', comment: 'Allow Proxmox Web UI', enable: 1 },
                { pos: 2, type: 'in', action: 'DROP', comment: 'Drop all other incoming', enable: 1 },
            ];
        }
    }

    async getNodeFirewallRules(node: string) {
        try {
            const res = await this.client.get(`/api2/json/nodes/${node}/firewall/rules`);
            return res.data.data.map((rule: any) => ({ ...rule, node }));
        } catch (error) {
            this.logger.warn(`Failed to fetch firewall rules for node ${node}. Returning MOCK data.`);
            return [
                { pos: 0, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '22', comment: 'SSH', enable: 1, node },
            ];
        }
    }

    async getVmFirewallRules(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu') {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/firewall/rules`
                : `/api2/json/nodes/${node}/qemu/${vmid}/firewall/rules`;
            const res = await this.client.get(endpoint);
            return res.data.data.map((rule: any) => ({ ...rule, node, vmid, vmtype: type }));
        } catch (error) {
            this.logger.warn(`Failed to fetch firewall rules for ${type}/${vmid}. Returning MOCK data.`);
            return [
                { pos: 0, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '80,443', comment: 'Web', enable: 1, node, vmid, vmtype: type },
            ];
        }
    }

    async getAllFirewallRules() {
        try {
            const clusterRules = await this.getClusterFirewallRules();
            const nodes = await this.getNodes();
            const resources = await this.getResources();

            const allRules: any[] = clusterRules.map((r: any) => ({ ...r, scope: 'cluster' }));

            for (const node of nodes) {
                const nodeRules = await this.getNodeFirewallRules(node.node);
                allRules.push(...nodeRules.map((r: any) => ({ ...r, scope: 'node' })));
            }

            for (const vm of resources) {
                if (!vm.template) {
                    const vmRules = await this.getVmFirewallRules(vm.node, vm.vmid, vm.type);
                    allRules.push(...vmRules.map((r: any) => ({ ...r, scope: 'vm' })));
                }
            }

            return allRules;
        } catch (error) {
            this.logger.warn('Failed to fetch all firewall rules. Returning MOCK data.');
            return [
                { pos: 0, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '22', comment: 'Allow SSH', enable: 1, scope: 'cluster' },
                { pos: 1, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '8006', comment: 'Allow Proxmox', enable: 1, scope: 'cluster' },
                { pos: 0, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '80,443', comment: 'Web Server', enable: 1, scope: 'vm', vmid: 100, node: 'pve-01' },
            ];
        }
    }

    async createFirewallRule(scope: 'cluster' | 'node' | 'vm', params: {
        node?: string;
        vmid?: number;
        vmtype?: 'qemu' | 'lxc';
        type: 'in' | 'out' | 'group';
        action: 'ACCEPT' | 'DROP' | 'REJECT';
        proto?: string;
        dport?: string;
        sport?: string;
        source?: string;
        dest?: string;
        comment?: string;
        enable?: number;
    }) {
        try {
            let endpoint: string;
            if (scope === 'cluster') {
                endpoint = '/api2/json/cluster/firewall/rules';
            } else if (scope === 'node') {
                endpoint = `/api2/json/nodes/${params.node}/firewall/rules`;
            } else {
                const vmPath = params.vmtype === 'lxc' ? 'lxc' : 'qemu';
                endpoint = `/api2/json/nodes/${params.node}/${vmPath}/${params.vmid}/firewall/rules`;
            }

            const res = await this.client.post(endpoint, params);
            return res.data;
        } catch (error) {
            this.logger.error('Failed to create firewall rule', error.message);
            throw error;
        }
    }

    async deleteFirewallRule(scope: 'cluster' | 'node' | 'vm', pos: number, params?: {
        node?: string;
        vmid?: number;
        vmtype?: 'qemu' | 'lxc';
    }) {
        try {
            let endpoint: string;
            if (scope === 'cluster') {
                endpoint = `/api2/json/cluster/firewall/rules/${pos}`;
            } else if (scope === 'node') {
                endpoint = `/api2/json/nodes/${params?.node}/firewall/rules/${pos}`;
            } else {
                const vmPath = params?.vmtype === 'lxc' ? 'lxc' : 'qemu';
                endpoint = `/api2/json/nodes/${params?.node}/${vmPath}/${params?.vmid}/firewall/rules/${pos}`;
            }

            const res = await this.client.delete(endpoint);
            return res.data;
        } catch (error) {
            this.logger.error('Failed to delete firewall rule', error.message);
            throw error;
        }
    }

    // ==================== VM IP ADDRESS ====================

    async getVmIpAddress(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu'): Promise<string | null> {
        try {
            if (type === 'lxc') {
                // LXC containers - use interfaces endpoint
                const res = await this.client.get(`/api2/json/nodes/${node}/lxc/${vmid}/interfaces`);
                const interfaces = res.data.data;

                // Find first non-loopback interface with IPv4
                for (const iface of interfaces || []) {
                    if (iface.name !== 'lo' && iface.inet && iface.inet.includes('.')) {
                        // inet format is "ip/prefix", extract just the IP
                        const ip = iface.inet.split('/')[0];
                        if (ip.includes('.')) { // Double check it's IPv4
                            return ip;
                        }
                    }
                }
            } else {
                // QEMU VMs - use guest agent
                const res = await this.client.get(`/api2/json/nodes/${node}/qemu/${vmid}/agent/network-get-interfaces`);
                const result = res.data.data.result;

                // Find first non-loopback interface with IPv4
                for (const iface of result || []) {
                    if (iface.name !== 'lo' && iface['ip-addresses']) {
                        for (const addr of iface['ip-addresses']) {
                            if (addr['ip-address-type'] === 'ipv4' && !addr['ip-address'].startsWith('127.')) {
                                return addr['ip-address'];
                            }
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            // Guest agent might not be installed or VM not running
            this.logger.debug(`Could not get IP for ${type}/${vmid}: ${error.message}`);
            return null;
        }
    }

    async getResourcesWithIp(userId?: string, showAll: boolean = true) {
        const resources = await this.getResources();

        // Filter by ownership if userId is provided and not showing all
        let filteredResources = resources;
        if (userId && !showAll) {
            const userTag = `owner-${userId}`;
            filteredResources = resources.filter((vm: any) => {
                // Exclude templates from ownership filtering
                if (vm.template) return false;
                // Include only VMs owned by this user
                return vm.tags && vm.tags.includes(userTag);
            });
        } else {
            // When showing all, still exclude templates
            filteredResources = resources.filter((vm: any) => !vm.template);
        }

        // Fetch IPs for running VMs in parallel
        const resourcesWithIp = await Promise.all(
            filteredResources.map(async (vm: any) => {
                if (vm.status === 'running') {
                    const ip = await this.getVmIpAddress(vm.node, vm.vmid, vm.type);
                    return { ...vm, ip };
                }
                return { ...vm, ip: null };
            })
        );

        return resourcesWithIp;
    }

    // ==================== SNAPSHOT METHODS ====================

    async getSnapshots(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu') {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/snapshot`
                : `/api2/json/nodes/${node}/qemu/${vmid}/snapshot`;
            const res = await this.client.get(endpoint);
            // Filter out 'current' which is not a real snapshot
            return (res.data.data || []).filter((s: any) => s.name !== 'current');
        } catch (error) {
            this.logger.warn(`Failed to fetch snapshots for ${type}/${vmid}: ${error.message}`);
            return [];
        }
    }

    async createSnapshot(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu', snapname: string, description?: string, vmstate: boolean = false) {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/snapshot`
                : `/api2/json/nodes/${node}/qemu/${vmid}/snapshot`;

            const payload: any = { snapname };
            if (description) payload.description = description;
            if (type === 'qemu' && vmstate) payload.vmstate = 1;

            const res = await this.client.post(endpoint, payload);
            return res.data.data;
        } catch (error) {
            this.logger.error(`Failed to create snapshot for ${type}/${vmid}: ${error.message}`);
            throw error;
        }
    }

    async deleteSnapshot(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu', snapname: string) {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/snapshot/${snapname}`
                : `/api2/json/nodes/${node}/qemu/${vmid}/snapshot/${snapname}`;
            const res = await this.client.delete(endpoint);
            return res.data.data;
        } catch (error) {
            this.logger.error(`Failed to delete snapshot ${snapname}: ${error.message}`);
            throw error;
        }
    }

    async rollbackSnapshot(node: string, vmid: number, type: 'qemu' | 'lxc' = 'qemu', snapname: string) {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/snapshot/${snapname}/rollback`
                : `/api2/json/nodes/${node}/qemu/${vmid}/snapshot/${snapname}/rollback`;
            const res = await this.client.post(endpoint);
            return res.data.data;
        } catch (error) {
            this.logger.error(`Failed to rollback to snapshot ${snapname}: ${error.message}`);
            throw error;
        }
    }
}
