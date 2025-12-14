import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProxmoxService } from '../proxmox/proxmox.service';

@Controller('network')
export class NetworkController {
    constructor(private readonly proxmoxService: ProxmoxService) { }

    @Get('interfaces')
    async getInterfaces(@Query('node') node?: string) {
        if (node) {
            return this.proxmoxService.getNetworkInterfaces(node);
        }
        return this.proxmoxService.getAllNetworks();
    }

    @Get('interfaces/:node')
    async getNodeInterfaces(@Param('node') node: string) {
        return this.proxmoxService.getNetworkInterfaces(node);
    }

    @Get('bridges')
    async getBridges() {
        return this.proxmoxService.getNetworkBridges();
    }
}
