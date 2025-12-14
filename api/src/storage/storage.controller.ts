import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProxmoxService } from '../proxmox/proxmox.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
    constructor(
        private readonly proxmoxService: ProxmoxService,
        private readonly notificationsService: NotificationsService
    ) { }

    @Get('pools')
    async getStoragePools(@Query('node') node?: string) {
        return this.proxmoxService.getStoragePools(node);
    }

    @Get('volumes')
    async getVolumes(
        @Query('node') node?: string,
        @Query('storage') storage?: string,
    ) {
        if (node && storage) {
            return this.proxmoxService.getStorageContent(node, storage, 'images');
        }
        return this.proxmoxService.getAllVolumes();
    }

    @Get('volumes/:node/:storage')
    async getStorageVolumes(
        @Param('node') node: string,
        @Param('storage') storage: string,
    ) {
        return this.proxmoxService.getStorageContent(node, storage, 'images');
    }

    @Post('volumes')
    async createVolume(
        @Body() body: { node: string; storage: string; filename: string; size: string; format?: string },
        @Request() req: any
    ) {
        const { node, storage, filename, size, format } = body;
        const result = await this.proxmoxService.createVolume(node, storage, filename, size, format);

        await this.notificationsService.create(
            req.user.id,
            'Volume Created',
            `Created volume "${filename}" on ${node}/${storage}. Size: ${size}`,
            'success'
        );

        return result;
    }

    @Delete('volumes/:node/:storage/:volume')
    async deleteVolume(
        @Param('node') node: string,
        @Param('storage') storage: string,
        @Param('volume') volume: string,
        @Request() req: any
    ) {
        const result = await this.proxmoxService.deleteVolume(node, storage, volume);

        await this.notificationsService.create(
            req.user.id,
            'Volume Deleted',
            `Deleted volume "${volume}" from ${node}/${storage}.`,
            'info'
        );

        return result;
    }
}
