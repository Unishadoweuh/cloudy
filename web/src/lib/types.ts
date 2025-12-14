// API Types for Cloud Proxmox Dashboard

export interface Instance {
    id: string;
    vmid: number;
    name: string;
    node: string;
    status: 'running' | 'stopped' | 'paused';
    type: 'qemu' | 'lxc';
    maxcpu: number;
    maxmem: number;
    template?: number;
    uptime?: number;
    cpu?: number;
    mem?: number;
    disk?: number;
    maxdisk?: number;
    netin?: number;
    netout?: number;
    ip?: string | null;
}

export interface Node {
    node: string;
    status: 'online' | 'offline';
    cpu?: number;
    maxcpu?: number;
    mem?: number;
    maxmem?: number;
    disk?: number;
    maxdisk?: number;
    uptime?: number;
}

export interface VncTicket {
    ticket: string;
    port: number;
    user: string;
    vncUrl: string;
}

export interface CreateInstancePayload {
    type: 'qemu' | 'lxc';
    name: string;
    node: string;
    templateId: number;
    cores: number;
    memory: number;
    // QEMU Cloud-Init
    ciuser?: string;
    cipassword?: string;
    // LXC
    password?: string;
    // Common
    sshkeys?: string;
}

export interface CreateInstanceResponse {
    vmid: number;
    task: string;
}

export type VmAction = 'start' | 'stop' | 'reset' | 'shutdown' | 'suspend' | 'resume';

// Storage Types
export interface StoragePool {
    storage: string;
    type: string;
    content: string;
    total: number;
    used: number;
    avail: number;
    active: number;
    node: string;
}

export interface Volume {
    volid: string;
    format: string;
    size: number;
    vmid?: number;
    content: string;
    storage: string;
    node: string;
}

// Network Types
export interface NetworkInterface {
    iface: string;
    type: 'bridge' | 'bond' | 'eth' | 'vlan' | 'OVSBridge' | 'loopback';
    node: string;
    active: number;
    address?: string;
    netmask?: string;
    gateway?: string;
    bridge_ports?: string;
    autostart?: number;
    cidr?: string;
    method?: string;
}

// Monitoring Types
export interface RrdDataPoint {
    time: number;
    cpu?: number;
    mem?: number;
    memused?: number;
    memtotal?: number;
    maxmem?: number;
    disk?: number;
    maxdisk?: number;
    netin?: number;
    netout?: number;
    iowait?: number;
}

export interface ClusterStats {
    totalCpu: number;
    usedCpu: number;
    totalMem: number;
    usedMem: number;
    totalDisk: number;
    usedDisk: number;
    nodes: number;
    instances: number;
    runningVms: number;
}

// Security Types
export interface FirewallRule {
    pos: number;
    type: 'in' | 'out' | 'group';
    action: 'ACCEPT' | 'DROP' | 'REJECT';
    proto?: string;
    dport?: string;
    sport?: string;
    source?: string;
    dest?: string;
    comment?: string;
    enable: number;
    scope?: 'cluster' | 'node' | 'vm';
    node?: string;
    vmid?: number;
    vmtype?: 'qemu' | 'lxc';
}

// Notification Types
export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    userId: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
    role: 'USER' | 'ADMIN';
    avatar?: string;
    maxCpu: number;
    maxMemory: number;
    maxDisk: number;
    maxInstances: number;
    allowedNodes: string[];
}

// ==================== PBS Types ====================

export interface PbsStatus {
    configured: boolean;
    status: 'online' | 'offline' | 'not_configured';
    version?: string;
    release?: string;
    error?: string;
}

export interface Datastore {
    name: string;
    comment?: string;
    path?: string;
    'gc-schedule'?: string;
    'prune-schedule'?: string;
}

export interface DatastoreStatus {
    total: number;
    used: number;
    avail: number;
    'gc-status'?: any;
}

export interface BackupGroup {
    'backup-type': 'vm' | 'ct' | 'host';
    'backup-id': string;
    'last-backup': string;
    'backup-count': number;
    files?: string[];
}

export interface BackupSnapshot {
    'backup-type': string;
    'backup-id': string;
    'backup-time': number;
    size?: number;
    files?: string[];
    protected?: boolean;
}

export interface BackupJob {
    id: string;
    vmid?: string;
    storage: string;
    schedule?: string;
    dow?: string;
    starttime?: string;
    mode: 'snapshot' | 'suspend' | 'stop';
    compress?: string;
    enabled?: boolean | number;
    mailnotification?: string;
    mailto?: string;
    notes?: string;
}

export interface CreateBackupPayload {
    node: string;
    vmid: number;
    storage: string;
    type: 'qemu' | 'lxc';
    mode?: 'snapshot' | 'suspend' | 'stop';
}

export interface RestoreBackupPayload {
    node: string;
    storage: string;
    archive: string;
    vmid: number;
    type: 'qemu' | 'lxc';
}
