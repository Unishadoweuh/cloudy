import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { ProxmoxService } from '../proxmox/proxmox.service';

@Controller('security')
export class SecurityController {
    constructor(private readonly proxmoxService: ProxmoxService) { }

    @Get('rules')
    async getAllRules(@Query('scope') scope?: string) {
        if (scope === 'cluster') {
            return this.proxmoxService.getClusterFirewallRules();
        }
        return this.proxmoxService.getAllFirewallRules();
    }

    @Get('rules/node/:node')
    async getNodeRules(@Param('node') node: string) {
        return this.proxmoxService.getNodeFirewallRules(node);
    }

    @Get('rules/vm/:vmid')
    async getVmRules(
        @Param('vmid') vmid: string,
        @Query('node') node: string,
        @Query('type') type?: 'qemu' | 'lxc',
    ) {
        return this.proxmoxService.getVmFirewallRules(node, parseInt(vmid, 10), type || 'qemu');
    }

    @Post('rules')
    async createRule(@Body() body: {
        scope: 'cluster' | 'node' | 'vm';
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
        return this.proxmoxService.createFirewallRule(body.scope, body);
    }

    @Delete('rules/:pos')
    async deleteRule(
        @Param('pos') pos: string,
        @Query('scope') scope: 'cluster' | 'node' | 'vm',
        @Query('node') node?: string,
        @Query('vmid') vmid?: string,
        @Query('vmtype') vmtype?: 'qemu' | 'lxc',
    ) {
        return this.proxmoxService.deleteFirewallRule(scope, parseInt(pos, 10), {
            node,
            vmid: vmid ? parseInt(vmid, 10) : undefined,
            vmtype,
        });
    }
}
