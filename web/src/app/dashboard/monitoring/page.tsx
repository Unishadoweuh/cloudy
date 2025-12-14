'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getClusterStats, getNodes, getNodeMetrics } from '@/lib/api';
import type { ClusterStats, Node, RrdDataPoint } from '@/lib/types';
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
                existing[nodeName] = point[dataKey as keyof RrdDataPoint] as number;
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

// Disk usage per node component
function DiskUsageCard({ nodes }: { nodes: Node[] }) {
    const { t } = useLanguage();

    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{t('monitoring.diskUsage')} par serveur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {nodes.map((node, index) => {
                    const diskPercent = node.maxdisk ? ((node.disk || 0) / node.maxdisk) * 100 : 0;
                    return (
                        <div key={node.node}>
                            <div className="flex justify-between text-sm mb-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: NODE_COLORS[index % NODE_COLORS.length] }}
                                    />
                                    <span className="text-white font-medium">{node.node}</span>
                                </div>
                                <span className="text-slate-400">
                                    {formatBytes(node.disk || 0)} / {formatBytes(node.maxdisk || 0)}
                                </span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${diskPercent}%`,
                                        backgroundColor: NODE_COLORS[index % NODE_COLORS.length],
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>{diskPercent.toFixed(1)}% utilisé</span>
                                <span>{formatBytes((node.maxdisk || 0) - (node.disk || 0))} libre</span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function NodeStatusCard({ node, colorIndex }: { node: Node; colorIndex: number }) {
    const cpuPercent = (node.cpu || 0) * 100;
    const memPercent = node.maxmem ? ((node.mem || 0) / node.maxmem) * 100 : 0;
    const diskPercent = node.maxdisk ? ((node.disk || 0) / node.maxdisk) * 100 : 0;
    const nodeColor = NODE_COLORS[colorIndex % NODE_COLORS.length];

    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${nodeColor}20` }}
                    >
                        <Server className="h-4 w-4" style={{ color: nodeColor }} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-white">{node.node}</h3>
                        <p className="text-xs text-slate-500 capitalize">{node.status}</p>
                    </div>
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        node.status === 'online' ? "bg-emerald-400" : "bg-slate-500"
                    )} />
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">CPU</span>
                            <span className="text-white">{cpuPercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${cpuPercent}%`, backgroundColor: nodeColor }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Memory</span>
                            <span className="text-white">{formatBytes(node.mem || 0)} / {formatBytes(node.maxmem || 0)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${memPercent}%`, backgroundColor: nodeColor }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Disk</span>
                            <span className="text-white">{formatBytes(node.disk || 0)} / {formatBytes(node.maxdisk || 0)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${diskPercent}%`, backgroundColor: nodeColor }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-800/30 rounded-xl animate-pulse" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-64 bg-slate-800/30 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    );
}

export default function MonitoringPage() {
    const { t } = useLanguage();
    const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week'>('hour');

    const { data: clusterStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['cluster-stats'],
        queryFn: getClusterStats,
        refetchInterval: 30000,
    });

    const { data: nodes, isLoading: nodesLoading, refetch: refetchNodes } = useQuery({
        queryKey: ['nodes'],
        queryFn: getNodes,
    });

    const nodeNames = useMemo(() => (nodes || []).map((n: Node) => n.node), [nodes]);

    // Fetch metrics for ALL nodes using useQueries
    const metricsQueries = useQueries({
        queries: nodeNames.map((nodeName: string) => ({
            queryKey: ['node-metrics', nodeName, timeframe],
            queryFn: () => getNodeMetrics(nodeName, timeframe),
            enabled: !!nodeName,
            refetchInterval: 60000,
        })),
    });

    const isFetching = metricsQueries.some(q => q.isFetching);

    // Combine all node metrics into a single object
    const allMetrics = useMemo(() => {
        const result: Record<string, RrdDataPoint[]> = {};
        metricsQueries.forEach((query, index) => {
            if (query.data && nodeNames[index]) {
                result[nodeNames[index]] = query.data;
            }
        });
        return result;
    }, [metricsQueries, nodeNames]);

    const isLoading = statsLoading || nodesLoading;

    const refetchAll = () => {
        refetchStats();
        refetchNodes();
        metricsQueries.forEach(q => q.refetch());
    };

    const cpuPercent = clusterStats ? clusterStats.usedCpu * 100 : 0;
    const memPercent = clusterStats ? (clusterStats.usedMem / clusterStats.totalMem) * 100 : 0;
    const diskPercent = clusterStats ? (clusterStats.usedDisk / clusterStats.totalDisk) * 100 : 0;

    if (isLoading) return <LoadingSkeleton />;

    const hasMetrics = Object.keys(allMetrics).length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('monitoring.title')}</h1>
                    <p className="text-slate-500 text-sm">{t('monitoring.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
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

            {/* Cluster Stats */}
            <div className="grid gap-4 md:grid-cols-4">
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
            </div>

            {/* Multi-Node Charts */}
            {hasMetrics && (
                <div className="grid gap-4 md:grid-cols-2">
                    <MultiNodeChart
                        title={`${t('monitoring.cpuUsage')} - Tous les serveurs`}
                        allMetrics={allMetrics}
                        nodeNames={nodeNames}
                        dataKey="cpu"
                        formatter={(v) => `${(v * 100).toFixed(1)}%`}
                        yAxisFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <MultiNodeChart
                        title={`${t('monitoring.memoryUsage')} - Tous les serveurs`}
                        allMetrics={allMetrics}
                        nodeNames={nodeNames}
                        dataKey="memused"
                        formatter={(v) => formatBytes(v)}
                        yAxisFormatter={(v) => formatBytes(v)}
                    />
                </div>
            )}

            {/* Disk Usage Per Server */}
            {nodes && nodes.length > 0 && (
                <DiskUsageCard nodes={nodes} />
            )}

            {/* Network Traffic */}
            {hasMetrics && (
                <Card className="bg-slate-800/30 border-slate-700/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">{t('monitoring.networkTraffic')} - Tous les serveurs</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={(() => {
                                    const timeMap = new Map<number, Record<string, number | string>>();
                                    for (const nodeName of nodeNames) {
                                        const nodeData = allMetrics[nodeName] || [];
                                        for (const point of nodeData) {
                                            const existing = timeMap.get(point.time) || { time: point.time, timeLabel: formatTime(point.time) };
                                            existing[`${nodeName}_in`] = point.netin || 0;
                                            existing[`${nodeName}_out`] = point.netout || 0;
                                            timeMap.set(point.time, existing);
                                        }
                                    }
                                    return Array.from(timeMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
                                })()}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="timeLabel" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickFormatter={(v) => formatBytes(v)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    formatter={(value: number, name: string) => [formatBytes(value), name]}
                                />
                                <Legend formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
                                {nodeNames.map((nodeName: string, index: number) => (
                                    <Line
                                        key={`${nodeName}_in`}
                                        type="monotone"
                                        dataKey={`${nodeName}_in`}
                                        stroke={NODE_COLORS[index % NODE_COLORS.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        name={`${nodeName} (in)`}
                                    />
                                ))}
                                {nodeNames.map((nodeName: string, index: number) => (
                                    <Line
                                        key={`${nodeName}_out`}
                                        type="monotone"
                                        dataKey={`${nodeName}_out`}
                                        stroke={NODE_COLORS[index % NODE_COLORS.length]}
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name={`${nodeName} (out)`}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Node Status */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">{t('monitoring.clusterOverview')}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(nodes || []).map((node: Node, index: number) => (
                        <NodeStatusCard key={node.node} node={node} colorIndex={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}
