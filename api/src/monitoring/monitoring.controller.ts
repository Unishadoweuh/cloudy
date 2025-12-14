import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProxmoxService } from '../proxmox/proxmox.service';

@Controller('monitoring')
export class MonitoringController {
    constructor(private readonly proxmoxService: ProxmoxService) { }

    @Get('cluster')
    async getClusterStats() {
        return this.proxmoxService.getClusterStats();
    }

    @Get('nodes/:node')
    async getNodeMetrics(
        @Param('node') node: string,
        @Query('timeframe') timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year',
    ) {
        return this.proxmoxService.getNodeRrdData(node, timeframe || 'hour');
    }

    @Get('instances/:vmid')
    async getInstanceMetrics(
        @Param('vmid') vmid: string,
        @Query('node') node: string,
        @Query('type') type?: 'qemu' | 'lxc',
        @Query('timeframe') timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year',
    ) {
        return this.proxmoxService.getVmRrdData(
            node,
            parseInt(vmid, 10),
            type || 'qemu',
            timeframe || 'hour',
        );
    }
}
