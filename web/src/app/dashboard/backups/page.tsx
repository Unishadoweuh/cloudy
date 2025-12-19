'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPbsStatus, getBackups, getBackupJobs, createBackup, getInstances, getBackupStorages } from '@/lib/api';
import type { PbsStatus, BackupGroup, BackupJob, Instance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Archive,
    Server,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    HardDrive,
    MoreHorizontal,
    Play,
    Trash2,
    RotateCcw,
    Calendar,
    Database,
    CloudOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp: number | string): string {
    if (!timestamp) return '-';
    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StatusCard({ status }: { status: PbsStatus }) {
    const isOnline = status.status === 'online';
    const isConfigured = status.configured;

    return (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 relative overflow-hidden">
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
                isOnline ? "bg-emerald-500" : isConfigured ? "bg-red-500" : "bg-slate-500"
            )} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">Proxmox Backup Server</p>
                        <div className="flex items-center gap-2">
                            {isOnline ? (
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                            ) : isConfigured ? (
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            ) : (
                                <CloudOff className="h-5 w-5 text-slate-400" />
                            )}
                            <span className="text-lg font-semibold text-white">
                                {isOnline ? 'En ligne' : isConfigured ? 'Hors ligne' : 'Non configuré'}
                            </span>
                        </div>
                        {status.version && (
                            <p className="text-xs text-slate-500 mt-1">Version {status.version}</p>
                        )}
                    </div>
                    <div className={cn(
                        "p-3 rounded-xl",
                        isOnline ? "bg-emerald-500/10" : "bg-slate-700/50"
                    )}>
                        <Database className={cn("h-6 w-6", isOnline ? "text-emerald-400" : "text-slate-400")} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface BackupStorage {
    storage: string;
    type: string;
    content: string;
    datastore?: string;
}

function StorageCard({ storage }: { storage: BackupStorage }) {
    const isPbs = storage.type === 'pbs';
    
    return (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 relative overflow-hidden hover:scale-[1.02] transition-transform">
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20",
                isPbs ? "bg-cyan-500" : "bg-violet-500"
            )} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">Stockage backup</p>
                        <p className="text-lg font-semibold text-white">{storage.storage}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {isPbs ? `PBS: ${storage.datastore || 'N/A'}` : storage.type}
                        </p>
                    </div>
                    <div className={cn(
                        "p-3 rounded-xl",
                        isPbs ? "bg-cyan-500/10" : "bg-violet-500/10"
                    )}>
                        <HardDrive className={cn("h-6 w-6", isPbs ? "text-cyan-400" : "text-violet-400")} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function BackupRow({
    backup,
    storage,
    onDelete
}: {
    backup: BackupGroup;
    storage: string;
    onDelete: () => void;
}) {
    const isVM = backup['backup-type'] === 'vm';

    return (
        <tr className="hover:bg-slate-800/50 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg",
                        isVM ? "bg-cyan-500/10 text-cyan-400" : "bg-violet-500/10 text-violet-400"
                    )}>
                        {isVM ? <Server className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </div>
                    <div>
                        <p className="font-medium text-white">{backup['backup-id']}</p>
                        <p className="text-xs text-slate-500">{backup['backup-type']?.toUpperCase() || 'N/A'}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                    {storage}
                </Badge>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(backup['last-backup'])}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className="text-sm text-slate-400">{backup['backup-count'] || 0} snapshots</span>
            </td>
            <td className="px-4 py-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restaurer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-slate-700"
                            onSelect={onDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
}

function CreateBackupModal({
    instances,
    backupStorages,
    isOpen,
    onClose,
    onSubmit,
}: {
    instances: Instance[];
    backupStorages: BackupStorage[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (vmid: number, node: string, type: 'qemu' | 'lxc', storage: string) => void;
}) {
    const [selectedVm, setSelectedVm] = useState<string>('');
    const [selectedStorage, setSelectedStorage] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const instance = instances.find(i => String(i.vmid) === selectedVm);
        if (instance && selectedStorage) {
            onSubmit(instance.vmid, instance.node, instance.type, selectedStorage);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-white mb-4">Nouvelle Sauvegarde</h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Instance</label>
                        <Select value={selectedVm} onValueChange={setSelectedVm}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Sélectionner une instance" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {instances.filter(i => !i.template).map((instance) => (
                                    <SelectItem key={instance.vmid} value={String(instance.vmid)}>
                                        {instance.name || `VM ${instance.vmid}`} ({instance.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Stockage de destination</label>
                        <Select value={selectedStorage} onValueChange={setSelectedStorage}>
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Sélectionner un stockage" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {backupStorages.map((s) => (
                                    <SelectItem key={s.storage} value={s.storage}>
                                        {s.storage} ({s.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedVm || !selectedStorage}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Lancer la sauvegarde
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function BackupsPage() {
    const queryClient = useQueryClient();
    const [selectedStorage, setSelectedStorage] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: pbsStatus } = useQuery({
        queryKey: ['pbs-status'],
        queryFn: getPbsStatus,
    });

    // Get PVE backup storages (storages with content type 'backup')
    const { data: backupStorages = [] } = useQuery({
        queryKey: ['backup-storages'],
        queryFn: getBackupStorages,
    });

    // Get PBS datastore name from selected storage (for PBS type storages)
    const selectedStorageData = backupStorages.find((s: BackupStorage) => s.storage === selectedStorage);
    const pbsDatastore = selectedStorageData?.type === 'pbs' ? selectedStorageData.datastore : null;

    const { data: backups = [], isLoading: backupsLoading } = useQuery({
        queryKey: ['backups', pbsDatastore],
        queryFn: () => pbsDatastore ? getBackups(pbsDatastore) : Promise.resolve([]),
        enabled: !!pbsDatastore,
    });

    const { data: backupJobs = [] } = useQuery({
        queryKey: ['backup-jobs'],
        queryFn: getBackupJobs,
    });

    const { data: instances = [] } = useQuery({
        queryKey: ['instances'],
        queryFn: () => getInstances(),
    });

    const createBackupMutation = useMutation({
        mutationFn: (payload: { vmid: number; node: string; type: 'qemu' | 'lxc'; storage: string }) =>
            createBackup({ ...payload, mode: 'snapshot' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        },
    });

    const handleCreateBackup = (vmid: number, node: string, type: 'qemu' | 'lxc', storage: string) => {
        createBackupMutation.mutate({ vmid, node, type, storage });
    };

    // Auto-select first storage
    useEffect(() => {
        if (backupStorages.length > 0 && !selectedStorage) {
            setSelectedStorage(backupStorages[0].storage);
        }
    }, [backupStorages, selectedStorage]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sauvegardes</h1>
                    <p className="text-slate-400 mt-1">Gérez vos sauvegardes de machines virtuelles</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                        disabled={backupStorages.length === 0}
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Nouvelle sauvegarde
                    </Button>
                </div>
            </div>

            {/* Status + Storages */}
            <div className="grid gap-4 md:grid-cols-3">
                {pbsStatus && <StatusCard status={pbsStatus} />}
                {backupStorages.slice(0, 2).map((s: BackupStorage) => (
                    <StorageCard key={s.storage} storage={s} />
                ))}
            </div>

            {/* Backup Jobs Summary */}
            {backupJobs.length > 0 && (
                <Card className="bg-slate-800/30 border-slate-700/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-cyan-400" />
                            Tâches planifiées
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {backupJobs.map((job: BackupJob) => (
                                <Badge
                                    key={job.id}
                                    variant="outline"
                                    className={cn(
                                        "bg-slate-700/50 border-slate-600",
                                        job.enabled ? "text-emerald-400" : "text-slate-500"
                                    )}
                                >
                                    {job.id} - {job.schedule || 'Manuel'}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Storage Selector + Backups Table */}
            <Card className="bg-slate-800/30 border-slate-700/30">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg">Sauvegardes</CardTitle>
                    <Select value={selectedStorage} onValueChange={setSelectedStorage}>
                        <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Stockage" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            {backupStorages.map((s: BackupStorage) => (
                                <SelectItem key={s.storage} value={s.storage}>
                                    {s.storage} ({s.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="p-0">
                    {!selectedStorage ? (
                        <div className="p-8 text-center text-slate-500">
                            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Sélectionnez un stockage pour voir les sauvegardes</p>
                        </div>
                    ) : !pbsDatastore ? (
                        <div className="p-8 text-center text-slate-500">
                            <HardDrive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Ce stockage ({selectedStorageData?.type}) ne supporte pas la visualisation des backups</p>
                            <p className="text-xs mt-2">Seuls les stockages PBS permettent de lister les sauvegardes</p>
                        </div>
                    ) : backupsLoading ? (
                        <div className="p-8 text-center text-slate-500">
                            <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
                            <p>Chargement...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Aucune sauvegarde dans ce stockage</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Instance</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stockage</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dernière sauvegarde</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Snapshots</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {backups.map((backup: BackupGroup) => (
                                    <BackupRow
                                        key={`${backup['backup-type']}/${backup['backup-id']}`}
                                        backup={backup}
                                        storage={selectedStorage}
                                        onDelete={() => {
                                            if (confirm('Supprimer cette sauvegarde ?')) {
                                                // Would need snapshot time - simplified for now
                                            }
                                        }}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Create Backup Modal */}
            <CreateBackupModal
                instances={instances}
                backupStorages={backupStorages}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateBackup}
            />
        </div>
    );
}
