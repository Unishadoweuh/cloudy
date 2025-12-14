import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { PbsService } from './pbs.service';
import { ProxmoxService } from '../proxmox/proxmox.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pbs')
@UseGuards(JwtAuthGuard)
export class PbsController {
    constructor(
        private readonly pbsService: PbsService,
        @Inject(forwardRef(() => ProxmoxService))
        private readonly proxmoxService: ProxmoxService,
    ) { }

    // ==================== STATUS ====================

    @Get('status')
    async getStatus() {
        return this.pbsService.getPbsStatus();
    }

    // ==================== DATASTORES ====================

    @Get('datastores')
    async getDatastores() {
        return this.pbsService.getDatastores();
    }

    @Get('datastores/:id')
    async getDatastoreStatus(@Param('id') id: string) {
        return this.pbsService.getDatastoreStatus(id);
    }

    // ==================== BACKUPS ====================

    @Get('backups/:datastore')
    async getBackups(@Param('datastore') datastore: string) {
        return this.pbsService.getBackups(datastore);
    }

    @Get('snapshots/:datastore')
    async getSnapshots(
        @Param('datastore') datastore: string,
        @Query('backup-type') backupType: string,
        @Query('backup-id') backupId: string,
    ) {
        return this.pbsService.getSnapshots(datastore, backupType, backupId);
    }

    @Delete('backup')
    async deleteBackup(
        @Query('datastore') datastore: string,
        @Query('backup-type') backupType: string,
        @Query('backup-id') backupId: string,
        @Query('backup-time') backupTime: string,
    ) {
        await this.pbsService.deleteBackup(datastore, backupType, backupId, backupTime);
        return { success: true };
    }

    // ==================== MANUAL BACKUP (via PVE) ====================

    @Post('backup')
    async triggerBackup(
        @Body() body: {
            node: string;
            vmid: number;
            storage: string;
            type: 'qemu' | 'lxc';
            mode?: 'snapshot' | 'suspend' | 'stop';
        }
    ) {
        const pveClient = this.proxmoxService.getClient();
        const task = await this.pbsService.triggerBackup(
            pveClient,
            body.node,
            body.vmid,
            body.storage,
            body.type,
            body.mode || 'snapshot'
        );
        return { success: true, task };
    }

    // ==================== RESTORE (via PVE) ====================

    @Post('restore')
    async restoreBackup(
        @Body() body: {
            node: string;
            storage: string;
            archive: string;
            vmid: number;
            type: 'qemu' | 'lxc';
        }
    ) {
        const pveClient = this.proxmoxService.getClient();
        const task = await this.pbsService.restoreBackup(
            pveClient,
            body.node,
            body.storage,
            body.archive,
            body.vmid,
            body.type
        );
        return { success: true, task };
    }

    // ==================== BACKUP JOBS (via PVE) ====================

    @Get('jobs')
    async getBackupJobs() {
        const pveClient = this.proxmoxService.getClient();
        return this.pbsService.getBackupJobsFromPve(pveClient);
    }

    @Post('jobs')
    async createBackupJob(
        @Body() body: {
            vmid?: string;
            storage: string;
            schedule?: string;
            mode?: 'snapshot' | 'suspend' | 'stop';
            mailnotification?: 'always' | 'failure';
            mailto?: string;
            compress?: 'zstd' | 'lzo' | 'gzip' | 'none';
            notes?: string;
            enabled?: boolean;
        }
    ) {
        const pveClient = this.proxmoxService.getClient();
        const result = await this.pbsService.createBackupJobOnPve(pveClient, body);
        return { success: true, data: result };
    }

    @Delete('jobs/:id')
    async deleteBackupJob(@Param('id') id: string) {
        const pveClient = this.proxmoxService.getClient();
        await this.pbsService.deleteBackupJobOnPve(pveClient, id);
        return { success: true };
    }
}
