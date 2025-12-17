'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getClusterStats, getNodes, getNodeMetrics, getMe, getInstances, getInstanceMetrics } from '@/lib/api';
import type { ClusterStats, Node, RrdDataPoint, Instance } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Cpu,
    MemoryStick,
    HardDrive,
    Activity,
    RefreshCw,
    Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { FadeIn } from '@/components/FadeIn';
import { MonitoringPageSkeleton } from '@/components/Skeletons';

// Colors for different nodes
const NODE_COLORS = [
    '#22d3ee', // cyan
    '#a78bfa', // violet
    '#f472b6', // pink
    '#fb923c', // orange
    '#4ade80', // green
    '#facc15', // yellow
];

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    percent,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    percent?: number;
}) {
    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2.5 rounded-lg", color.replace('text-', 'bg-').replace('-400', '-500/20'))}>
                        <Icon className={cn("h-5 w-5", color)} />
                    </div>
                    {percent !== undefined && (
                        <span className={cn(
                            "text-sm font-medium",
                            percent > 80 ? "text-red-400" : percent > 60 ? "text-amber-400" : "text-emerald-400"
                        )}>
                            {percent.toFixed(1)}%
                        </span>
                    )}
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{title}</p>
                {subtitle && (
                    <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}

// Multi-line chart component for all nodes
function MultiNodeChart({
    title,
    allMetrics,
    nodeNames,
    dataKey,
    formatter,
    yAxisFormatter,
}: {
    title: string;
    allMetrics: Record<string, RrdDataPoint[]>;
    nodeNames: string[];
    dataKey: string;
    formatter?: (value: number) => string;
    yAxisFormatter?: (value: number) => string;
}) {
    // Merge all node data by timestamp
    const chartData = useMemo(() => {
        const timeMap = new Map<number, Record<string, number | string>>();

        for (const nodeName of nodeNames) {
            const nodeData = allMetrics[nodeName] || [];
            for (const point of nodeData) {
                const existing = timeMap.get(point.time) || { time: point.time, timeLabel: formatTime(point.time) };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                existing[nodeName] = (point as any)[dataKey];
                timeMap.set(point.time, existing);
            }
        }

        return Array.from(timeMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
    }, [allMetrics, nodeNames, dataKey]);

    if (chartData.length === 0) return null;

    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="timeLabel"
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={{ stroke: '#334155' }}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={{ stroke: '#334155' }}
                            tickFormatter={yAxisFormatter}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={(value: number, name: string) => [
                                formatter ? formatter(value) : value.toFixed(2),
                                name,
                            ]}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                        />
                        {nodeNames.map((nodeName, index) => (
                            <Line
                                key={nodeName}
                                type="monotone"
                                dataKey={nodeName}
                                stroke={NODE_COLORS[index % NODE_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                name={nodeName}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export default function MonitoringPage() {
    const { t } = useLanguage();
    const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week'>('hour');
    const [viewMode, setViewMode] = useState<'personal' | 'cluster'>('personal');

    // Check if user is admin
    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });
    const isAdmin = currentUser?.role === 'ADMIN';

    // Fetch user's instances
    const { data: instances } = useQuery({
        queryKey: ['instances'],
        queryFn: () => getInstances(),
    });
    const userInstances = instances?.filter((i: Instance) => !i.template) || [];

    // Cluster stats (admin only when viewing cluster)
    const { data: clusterStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['cluster-stats'],
        queryFn: getClusterStats,
        refetchInterval: 30000,
        enabled: isAdmin && viewMode === 'cluster',
    });

    const { data: nodes, isLoading: nodesLoading, refetch: refetchNodes } = useQuery({
        queryKey: ['nodes'],
        queryFn: getNodes,
        enabled: isAdmin && viewMode === 'cluster',
    });

    const nodeNames = useMemo(() => (nodes || []).map((n: Node) => n.node), [nodes]);

    // Fetch metrics for ALL nodes using useQueries (admin cluster view only)
    const metricsQueries = useQueries({
        queries: (isAdmin && viewMode === 'cluster' ? nodeNames : []).map((nodeName: string) => ({
            queryKey: ['node-metrics', nodeName, timeframe],
            queryFn: () => getNodeMetrics(nodeName, timeframe),
            enabled: !!nodeName && isAdmin && viewMode === 'cluster',
            refetchInterval: 60000,
        })),
    });

    // Fetch metrics for user's instances (personal view)
    const instanceMetricsQueries = useQueries({
        queries: (viewMode === 'personal' ? userInstances : []).map((instance: Instance) => ({
            queryKey: ['instance-metrics', instance.vmid, instance.node, instance.type, timeframe],
            queryFn: () => getInstanceMetrics(instance.vmid, instance.node, instance.type as 'qemu' | 'lxc', timeframe),
            enabled: !!instance.vmid && viewMode === 'personal',
            refetchInterval: 60000,
        })),
    });

    const isFetching = metricsQueries.some(q => q.isFetching) || instanceMetricsQueries.some(q => q.isFetching);

    // Combine all node metrics into a single object (cluster view)
    const allMetrics = useMemo(() => {
        const result: Record<string, RrdDataPoint[]> = {};
        metricsQueries.forEach((query, index) => {
            if (query.data && nodeNames[index]) {
                result[nodeNames[index]] = query.data;
            }
        });
        return result;
    }, [metricsQueries, nodeNames]);

    // Combine all instance metrics (personal view)
    const instanceMetrics = useMemo(() => {
        const result: Record<string, RrdDataPoint[]> = {};
        instanceMetricsQueries.forEach((query, index) => {
            if (query.data && userInstances[index]) {
                const instance = userInstances[index];
                result[instance.name || `VM-${instance.vmid}`] = query.data;
            }
        });
        return result;
    }, [instanceMetricsQueries, userInstances]);

    const instanceNames = useMemo(() =>
        userInstances.map((i: Instance) => i.name || `VM-${i.vmid}`),
        [userInstances]
    );

    const isLoading = statsLoading || nodesLoading;

    const refetchAll = () => {
        if (isAdmin && viewMode === 'cluster') {
            refetchStats();
            refetchNodes();
            metricsQueries.forEach(q => q.refetch());
        } else {
            instanceMetricsQueries.forEach(q => q.refetch());
        }
    };

    // Calculate stats based on view mode
    const cpuPercent = clusterStats ? clusterStats.usedCpu * 100 : 0;
    const memPercent = clusterStats ? (clusterStats.usedMem / clusterStats.totalMem) * 100 : 0;
    const diskPercent = clusterStats ? (clusterStats.usedDisk / clusterStats.totalDisk) * 100 : 0;

    // Calculate user's instance stats
    const userRunningCount = userInstances.filter((i: Instance) => i.status === 'running').length;
    const userTotalCpu = userInstances.reduce((acc: number, i: Instance) => acc + (i.maxcpu || 0), 0);
    const userTotalMem = userInstances.reduce((acc: number, i: Instance) => acc + (i.maxmem || 0), 0);

    if (isLoading && isAdmin && viewMode === 'cluster') return <MonitoringPageSkeleton />;

    const hasMetrics = viewMode === 'cluster'
        ? Object.keys(allMetrics).length > 0
        : Object.keys(instanceMetrics).length > 0;

    return (
        <FadeIn className="space-y-6" duration={700}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('monitoring.title')}</h1>
                    <p className="text-slate-500 text-sm">
                        {viewMode === 'personal'
                            ? 'Métriques de vos instances'
                            : t('monitoring.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Admin View Toggle */}
                    {isAdmin && (
                        <div className="flex bg-slate-900/50 border border-slate-700 rounded-lg p-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('personal')}
                                className={cn(
                                    "h-8 px-3 rounded-md text-xs transition-all",
                                    viewMode === 'personal' ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-white"
                                )}
                            >
                                Mes instances
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('cluster')}
                                className={cn(
                                    "h-8 px-3 rounded-md text-xs transition-all",
                                    viewMode === 'cluster' ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-white"
                                )}
                            >
                                Cluster
                            </Button>
                        </div>
                    )}
                    <Select value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
                        <SelectTrigger className="w-36 bg-slate-900/50 border-slate-700 text-slate-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="hour">{t('monitoring.lastHour')}</SelectItem>
                            <SelectItem value="day">{t('monitoring.last24h')}</SelectItem>
                            <SelectItem value="week">{t('monitoring.lastWeek')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={refetchAll}
                        disabled={isFetching}
                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Personal View - User's instances stats */}
            {viewMode === 'personal' && (
                <FadeIn delay={100} className="grid gap-4 md:grid-cols-4">
                    <StatsCard
                        title="Instances actives"
                        value={userRunningCount}
                        subtitle={`/ ${userInstances.length} total`}
                        icon={Activity}
                        color="text-emerald-400"
                    />
                    <StatsCard
                        title="vCPUs alloués"
                        value={userTotalCpu}
                        subtitle="Cœurs virtuels"
                        icon={Cpu}
                        color="text-cyan-400"
                    />
                    <StatsCard
                        title="Mémoire allouée"
                        value={formatBytes(userTotalMem)}
                        subtitle="RAM totale"
                        icon={MemoryStick}
                        color="text-violet-400"
                    />
                    <StatsCard
                        title="Instances"
                        value={userInstances.length}
                        subtitle={`${userInstances.filter((i: Instance) => i.type === 'qemu').length} VMs, ${userInstances.filter((i: Instance) => i.type === 'lxc').length} LXC`}
                        icon={Server}
                        color="text-amber-400"
                    />
                </FadeIn>
            )}

            {/* Cluster View - Full cluster stats (admin only) */}
            {viewMode === 'cluster' && isAdmin && (
                <FadeIn delay={100} className="grid gap-4 md:grid-cols-4">
                    <StatsCard
                        title={t('monitoring.cpuUsage')}
                        value={`${cpuPercent.toFixed(1)}%`}
                        subtitle={`${clusterStats?.totalCpu || 0} ${t('monitoring.totalCores')}`}
                        icon={Cpu}
                        color="text-cyan-400"
                        percent={cpuPercent}
                    />
                    <StatsCard
                        title={t('monitoring.memoryUsage')}
                        value={formatBytes(clusterStats?.usedMem || 0)}
                        subtitle={`/ ${formatBytes(clusterStats?.totalMem || 0)}`}
                        icon={MemoryStick}
                        color="text-violet-400"
                        percent={memPercent}
                    />
                    <StatsCard
                        title={t('monitoring.diskUsage')}
                        value={formatBytes(clusterStats?.usedDisk || 0)}
                        subtitle={`/ ${formatBytes(clusterStats?.totalDisk || 0)}`}
                        icon={HardDrive}
                        color="text-emerald-400"
                        percent={diskPercent}
                    />
                    <StatsCard
                        title={t('monitoring.runningInstances')}
                        value={clusterStats?.runningVms || 0}
                        subtitle={`/ ${clusterStats?.instances || 0} total`}
                        icon={Activity}
                        color="text-amber-400"
                    />
                </FadeIn>
            )}

            {/* Multi-Node Charts (cluster view only) */}
            {viewMode === 'cluster' && isAdmin && hasMetrics && (
                <div className="grid gap-4 md:grid-cols-2">
                    <FadeIn delay={200} className="h-full">
                        <MultiNodeChart
                            title={`${t('monitoring.cpuUsage')} - Tous les serveurs`}
                            allMetrics={allMetrics}
                            nodeNames={nodeNames}
                            dataKey="cpu"
                            formatter={(v) => `${(v * 100).toFixed(1)}%`}
                            yAxisFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        />
                    </FadeIn>
                    <FadeIn delay={300} className="h-full">
                        <MultiNodeChart
                            title={`${t('monitoring.memoryUsage')} - Tous les serveurs`}
                            allMetrics={allMetrics}
                            nodeNames={nodeNames}
                            dataKey="memused"
                            formatter={(v) => formatBytes(v)}
                            yAxisFormatter={(v) => formatBytes(v)}
                        />
                    </FadeIn>
                    <FadeIn delay={400} className="h-full">
                        <MultiNodeChart
                            title="Réseau (Entrant) - Tous les serveurs"
                            allMetrics={allMetrics}
                            nodeNames={nodeNames}
                            dataKey="netin"
                            formatter={(v) => formatBytes(v)}
                            yAxisFormatter={(v) => formatBytes(v)}
                        />
                    </FadeIn>
                    <FadeIn delay={500} className="h-full">
                        <MultiNodeChart
                            title="Réseau (Sortant) - Tous les serveurs"
                            allMetrics={allMetrics}
                            nodeNames={nodeNames}
                            dataKey="netout"
                            formatter={(v) => formatBytes(v)}
                            yAxisFormatter={(v) => formatBytes(v)}
                        />
                    </FadeIn>
                </div>
            )}

            {/* Instance Charts (personal view) */}
            {viewMode === 'personal' && hasMetrics && (
                <div className="grid gap-4 md:grid-cols-2">
                    <FadeIn delay={200} className="h-full">
                        <MultiNodeChart
                            title="CPU"
                            allMetrics={instanceMetrics}
                            nodeNames={instanceNames}
                            dataKey="cpu"
                            formatter={(v) => `${(v * 100).toFixed(1)}%`}
                            yAxisFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        />
                    </FadeIn>
                    <FadeIn delay={300} className="h-full">
                        <MultiNodeChart
                            title="Mémoire (Utilisée)"
                            allMetrics={instanceMetrics}
                            nodeNames={instanceNames}
                            dataKey="mem"
                            formatter={(v) => formatBytes(v)}
                            yAxisFormatter={(v) => formatBytes(v)}
                        />
                    </FadeIn>
                    <FadeIn delay={400} className="h-full">
                        <MultiNodeChart
                            title="Réseau (Entrant)"
                            allMetrics={instanceMetrics}
                            nodeNames={instanceNames}
                            dataKey="netin"
                            formatter={(v) => formatBytes(v)}
                            yAxisFormatter={(v) => formatBytes(v)}
                        />
                    </FadeIn>
                    <FadeIn delay={500} className="h-full">
                        <MultiNodeChart
                            title="Réseau (Sortant)"
                            allMetrics={instanceMetrics}
                            nodeNames={instanceNames}
                            dataKey="netout"
                            formatter={(v) => formatBytes(v)}
                            yAxisFormatter={(v) => formatBytes(v)}
                        />
                    </FadeIn>
                </div>
            )}
        </FadeIn>
    );
}
