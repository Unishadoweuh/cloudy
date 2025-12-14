import axios, { AxiosError } from 'axios';
import type {
    Instance,
    Node,
    VncTicket,
    CreateInstancePayload,
    CreateInstanceResponse,
    VmAction,
    StoragePool,
    Volume,
    NetworkInterface,
    ClusterStats,
    RrdDataPoint,
    FirewallRule,
    AppNotification,
    PbsStatus,
    Datastore,
    DatastoreStatus,
    BackupGroup,
    BackupSnapshot,
    BackupJob,
    CreateBackupPayload,
    RestoreBackupPayload,
} from './types';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cp.unishadow.ovh';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Error handler
const handleApiError = (error: unknown): never => {
    if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`API Error: ${message}`);
    }
    throw error;
};

/**
 * Fetch all instances (VMs and LXC containers)
 * @param showAll - If true (admin only), shows all instances instead of just user's own
 */
export async function getInstances(showAll: boolean = false): Promise<Instance[]> {
    try {
        const response = await api.get<Instance[]>('/compute/instances', {
            params: showAll ? { showAll: 'true' } : {}
        });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Fetch all Proxmox nodes
 */
export async function getNodes(): Promise<Node[]> {
    try {
        const response = await api.get<Node[]>('/compute/nodes');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Fetch templates, optionally filtered by type
 */
export async function getTemplates(type?: 'qemu' | 'lxc'): Promise<Instance[]> {
    try {
        const params = type ? { type } : {};
        const response = await api.get<Instance[]>('/compute/templates', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Perform an action on a VM/LXC (start, stop, reset, shutdown)
 */
export async function vmAction(
    id: string,
    node: string,
    action: VmAction,
    type?: 'qemu' | 'lxc'
): Promise<string> {
    try {
        const params: Record<string, string> = { node };
        if (type) params.type = type;
        const response = await api.post(
            `/compute/instances/${id}/action`,
            { action },
            { params }
        );
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Get VNC/terminal ticket for console access
 */
export async function getVnc(
    id: string,
    node: string,
    type?: 'qemu' | 'lxc'
): Promise<VncTicket & { wsUrl?: string }> {
    try {
        const params: Record<string, string> = { node };
        if (type) params.type = type;
        const response = await api.get<VncTicket>(`/compute/instances/${id}/vnc`, {
            params,
        });

        // Build WebSocket proxy URL for our API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const apiHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
        const wsUrl = `${wsProtocol}://${apiHost}/api/ws/vnc?node=${node}&vmid=${id}&type=${type || 'qemu'}`;

        return {
            ...response.data,
            wsUrl,
        };
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Create a new instance (VM or LXC)
 */
export async function createInstance(
    payload: CreateInstancePayload
): Promise<CreateInstanceResponse> {
    try {
        const response = await api.post<CreateInstanceResponse>(
            '/compute/instances',
            payload
        );
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Delete an instance (VM or LXC)
 */
export async function deleteInstance(
    id: string | number,
    node: string,
    type: 'qemu' | 'lxc'
): Promise<{ success: boolean; task: string }> {
    try {
        const response = await api.delete<{ success: boolean; task: string }>(
            `/compute/instances/${id}`,
            { params: { node, type } }
        );
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

// ==================== STORAGE API ====================

/**
 * Fetch all storage pools
 */
export async function getStoragePools(node?: string): Promise<StoragePool[]> {
    try {
        const params = node ? { node } : {};
        const response = await api.get<StoragePool[]>('/storage/pools', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Fetch all volumes
 */
export async function getVolumes(node?: string, storage?: string): Promise<Volume[]> {
    try {
        const params: Record<string, string> = {};
        if (node) params.node = node;
        if (storage) params.storage = storage;
        const response = await api.get<Volume[]>('/storage/volumes', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Delete a volume
 */
export async function deleteVolume(node: string, storage: string, volume: string): Promise<void> {
    try {
        await api.delete(`/storage/volumes/${node}/${storage}/${encodeURIComponent(volume)}`);
    } catch (error) {
        return handleApiError(error);
    }
}

// ==================== NETWORK API ====================

/**
 * Fetch all network interfaces
 */
export async function getNetworkInterfaces(node?: string): Promise<NetworkInterface[]> {
    try {
        const params = node ? { node } : {};
        const response = await api.get<NetworkInterface[]>('/network/interfaces', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Fetch all network bridges
 */
export async function getNetworkBridges(): Promise<NetworkInterface[]> {
    try {
        const response = await api.get<NetworkInterface[]>('/network/bridges');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

// ==================== MONITORING API ====================

/**
 * Fetch cluster stats
 */
export async function getClusterStats(): Promise<ClusterStats> {
    try {
        const response = await api.get<ClusterStats>('/monitoring/cluster');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Fetch node RRD metrics
 */
export async function getNodeMetrics(
    node: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' = 'hour'
): Promise<RrdDataPoint[]> {
    try {
        const response = await api.get<RrdDataPoint[]>(`/monitoring/nodes/${node}`, {
            params: { timeframe },
        });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Fetch instance RRD metrics
 */
export async function getInstanceMetrics(
    vmid: number,
    node: string,
    type: 'qemu' | 'lxc' = 'qemu',
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' = 'hour'
): Promise<RrdDataPoint[]> {
    try {
        const response = await api.get<RrdDataPoint[]>(`/monitoring/instances/${vmid}`, {
            params: { node, type, timeframe },
        });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

// ==================== SECURITY API ====================

/**
 * Fetch all firewall rules
 */
export async function getFirewallRules(scope?: 'cluster' | 'node' | 'vm'): Promise<FirewallRule[]> {
    try {
        const params = scope ? { scope } : {};
        const response = await api.get<FirewallRule[]>('/security/rules', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Create a firewall rule
 */
export async function createFirewallRule(rule: Partial<FirewallRule> & {
    scope: 'cluster' | 'node' | 'vm';
    type: 'in' | 'out' | 'group';
    action: 'ACCEPT' | 'DROP' | 'REJECT';
}): Promise<void> {
    try {
        await api.post('/security/rules', rule);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Delete a firewall rule
 */
export async function deleteFirewallRule(
    pos: number,
    scope: 'cluster' | 'node' | 'vm',
    params?: { node?: string; vmid?: number; vmtype?: 'qemu' | 'lxc' }
): Promise<void> {
    try {
        await api.delete(`/security/rules/${pos}`, {
            params: { scope, ...params },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
// ==================== AUTH API ====================

/**
 * Get current user profile
 */
export async function getMe(): Promise<any> {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

export async function getUsers(): Promise<any[]> {
    try {
        const response = await api.get('/auth/users');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

export async function updateUserRole(id: string, role: 'USER' | 'ADMIN'): Promise<any> {
    try {
        const response = await api.patch(`/auth/users/${id}/role`, { role });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Update user limits
 */
export async function updateUserLimits(id: string, limits: { maxCpu: number; maxMemory: number; maxDisk: number; maxInstances: number; allowedNodes: string[] }): Promise<any> {
    try {
        const response = await api.patch(`/auth/users/${id}/limits`, limits);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

export async function deleteUser(id: string): Promise<any> {
    try {
        const response = await api.delete(`/auth/users/${id}`);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

// ==================== NOTIFICATIONS API ====================

export async function getNotifications(): Promise<AppNotification[]> {
    try {
        const response = await api.get<AppNotification[]>('/notifications');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

export async function markNotificationRead(id: string): Promise<void> {
    try {
        await api.patch(`/notifications/${id}/read`);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function markAllNotificationsRead(): Promise<void> {
    try {
        await api.patch('/notifications/read-all');
    } catch (error) {
        return handleApiError(error);
    }
}

export async function deleteNotification(id: string): Promise<void> {
    try {
        await api.delete(`/notifications/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}

// ==================== PBS API ====================

/**
 * Get PBS server status
 */
export async function getPbsStatus(): Promise<PbsStatus> {
    try {
        const response = await api.get<PbsStatus>('/pbs/status');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Get all datastores
 */
export async function getDatastores(): Promise<Datastore[]> {
    try {
        const response = await api.get<Datastore[]>('/pbs/datastores');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Get datastore status/usage
 */
export async function getDatastoreStatus(datastore: string): Promise<DatastoreStatus | null> {
    try {
        const response = await api.get<DatastoreStatus>(`/pbs/datastores/${datastore}`);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Get backup groups in a datastore
 */
export async function getBackups(datastore: string): Promise<BackupGroup[]> {
    try {
        const response = await api.get<BackupGroup[]>(`/pbs/backups/${datastore}`);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Get snapshots for a backup group
 */
export async function getSnapshots(
    datastore: string,
    backupType: string,
    backupId: string
): Promise<BackupSnapshot[]> {
    try {
        const response = await api.get<BackupSnapshot[]>(`/pbs/snapshots/${datastore}`, {
            params: { 'backup-type': backupType, 'backup-id': backupId }
        });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Delete a backup snapshot
 */
export async function deleteBackup(
    datastore: string,
    backupType: string,
    backupId: string,
    backupTime: string
): Promise<void> {
    try {
        await api.delete('/pbs/backup', {
            params: { datastore, 'backup-type': backupType, 'backup-id': backupId, 'backup-time': backupTime }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Trigger a manual backup
 */
export async function createBackup(payload: CreateBackupPayload): Promise<{ success: boolean; task: string }> {
    try {
        const response = await api.post<{ success: boolean; task: string }>('/pbs/backup', payload);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Restore a backup
 */
export async function restoreBackup(payload: RestoreBackupPayload): Promise<{ success: boolean; task: string }> {
    try {
        const response = await api.post<{ success: boolean; task: string }>('/pbs/restore', payload);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Get backup jobs
 */
export async function getBackupJobs(): Promise<BackupJob[]> {
    try {
        const response = await api.get<BackupJob[]>('/pbs/jobs');
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Create a backup job
 */
export async function createBackupJob(job: Partial<BackupJob>): Promise<{ success: boolean; data: any }> {
    try {
        const response = await api.post<{ success: boolean; data: any }>('/pbs/jobs', job);
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Delete a backup job
 */
export async function deleteBackupJob(id: string): Promise<void> {
    try {
        await api.delete(`/pbs/jobs/${id}`);
    } catch (error) {
        return handleApiError(error);
    }
}
