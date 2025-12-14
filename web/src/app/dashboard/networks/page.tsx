'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNetworkInterfaces, getNetworkBridges } from '@/lib/api';
import type { NetworkInterface } from '@/lib/types';
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
    Network,
    Wifi,
    RefreshCw,
    Search,
    AlertCircle,
    Server,
    Cable,
    Router,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

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

function BridgeCard({ bridge }: { bridge: NetworkInterface }) {
    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Router className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{bridge.iface}</h3>
                        <p className="text-xs text-slate-500">{bridge.node}</p>
                    </div>
                    <Badge className={cn(
                        "text-[10px]",
                        bridge.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400"
                    )}>
                        {bridge.active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                {/* Address */}
                <div className="space-y-2 text-sm">
                    {bridge.address && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">IP Address</span>
                            <span className="text-white font-mono">{bridge.cidr || bridge.address}</span>
                        </div>
                    )}
                    {bridge.gateway && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">Gateway</span>
                            <span className="text-slate-300 font-mono">{bridge.gateway}</span>
                        </div>
                    )}
                    {bridge.bridge_ports && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">Ports</span>
                            <span className="text-slate-300 font-mono">{bridge.bridge_ports}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function InterfaceTableRow({ iface, index }: { iface: NetworkInterface; index: number }) {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bridge': return <Router className="h-4 w-4" />;
            case 'eth': return <Cable className="h-4 w-4" />;
            case 'bond': return <Wifi className="h-4 w-4" />;
            default: return <Network className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'bridge': return 'bg-cyan-500/10 text-cyan-400';
            case 'eth': return 'bg-violet-500/10 text-violet-400';
            case 'bond': return 'bg-amber-500/10 text-amber-400';
            case 'loopback': return 'bg-slate-500/10 text-slate-400';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    return (
        <tr className={cn(
            "transition-colors",
            index % 2 === 0 ? "bg-slate-800/20" : "bg-transparent"
        )}>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", getTypeColor(iface.type))}>
                        {getTypeIcon(iface.type)}
                    </div>
                    <div>
                        <p className="font-medium text-white">{iface.iface}</p>
                        <p className="text-xs text-slate-500">{iface.method || 'N/A'}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                    {iface.type}
                </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-slate-400">{iface.node}</td>
            <td className="px-4 py-3 text-sm font-mono text-slate-400">
                {iface.cidr || iface.address || '—'}
            </td>
            <td className="px-4 py-3">
                <span className={cn(
                    "inline-flex items-center gap-1.5 text-sm",
                    iface.active ? "text-emerald-400" : "text-slate-500"
                )}>
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        iface.active ? "bg-emerald-400" : "bg-slate-500"
                    )} />
                    {iface.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-slate-400">
                {iface.bridge_ports || '—'}
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

export default function NetworksPage() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [nodeFilter, setNodeFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const {
        data: interfaces,
        isLoading: interfacesLoading,
        isError,
        error,
        refetch: refetchInterfaces,
        isFetching,
    } = useQuery({
        queryKey: ['network-interfaces'],
        queryFn: () => getNetworkInterfaces(),
        refetchInterval: 30000,
    });

    const {
        data: bridges,
        isLoading: bridgesLoading,
        refetch: refetchBridges,
    } = useQuery({
        queryKey: ['network-bridges'],
        queryFn: () => getNetworkBridges(),
    });

    const isLoading = interfacesLoading || bridgesLoading;

    const filteredInterfaces = useMemo(() => {
        if (!interfaces) return [];
        return interfaces.filter((iface: NetworkInterface) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!iface.iface.toLowerCase().includes(query) &&
                    !(iface.address?.toLowerCase().includes(query))) return false;
            }
            if (nodeFilter !== 'all' && iface.node !== nodeFilter) return false;
            if (typeFilter !== 'all' && iface.type !== typeFilter) return false;
            return true;
        });
    }, [interfaces, searchQuery, nodeFilter, typeFilter]);

    const nodeOptions = useMemo(() => {
        const set = new Set<string>();
        (interfaces || []).forEach((i: NetworkInterface) => set.add(i.node));
        return Array.from(set);
    }, [interfaces]);

    const typeOptions = useMemo(() => {
        const set = new Set<string>();
        (interfaces || []).forEach((i: NetworkInterface) => set.add(i.type));
        return Array.from(set);
    }, [interfaces]);

    const physicalCount = useMemo(() => {
        return (interfaces || []).filter((i: NetworkInterface) => i.type === 'eth').length;
    }, [interfaces]);

    const activeCount = useMemo(() => {
        return (interfaces || []).filter((i: NetworkInterface) => i.active).length;
    }, [interfaces]);

    const refetchAll = () => {
        refetchInterfaces();
        refetchBridges();
    };

    if (isLoading) return <LoadingSkeleton />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 bg-red-500/10 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Failed to load networks</h2>
                <p className="text-slate-400 mb-4">{(error as Error)?.message}</p>
                <Button onClick={() => refetchAll()} className="bg-slate-800 hover:bg-slate-700 text-white">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('common.retry')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('networks.title')}</h1>
                    <p className="text-slate-500 text-sm">{t('networks.subtitle')}</p>
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
                    title={t('networks.totalInterfaces')}
                    value={interfaces?.length || 0}
                    icon={Network}
                    iconColor="text-cyan-400"
                />
                <StatsCard
                    title={t('networks.activeBridges')}
                    value={bridges?.filter((b: NetworkInterface) => b.active).length || 0}
                    icon={Router}
                    iconColor="text-violet-400"
                />
                <StatsCard
                    title={t('networks.physicalPorts')}
                    value={physicalCount}
                    icon={Cable}
                    iconColor="text-emerald-400"
                />
                <StatsCard
                    title="Active"
                    value={activeCount}
                    icon={Server}
                    iconColor="text-amber-400"
                />
            </div>

            {/* Bridges */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">{t('networks.bridges')}</h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(bridges || []).map((bridge: NetworkInterface) => (
                        <BridgeCard key={`${bridge.node}-${bridge.iface}`} bridge={bridge} />
                    ))}
                </div>
            </div>

            {/* Interfaces Table */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">{t('networks.interfaces')}</h2>

                {/* Filters */}
                <div className="flex gap-3 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder={t('common.search') + '...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <Select value={nodeFilter} onValueChange={setNodeFilter}>
                        <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700 text-slate-300">
                            <SelectValue placeholder="Node" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">{t('networks.allNodes')}</SelectItem>
                            {nodeOptions.map((n) => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700 text-slate-300">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">{t('networks.allTypes')}</SelectItem>
                            {typeOptions.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Interface</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Node</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('networks.address')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('networks.bridgePorts')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {filteredInterfaces.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                        {t('networks.noInterfaces')}
                                    </td>
                                </tr>
                            ) : (
                                filteredInterfaces.map((iface: NetworkInterface, index: number) => (
                                    <InterfaceTableRow key={`${iface.node}-${iface.iface}`} iface={iface} index={index} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
