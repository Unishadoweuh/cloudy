'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInstances, vmAction, deleteInstance, getMe } from '@/lib/api';
import type { Instance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Server,
    Box,
    RefreshCw,
    Cpu,
    MemoryStick,
    Activity,
    AlertCircle,
    Search,
    LayoutGrid,
    List,
    ChevronRight,
    MoreHorizontal,
    Play,
    Square,
    Trash2,
    Globe,
    Copy,
    Check,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors"
            title="Copier l'adresse IP"
        >
            {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
            ) : (
                <Copy className="h-3 w-3 text-slate-500 hover:text-cyan-400" />
            )}
        </button>
    );
}

function StatsCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
            "border-slate-700/50 hover:border-slate-600/50"
        )}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2", color)} />
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">{title}</p>
                        <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl", color.replace('bg-', 'bg-').replace('-500', '-500/20'))}>
                        <Icon className={cn("h-5 w-5", color.replace('bg-', 'text-'))} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function InstanceCard({ instance }: { instance: Instance }) {
    const router = useRouter();
    const isRunning = instance.status === 'running';
    const isVM = instance.type === 'qemu';
    const colorClass = isVM ? 'bg-cyan-500' : 'bg-violet-500';

    return (
        <Card
            className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300",
                "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
                "border-slate-700/50 hover:border-slate-600/50",
                "hover:scale-[1.02]"
            )}
            onClick={() => router.push(`/dashboard/instances/${instance.vmid}`)}
        >
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2", colorClass)} />
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-xl",
                            isVM ? "bg-cyan-500/20 text-cyan-400" : "bg-violet-500/20 text-violet-400"
                        )}>
                            {isVM ? <Server className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{instance.name}</h3>
                            <p className="text-xs text-slate-500">{instance.type.toUpperCase()} · {instance.node}</p>
                        </div>
                    </div>
                    <Badge
                        className={cn(
                            "text-[10px] px-2",
                            isRunning
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}
                    >
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                            isRunning ? "bg-emerald-400" : "bg-slate-500"
                        )} />
                        {instance.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                        <Cpu className="h-3.5 w-3.5" />
                        <span>{instance.maxcpu} vCPU</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MemoryStick className="h-3.5 w-3.5" />
                        <span>{formatBytes(instance.maxmem)}</span>
                    </div>
                    {instance.ip && (
                        <div className="flex items-center gap-1 text-cyan-400 ml-auto">
                            <Globe className="h-3.5 w-3.5" />
                            <span className="font-mono">{instance.ip}</span>
                            <CopyButton text={instance.ip} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function InstanceTableRow({ instance, index, onAction, onDelete }: { instance: Instance; index: number; onAction: (action: string) => void; onDelete: () => void }) {
    const router = useRouter();
    const isRunning = instance.status === 'running';
    const isVM = instance.type === 'qemu';

    return (
        <tr
            className={cn(
                "cursor-pointer transition-colors",
                "hover:bg-slate-800/50",
                index % 2 === 0 ? "bg-slate-800/20" : "bg-transparent"
            )}
            onClick={() => router.push(`/dashboard/instances/${instance.vmid}`)}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg",
                        isVM ? "bg-cyan-500/10 text-cyan-400" : "bg-violet-500/10 text-violet-400"
                    )}>
                        {isVM ? <Server className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                    </div>
                    <div>
                        <p className="font-medium text-white">{instance.name}</p>
                        <p className="text-xs text-slate-500">ID: {instance.vmid}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className="text-sm text-slate-400">{instance.type.toUpperCase()}</span>
            </td>
            <td className="px-4 py-3">
                <span className="text-sm text-slate-400">{instance.node}</span>
            </td>
            <td className="px-4 py-3">
                <Badge
                    className={cn(
                        "text-xs",
                        isRunning
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}
                >
                    <span className={cn(
                        "w-1.5 h-1.5 rounded-full mr-1.5",
                        isRunning ? "bg-emerald-400" : "bg-slate-500"
                    )} />
                    {instance.status}
                </Badge>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>{instance.maxcpu}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm text-slate-400">
                    <MemoryStick className="h-3.5 w-3.5" />
                    <span>{formatBytes(instance.maxmem)}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                {instance.ip ? (
                    <div className="flex items-center gap-1 text-sm text-cyan-400 font-mono">
                        <Globe className="h-3.5 w-3.5" />
                        <span>{instance.ip}</span>
                        <CopyButton text={instance.ip} />
                    </div>
                ) : (
                    <span className="text-sm text-slate-600">-</span>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                                className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700 cursor-pointer"
                                onSelect={(e) => { e.preventDefault(); onAction('start'); }}
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Démarrer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700 cursor-pointer"
                                onSelect={(e) => { e.preventDefault(); onAction('stop'); }}
                            >
                                <Square className="mr-2 h-4 w-4" />
                                Arrêter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-slate-700 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette instance ? Cette action est irréversible.');
                                    if (confirmed) {
                                        onDelete();
                                    }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
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
            <div className="h-12 bg-slate-800/30 rounded-lg animate-pulse" />
            <div className="h-64 bg-slate-800/30 rounded-lg animate-pulse" />
        </div>
    );
}

export default function InstancesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'qemu' | 'lxc'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [showAll, setShowAll] = useState(false);

    const queryClient = useQueryClient();

    // Get current user to check if admin
    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });
    const isAdmin = currentUser?.role === 'ADMIN';

    const {
        data: instances,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['instances', showAll],
        queryFn: () => getInstances(showAll),
        refetchInterval: 30000,
    });

    const actionMutation = useMutation({
        mutationFn: ({ vmid, node, action, type }: { vmid: string; node: string; action: string; type: 'qemu' | 'lxc' }) =>
            vmAction(vmid, node, action as any, type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: ({ vmid, node, type }: { vmid: string; node: string; type: 'qemu' | 'lxc' }) =>
            deleteInstance(vmid, node, type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
    });

    const handleAction = (instance: Instance, action: string) => {
        actionMutation.mutate({
            vmid: String(instance.vmid),
            node: instance.node,
            action,
            type: instance.type as 'qemu' | 'lxc'
        });
    };

    const handleDelete = (instance: Instance) => {
        deleteMutation.mutate({
            vmid: String(instance.vmid),
            node: instance.node,
            type: instance.type as 'qemu' | 'lxc'
        });
    };

    const allInstances = instances?.filter((i: Instance) => !i.template) || [];

    const filteredInstances = useMemo(() => {
        return allInstances.filter((instance: Instance) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = instance.name?.toLowerCase().includes(query);
                const matchesId = instance.vmid?.toString().includes(query);
                if (!matchesName && !matchesId) return false;
            }
            if (typeFilter !== 'all' && instance.type !== typeFilter) return false;
            if (statusFilter !== 'all' && instance.status !== statusFilter) return false;
            return true;
        });
    }, [allInstances, searchQuery, typeFilter, statusFilter]);

    const runningCount = allInstances.filter((i: Instance) => i.status === 'running').length;
    const stoppedCount = allInstances.filter((i: Instance) => i.status === 'stopped').length;
    const totalCores = allInstances.reduce((acc: number, i: Instance) => acc + (i.maxcpu || 0), 0);

    if (isLoading) return <LoadingSkeleton />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 bg-red-500/10 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Failed to load instances</h2>
                <p className="text-slate-400 mb-4">{(error as Error)?.message}</p>
                <Button onClick={() => refetch()} className="bg-slate-800 hover:bg-slate-700 text-white">
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
                    <h1 className="text-2xl font-bold text-white">Instances</h1>
                    <p className="text-slate-500 text-sm">Manage your virtual machines and containers</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    </Button>
                    <Button asChild className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/50">
                        <Link href="/dashboard/instances/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Instance
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:grid-cols-4">
                <StatsCard title="Total" value={allInstances.length} icon={Server} color="bg-cyan-500" />
                <StatsCard title="Running" value={runningCount} icon={Activity} color="bg-emerald-500" />
                <StatsCard title="Stopped" value={stoppedCount} icon={Box} color="bg-amber-500" />
                <StatsCard title="vCPUs allocated" value={totalCores} icon={Cpu} color="bg-violet-500" />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search instances..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                        <SelectTrigger className="w-32 bg-slate-900/50 border-slate-700 text-slate-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="qemu">VMs</SelectItem>
                            <SelectItem value="lxc">LXC</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                        <SelectTrigger className="w-32 bg-slate-900/50 border-slate-700 text-slate-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="stopped">Stopped</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Admin Toggle: My Instances / All Instances */}
                    {isAdmin && (
                        <div className="flex bg-slate-900/50 border border-slate-700 rounded-lg p-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAll(false)}
                                className={cn(
                                    "h-8 px-3 rounded-md text-xs",
                                    !showAll ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"
                                )}
                            >
                                Mes instances
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAll(true)}
                                className={cn(
                                    "h-8 px-3 rounded-md text-xs",
                                    showAll ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"
                                )}
                            >
                                Toutes
                            </Button>
                        </div>
                    )}

                    {/* View Toggle */}
                    <div className="flex bg-slate-900/50 border border-slate-700 rounded-lg p-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "h-8 w-8 rounded-md",
                                viewMode === 'grid' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "h-8 w-8 rounded-md",
                                viewMode === 'list' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results info */}
            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Showing {filteredInstances.length} of {allInstances.length}</span>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
                        className="text-slate-400 hover:text-white h-auto p-0"
                    >
                        Clear
                    </Button>
                </div>
            )}

            {/* Content */}
            {filteredInstances.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                            <Server className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">
                            {allInstances.length === 0 ? 'No instances' : 'No results'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4">
                            {allInstances.length === 0 ? 'Create your first instance' : 'Try different filters'}
                        </p>
                        {allInstances.length === 0 && (
                            <Button asChild className="bg-slate-800 hover:bg-slate-700 text-white">
                                <Link href="/dashboard/instances/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Instance
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredInstances.map((instance: Instance) => (
                        <InstanceCard key={instance.id || instance.vmid} instance={instance} />
                    ))}
                </div>
            ) : (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Instance</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Node</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">CPU</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Memory</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {filteredInstances.map((instance: Instance, index: number) => (
                                <InstanceTableRow
                                    key={instance.id || instance.vmid}
                                    instance={instance}
                                    index={index}
                                    onAction={(action) => handleAction(instance, action)}
                                    onDelete={() => handleDelete(instance)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
