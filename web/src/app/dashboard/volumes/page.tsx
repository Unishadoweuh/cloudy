'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoragePools, getVolumes } from '@/lib/api';
import type { StoragePool, Volume } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    HardDrive,
    Database,
    RefreshCw,
    Search,
    AlertCircle,
    Server,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatsCard({
    title,
    value,
    icon: Icon,
    iconColor,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    iconColor: string;
}) {
    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg bg-slate-800/50", iconColor)}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
                        <p className="text-xl font-bold text-white">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StoragePoolCard({ pool }: { pool: StoragePool }) {
    const usedPercent = pool.total > 0 ? (pool.used / pool.total) * 100 : 0;

    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Database className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{pool.storage}</h3>
                        <p className="text-xs text-slate-500">{pool.type} · {pool.node}</p>
                    </div>
                    <Badge className={cn(
                        "text-[10px]",
                        pool.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400"
                    )}>
                        {pool.active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                {/* Usage bar */}
                <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{formatBytes(pool.used)} used</span>
                        <span>{formatBytes(pool.total)} total</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                usedPercent > 90 ? "bg-red-500" : usedPercent > 70 ? "bg-amber-500" : "bg-cyan-500"
                            )}
                            style={{ width: `${usedPercent}%` }}
                        />
                    </div>
                </div>

                <div className="text-xs text-slate-500">
                    Content: {pool.content || 'N/A'}
                </div>
            </CardContent>
        </Card>
    );
}

function VolumeTableRow({ volume, index }: { volume: Volume; index: number }) {
    const volumeName = volume.volid.split(':')[1] || volume.volid;

    return (
        <tr className={cn(
            "transition-colors",
            index % 2 === 0 ? "bg-slate-800/20" : "bg-transparent"
        )}>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                        <HardDrive className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-white">{volumeName}</p>
                        <p className="text-xs text-slate-500">{volume.volid}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-slate-400">{volume.storage}</td>
            <td className="px-4 py-3 text-sm text-slate-400">{volume.node}</td>
            <td className="px-4 py-3 text-sm text-slate-400">{formatBytes(volume.size)}</td>
            <td className="px-4 py-3">
                <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                    {volume.format}
                </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-slate-400">
                {volume.vmid ? (
                    <span className="text-cyan-400">VM {volume.vmid}</span>
                ) : (
                    <span className="text-slate-500">—</span>
                )}
            </td>
        </tr>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-800/30 rounded-xl animate-pulse" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-800/30 rounded-xl animate-pulse" />
                ))}
            </div>
            <div className="h-64 bg-slate-800/30 rounded-lg animate-pulse" />
        </div>
    );
}

export default function VolumesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [storageFilter, setStorageFilter] = useState<string>('all');

    const {
        data: pools,
        isLoading: poolsLoading,
        refetch: refetchPools,
    } = useQuery({
        queryKey: ['storage-pools'],
        queryFn: () => getStoragePools(),
    });

    const {
        data: volumes,
        isLoading: volumesLoading,
        isError,
        error,
        refetch: refetchVolumes,
        isFetching,
    } = useQuery({
        queryKey: ['volumes'],
        queryFn: () => getVolumes(),
        refetchInterval: 30000,
    });

    const isLoading = poolsLoading || volumesLoading;

    const filteredVolumes = useMemo(() => {
        if (!volumes) return [];
        return volumes.filter((vol: Volume) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!vol.volid.toLowerCase().includes(query)) return false;
            }
            if (storageFilter !== 'all' && vol.storage !== storageFilter) return false;
            return true;
        });
    }, [volumes, searchQuery, storageFilter]);

    const totalSize = useMemo(() => {
        return (volumes || []).reduce((acc: number, vol: Volume) => acc + (vol.size || 0), 0);
    }, [volumes]);

    const totalPoolSize = useMemo(() => {
        return (pools || []).reduce((acc: number, p: StoragePool) => acc + (p.total || 0), 0);
    }, [pools]);

    const totalUsed = useMemo(() => {
        return (pools || []).reduce((acc: number, p: StoragePool) => acc + (p.used || 0), 0);
    }, [pools]);

    const storageOptions = useMemo(() => {
        const set = new Set<string>();
        (pools || []).forEach((p: StoragePool) => set.add(p.storage));
        return Array.from(set);
    }, [pools]);

    const refetchAll = () => {
        refetchPools();
        refetchVolumes();
    };

    if (isLoading) return <LoadingSkeleton />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 bg-red-500/10 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Failed to load volumes</h2>
                <p className="text-slate-400 mb-4">{(error as Error)?.message}</p>
                <Button onClick={() => refetchAll()} className="bg-slate-800 hover:bg-slate-700 text-white">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Storage & Volumes</h1>
                    <p className="text-slate-500 text-sm">Manage storage pools and disk volumes</p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchAll()}
                    disabled={isFetching}
                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                    <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:grid-cols-4">
                <StatsCard
                    title="Storage Pools"
                    value={pools?.length || 0}
                    icon={Database}
                    iconColor="text-cyan-400"
                />
                <StatsCard
                    title="Volumes"
                    value={volumes?.length || 0}
                    icon={HardDrive}
                    iconColor="text-violet-400"
                />
                <StatsCard
                    title="Total Capacity"
                    value={formatBytes(totalPoolSize)}
                    icon={Layers}
                    iconColor="text-emerald-400"
                />
                <StatsCard
                    title="Used"
                    value={formatBytes(totalUsed)}
                    icon={Server}
                    iconColor="text-amber-400"
                />
            </div>

            {/* Storage Pools */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">Storage Pools</h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(pools || []).map((pool: StoragePool) => (
                        <StoragePoolCard key={`${pool.node}-${pool.storage}`} pool={pool} />
                    ))}
                </div>
            </div>

            {/* Volumes Table */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">Volumes</h2>

                {/* Filters */}
                <div className="flex gap-3 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search volumes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <Select value={storageFilter} onValueChange={setStorageFilter}>
                        <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700 text-slate-300">
                            <SelectValue placeholder="Storage" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">All Storage</SelectItem>
                            {storageOptions.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Volume</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Storage</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Node</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Format</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">VM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {filteredVolumes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                        No volumes found
                                    </td>
                                </tr>
                            ) : (
                                filteredVolumes.map((volume: Volume, index: number) => (
                                    <VolumeTableRow key={volume.volid} volume={volume} index={index} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
