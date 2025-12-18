'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInstanceSnapshots, createSnapshot, deleteSnapshot, rollbackSnapshot } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
    Camera,
    RotateCcw,
    Trash2,
    Plus,
    Clock,
    HardDrive,
    Loader2,
    AlertCircle,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Snapshot {
    name: string;
    snaptime?: number;
    description?: string;
    parent?: string;
    vmstate?: boolean;
}

interface SnapshotsTabProps {
    vmid: number;
    node: string;
    type: 'qemu' | 'lxc';
    isRunning: boolean;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function SnapshotsTab({ vmid, node, type, isRunning }: SnapshotsTabProps) {
    const queryClient = useQueryClient();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSnapName, setNewSnapName] = useState('');
    const [newSnapDescription, setNewSnapDescription] = useState('');
    const [includeRam, setIncludeRam] = useState(false);

    const { data: snapshots, isLoading, isError, refetch } = useQuery({
        queryKey: ['snapshots', vmid, node, type],
        queryFn: () => getInstanceSnapshots(vmid, node, type),
    });

    const createMutation = useMutation({
        mutationFn: () => createSnapshot(vmid, node, newSnapName, type, newSnapDescription || undefined, includeRam),
        onSuccess: () => {
            toast.success('Snapshot créé', `Le snapshot "${newSnapName}" est en cours de création`);
            queryClient.invalidateQueries({ queryKey: ['snapshots', vmid] });
            setShowCreateForm(false);
            setNewSnapName('');
            setNewSnapDescription('');
            setIncludeRam(false);
        },
        onError: (error: Error) => {
            toast.error('Erreur', error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (snapname: string) => deleteSnapshot(vmid, node, snapname, type),
        onSuccess: (_, snapname) => {
            toast.success('Snapshot supprimé', `Le snapshot "${snapname}" a été supprimé`);
            queryClient.invalidateQueries({ queryKey: ['snapshots', vmid] });
        },
        onError: (error: Error) => {
            toast.error('Erreur', error.message);
        },
    });

    const rollbackMutation = useMutation({
        mutationFn: (snapname: string) => rollbackSnapshot(vmid, node, snapname, type),
        onSuccess: (_, snapname) => {
            toast.success('Rollback lancé', `Restauration vers "${snapname}" en cours`);
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
        onError: (error: Error) => {
            toast.error('Erreur', error.message);
        },
    });

    const handleCreate = () => {
        if (!newSnapName.trim()) {
            toast.error('Erreur', 'Le nom du snapshot est requis');
            return;
        }
        // Validate snapshot name (alphanumeric + underscore + hyphen)
        if (!/^[a-zA-Z0-9_-]+$/.test(newSnapName)) {
            toast.error('Erreur', 'Le nom ne peut contenir que des lettres, chiffres, tirets et underscores');
            return;
        }
        createMutation.mutate();
    };

    // Filter out the 'current' snapshot which is just the current state
    const realSnapshots = snapshots?.filter(s => s.name !== 'current') || [];

    const isPending = createMutation.isPending || deleteMutation.isPending || rollbackMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Camera className="h-5 w-5 text-violet-400" />
                        Snapshots
                    </h3>
                    <p className="text-sm text-slate-400">
                        Gérez les points de restauration de cette instance
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                    disabled={isPending}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Snapshot
                </Button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <Card className="bg-slate-800/50 border-slate-700/50 animate-in slide-in-from-top-2">
                    <CardHeader>
                        <CardTitle className="text-base">Créer un snapshot</CardTitle>
                        <CardDescription>
                            Sauvegardez l'état actuel de votre instance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">Nom *</label>
                                <Input
                                    placeholder="my-snapshot"
                                    value={newSnapName}
                                    onChange={(e) => setNewSnapName(e.target.value)}
                                    className="bg-slate-900/50 border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">Description</label>
                                <Input
                                    placeholder="Avant mise à jour..."
                                    value={newSnapDescription}
                                    onChange={(e) => setNewSnapDescription(e.target.value)}
                                    className="bg-slate-900/50 border-slate-700"
                                />
                            </div>
                        </div>

                        {type === 'qemu' && isRunning && (
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 cursor-pointer hover:bg-slate-900/70 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeRam}
                                    onChange={(e) => setIncludeRam(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600"
                                />
                                <div>
                                    <p className="font-medium text-sm">Inclure la RAM</p>
                                    <p className="text-xs text-slate-500">Sauvegarde l'état mémoire (plus lent, plus volumineux)</p>
                                </div>
                            </label>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleCreate}
                                disabled={createMutation.isPending}
                                className="bg-gradient-to-r from-violet-500 to-purple-500"
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Camera className="h-4 w-4 mr-2" />
                                )}
                                Créer
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateForm(false)}
                            >
                                Annuler
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Snapshots List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
                    <p className="text-slate-400">Erreur lors du chargement des snapshots</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                        Réessayer
                    </Button>
                </div>
            ) : realSnapshots.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Camera className="h-12 w-12 text-slate-600 mb-3" />
                        <p className="text-slate-400 font-medium">Aucun snapshot</p>
                        <p className="text-sm text-slate-500 mt-1">
                            Créez votre premier snapshot pour sauvegarder l'état de cette instance
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {realSnapshots.map((snapshot) => (
                        <Card
                            key={snapshot.name}
                            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-violet-500/20">
                                            <Camera className="h-5 w-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-white">{snapshot.name}</p>
                                                {snapshot.vmstate && (
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                                        +RAM
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                                {snapshot.snaptime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(snapshot.snaptime)}
                                                    </span>
                                                )}
                                                {snapshot.description && (
                                                    <span className="text-slate-500">
                                                        {snapshot.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => rollbackMutation.mutate(snapshot.name)}
                                            disabled={isPending}
                                            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                        >
                                            {rollbackMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4 mr-1" />
                                            )}
                                            Rollback
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(snapshot.name)}
                                            disabled={isPending}
                                            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                        >
                                            {deleteMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
