import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProxmoxService } from '../proxmox/proxmox.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BillingService } from '../billing/billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingMode } from '@prisma/client';

@Controller('compute')
@UseGuards(JwtAuthGuard)
export class ComputeController {
    constructor(
        private readonly proxmoxService: ProxmoxService,
        private readonly notificationsService: NotificationsService,
        private readonly billingService: BillingService
    ) { }

    @Get('instances')
    async getInstances(@Request() req: any, @Query('showAll') showAll?: string) {
        const user = req.user;
        // Admins can see all if showAll=true, users always see only their own
        const showAllInstances = showAll === 'true' && user.role === 'ADMIN';
        const vms = await this.proxmoxService.getResourcesWithIp(user.id, showAllInstances);
        return vms;
    }

    @Get('nodes')
    async getNodes() {
        return this.proxmoxService.getNodes();
    }

    @Post('instances/:id/action')
    async vmAction(
        @Param('id') id: string,
        @Body('action') action: string,
        @Query('node') node: string,
        @Query('type') type: 'qemu' | 'lxc',
        @Request() req: any
    ) {
        // Extract numeric ID if format is "qemu/100" or "lxc/100"
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        // Detect type from ID format if not provided
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');

        const result = await this.proxmoxService.vmAction(node, vmid, action, instanceType);

        await this.notificationsService.create(
            req.user.id,
            'Instance Action',
            `Triggered ${action} on ${instanceType} ${vmid}. Task: ${result}`,
            'info'
        );

        return result;
    }

    @Get('instances/:id/vnc')
    async getVnc(
        @Param('id') id: string,
        @Query('node') node: string,
        @Query('type') type?: 'qemu' | 'lxc'
    ) {
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        // Detect type from ID format if not provided
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');
        return this.proxmoxService.getVncTicket(node, vmid, instanceType);
    }

    @Get('templates')
    async getTemplates(@Query('type') type?: 'qemu' | 'lxc') {
        return this.proxmoxService.getTemplates(type);
    }

    @Post('instances')
    async createInstance(@Body() body: any, @Request() req: any) {
        const user = req.user;

        // 1. Check Allowed Nodes
        if (user.allowedNodes && user.allowedNodes.length > 0 && !user.allowedNodes.includes(body.node)) {
            throw new ForbiddenException(`Vous n'êtes pas autorisé à déployer sur le nœud "${body.node}". Nœuds autorisés: ${user.allowedNodes.join(', ')}`);
        }

        // 2. Check Resource Quotas
        const usage = await this.proxmoxService.getUserResources(user.id);
        const requestedCores = parseInt(body.cores) || 1;
        const requestedMemory = parseInt(body.memory) || 512;

        if (usage.instances >= user.maxInstances) {
            throw new BadRequestException(`Quota d'instances atteint (${usage.instances}/${user.maxInstances}). Supprimez une instance existante ou demandez une augmentation de quota.`);
        }
        if (usage.cpu + requestedCores > user.maxCpu) {
            throw new BadRequestException(`Quota CPU dépassé. Disponible: ${user.maxCpu - usage.cpu} cœurs, demandé: ${requestedCores}. (Limite: ${user.maxCpu} cœurs)`);
        }
        if (usage.memory + requestedMemory > user.maxMemory) {
            throw new BadRequestException(`Quota mémoire dépassé. Disponible: ${user.maxMemory - usage.memory} MB, demandé: ${requestedMemory} MB. (Limite: ${user.maxMemory} MB)`);
        }

        // 3. Check Credit Balance
        const requestedDisk = parseInt(body.disk) || 20;
        const billingMode: BillingMode = body.billingMode === 'RESERVED' ? 'RESERVED' : 'PAYG';
        const estimate = await this.billingService.getEstimate(requestedCores, requestedMemory, requestedDisk);
        const requiredCredits = billingMode === 'RESERVED' ? estimate.monthly.total : estimate.hourly.total;

        const hasCredits = await this.billingService.hasSufficientCredits(user.id, requiredCredits);
        if (!hasCredits) {
            const balance = await this.billingService.getBalance(user.id);
            throw new BadRequestException(
                `Crédits insuffisants. Solde: €${balance.balance.toFixed(2)}, Requis: €${requiredCredits.toFixed(2)}. ` +
                `Contactez un administrateur pour obtenir des crédits.`
            );
        }

        let result;
        const tag = `owner-${user.id}`;

        // Simple DTO validation could be added here
        if (body.type === 'lxc') {
            result = await this.proxmoxService.createLXC(body.node, body.templateId, body.name, body.cores, body.memory, body.password, body.sshkeys, tag);
        } else {
            // Default to QEMU
            result = await this.proxmoxService.createQemu(body.node, body.templateId, body.name, body.cores, body.memory, body.ciuser, body.cipassword, body.sshkeys, tag);
        }

        await this.notificationsService.create(
            req.user.id,
            'Instance Created',
            `Created ${body.type} instance "${body.name}". Task: ${result.task}`,
            'success'
        );

        // 4. Start usage tracking
        try {
            await this.billingService.startUsageTracking(
                user.id,
                result.vmid,
                body.node,
                body.type || 'qemu',
                body.name,
                requestedCores,
                requestedMemory,
                requestedDisk,
                billingMode
            );

            // Deduct initial credit for reserved instances
            if (billingMode === 'RESERVED') {
                await this.billingService.deductCredits(
                    user.id,
                    estimate.monthly.total,
                    `Monthly reservation: ${body.name}`,
                    { vmid: result.vmid, billingMode }
                );
            }
        } catch (err) {
            // Log but don't fail the instance creation
            console.error('Failed to start billing tracking:', err.message);
        }

        return result;
    }

    @Delete('instances/:id')
    async deleteInstance(
        @Param('id') id: string,
        @Query('node') node: string,
        @Query('type') type: 'qemu' | 'lxc',
        @Request() req: any
    ) {
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');

        let result;
        if (instanceType === 'lxc') {
            result = await this.proxmoxService.deleteLXC(node, vmid);
        } else {
            result = await this.proxmoxService.deleteQemu(node, vmid);
        }

        await this.notificationsService.create(
            req.user.id,
            'Instance Deleted',
            `Deleted ${instanceType} instance ${vmid}. Task: ${result}`,
            'warning'
        );

        return { success: true, task: result };
    }

    // ==================== SNAPSHOT ENDPOINTS ====================

    @Get('instances/:id/snapshots')
    async getSnapshots(
        @Param('id') id: string,
        @Query('node') node: string,
        @Query('type') type?: 'qemu' | 'lxc'
    ) {
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');
        return this.proxmoxService.getSnapshots(node, vmid, instanceType);
    }

    @Post('instances/:id/snapshots')
    async createSnapshot(
        @Param('id') id: string,
        @Body() body: { snapname: string; description?: string; vmstate?: boolean },
        @Query('node') node: string,
        @Request() req: any,
        @Query('type') type?: 'qemu' | 'lxc'
    ) {
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');

        const result = await this.proxmoxService.createSnapshot(
            node, vmid, instanceType,
            body.snapname, body.description, body.vmstate || false
        );

        await this.notificationsService.create(
            req.user.id,
            'Snapshot Created',
            `Created snapshot "${body.snapname}" for ${instanceType} ${vmid}`,
            'success'
        );

        return result;
    }

    @Delete('instances/:id/snapshots/:snapname')
    async deleteSnapshot(
        @Param('id') id: string,
        @Param('snapname') snapname: string,
        @Query('node') node: string,
        @Request() req: any,
        @Query('type') type?: 'qemu' | 'lxc'
    ) {
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');

        const result = await this.proxmoxService.deleteSnapshot(node, vmid, instanceType, snapname);

        await this.notificationsService.create(
            req.user.id,
            'Snapshot Deleted',
            `Deleted snapshot "${snapname}" from ${instanceType} ${vmid}`,
            'warning'
        );

        return { success: true, task: result };
    }

    @Post('instances/:id/snapshots/:snapname/rollback')
    async rollbackSnapshot(
        @Param('id') id: string,
        @Param('snapname') snapname: string,
        @Query('node') node: string,
        @Request() req: any,
        @Query('type') type?: 'qemu' | 'lxc'
    ) {
        const vmid = parseInt(id.replace(/\D/g, ''), 10);
        const instanceType = type || (id.startsWith('lxc') ? 'lxc' : 'qemu');

        const result = await this.proxmoxService.rollbackSnapshot(node, vmid, instanceType, snapname);

        await this.notificationsService.create(
            req.user.id,
            'Snapshot Rollback',
            `Rolled back ${instanceType} ${vmid} to snapshot "${snapname}"`,
            'info'
        );

        return { success: true, task: result };
    }
}

