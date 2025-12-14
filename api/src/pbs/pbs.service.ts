import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

@Injectable()
export class PbsService {
    private readonly logger = new Logger(PbsService.name);
    private client: AxiosInstance;
    private readonly pbsUrl: string;
    private readonly pbsToken: string;

    constructor() {
        this.pbsUrl = process.env.PBS_API_URL || '';
        this.pbsToken = process.env.PBS_API_TOKEN || '';

        if (!this.pbsUrl || !this.pbsToken) {
            this.logger.warn('PBS_API_URL or PBS_API_TOKEN not configured. PBS features will be unavailable.');
        } else {
            this.logger.log(`PBS configured: ${this.pbsUrl}`);
        }

        // PBS token format: user@realm!tokenname=secret
        // Authorization header format: PBSAPIToken=user@realm!tokenname:secret
        // We need to replace the = between tokenname and secret with :
        const formattedToken = this.pbsToken.replace(/^(.+!)([^=]+)=(.+)$/, '$1$2:$3');
        this.logger.log(`PBS Token ID: ${formattedToken.split(':')[0]}`);

        this.client = axios.create({
            baseURL: this.pbsUrl,
            headers: {
                'Authorization': `PBSAPIToken=${formattedToken}`,
                'Content-Type': 'application/json',
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Allow self-signed certs
            }),
        });
    }

    private isConfigured(): boolean {
        return !!(this.pbsUrl && this.pbsToken);
    }

    // ==================== DATASTORES ====================

    async getDatastores(): Promise<any[]> {
        if (!this.isConfigured()) {
            this.logger.warn('PBS not configured, returning empty datastores');
            return [];
        }

        try {
            const res = await this.client.get('/api2/json/admin/datastore');
            return res.data?.data || [];
        } catch (error) {
            this.logger.error(`Error fetching PBS datastores: ${error.message}`);
            return [];
        }
    }

    async getDatastoreStatus(datastore: string): Promise<any> {
        if (!this.isConfigured()) return null;

        try {
            const res = await this.client.get(`/api2/json/admin/datastore/${datastore}/status`);
            return res.data?.data || null;
        } catch (error) {
            this.logger.error(`Error fetching datastore status: ${error.message}`);
            return null;
        }
    }

    // ==================== BACKUPS ====================

    async getBackups(datastore: string): Promise<any[]> {
        if (!this.isConfigured()) return [];

        try {
            const res = await this.client.get(`/api2/json/admin/datastore/${datastore}/groups`);
            return res.data?.data || [];
        } catch (error) {
            this.logger.error(`Error fetching backups: ${error.message}`);
            return [];
        }
    }

    async getSnapshots(datastore: string, backupType: string, backupId: string): Promise<any[]> {
        if (!this.isConfigured()) return [];

        try {
            const res = await this.client.get(`/api2/json/admin/datastore/${datastore}/snapshots`, {
                params: {
                    'backup-type': backupType,
                    'backup-id': backupId,
                }
            });
            return res.data?.data || [];
        } catch (error) {
            this.logger.error(`Error fetching snapshots: ${error.message}`);
            return [];
        }
    }

    async deleteBackup(datastore: string, backupType: string, backupId: string, backupTime: string): Promise<boolean> {
        if (!this.isConfigured()) return false;

        try {
            await this.client.delete(`/api2/json/admin/datastore/${datastore}/snapshots`, {
                params: {
                    'backup-type': backupType,
                    'backup-id': backupId,
                    'backup-time': backupTime,
                }
            });
            return true;
        } catch (error) {
            this.logger.error(`Error deleting backup: ${error.message}`);
            throw error;
        }
    }

    // ==================== BACKUP JOBS (via PVE) ====================
    // Note: Backup jobs are typically managed via Proxmox VE, not PBS directly
    // PBS stores the backups, PVE schedules them

    async getBackupJobsFromPve(pveClient: AxiosInstance): Promise<any[]> {
        try {
            const res = await pveClient.get('/api2/json/cluster/backup');
            return res.data?.data || [];
        } catch (error) {
            this.logger.error(`Error fetching backup jobs from PVE: ${error.message}`);
            return [];
        }
    }

    async createBackupJobOnPve(pveClient: AxiosInstance, config: {
        vmid?: string;
        storage: string;
        schedule?: string;
        mode?: 'snapshot' | 'suspend' | 'stop';
        mailnotification?: 'always' | 'failure';
        mailto?: string;
        compress?: 'zstd' | 'lzo' | 'gzip' | 'none';
        notes?: string;
        enabled?: boolean;
    }): Promise<any> {
        try {
            const res = await pveClient.post('/api2/json/cluster/backup', config);
            return res.data?.data || null;
        } catch (error) {
            this.logger.error(`Error creating backup job: ${error.message}`);
            throw error;
        }
    }

    async deleteBackupJobOnPve(pveClient: AxiosInstance, jobId: string): Promise<boolean> {
        try {
            await pveClient.delete(`/api2/json/cluster/backup/${jobId}`);
            return true;
        } catch (error) {
            this.logger.error(`Error deleting backup job: ${error.message}`);
            throw error;
        }
    }

    // ==================== MANUAL BACKUP (via PVE) ====================

    async triggerBackup(pveClient: AxiosInstance, node: string, vmid: number, storage: string, type: 'qemu' | 'lxc', mode: 'snapshot' | 'suspend' | 'stop' = 'snapshot'): Promise<string> {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc/${vmid}/status/backup`
                : `/api2/json/nodes/${node}/qemu/${vmid}/status/backup`;

            // Alternative: use vzdump directly
            const res = await pveClient.post(`/api2/json/nodes/${node}/vzdump`, {
                vmid: vmid,
                storage: storage,
                mode: mode,
                compress: 'zstd',
            });
            return res.data?.data || 'UPID:backup:triggered';
        } catch (error) {
            this.logger.error(`Error triggering backup: ${error.message}`);
            throw error;
        }
    }

    // ==================== RESTORE (via PVE) ====================

    async restoreBackup(pveClient: AxiosInstance, node: string, storage: string, archive: string, vmid: number, type: 'qemu' | 'lxc'): Promise<string> {
        try {
            const endpoint = type === 'lxc'
                ? `/api2/json/nodes/${node}/lxc`
                : `/api2/json/nodes/${node}/qemu`;

            const res = await pveClient.post(endpoint, {
                vmid: vmid,
                archive: archive,
                storage: storage,
            });
            return res.data?.data || 'UPID:restore:triggered';
        } catch (error) {
            this.logger.error(`Error restoring backup: ${error.message}`);
            throw error;
        }
    }

    // ==================== PBS STATUS ====================

    async getPbsStatus(): Promise<any> {
        if (!this.isConfigured()) {
            return { configured: false, status: 'not_configured' };
        }

        try {
            const res = await this.client.get('/api2/json/version');
            return {
                configured: true,
                status: 'online',
                version: res.data?.data?.version,
                release: res.data?.data?.release,
            };
        } catch (error) {
            return {
                configured: true,
                status: 'offline',
                error: error.message,
            };
        }
    }
}
