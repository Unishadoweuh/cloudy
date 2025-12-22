'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getInstances, getMe, vmAction, getVnc, getInstanceMetrics } from '@/lib/api';
import type { Instance, VmAction, RrdDataPoint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VncConsole } from '@/components/VncConsole';
import { SnapshotsTab } from '@/components/SnapshotsTab';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Play,
    Square,
    RotateCw,
    Power,
    ArrowLeft,
    Server,
    Box,
    Cpu,
    MemoryStick,
    HardDrive,
    Activity,
    Loader2,
    AlertCircle,
    Terminal,
    CheckCircle,
    Zap,
    Globe,
    ExternalLink,
    RefreshCw,
    Camera,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function StatusBadge({ status }: { status: string }) {
    const isRunning = status === 'running';
    return (
        <Badge
            className={cn(
                "gap-2 capitalize px-4 py-2 text-sm font-medium transition-all duration-300",
                isRunning
                    ? "bg-green-500/20 text-green-400 border-green-500/30 glow-sm"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
            )}
        >
            <span
                className={cn(
                    "w-2 h-2 rounded-full",
                    isRunning ? "bg-green-400 animate-pulse" : "bg-gray-500"
                )}
            />
            {status}
        </Badge>
    );
}

function ActionButton({
    onClick,
    disabled,
    isPending,
    variant = "default",
    icon: Icon,
    children,
}: {
    onClick: () => void;
    disabled: boolean;
    isPending: boolean;
    variant?: "default" | "destructive" | "outline";
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    const baseClasses = "transition-all duration-300 hover-lift";
    const variantClasses = {
        default: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-500/90 hover:to-emerald-500/90 text-white border-0",
        destructive: "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-500/90 hover:to-rose-500/90 text-white border-0",
        outline: "border-white/10 hover:border-white/20 hover:bg-white/5",
    };

    return (
        <Button
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, variantClasses[variant])}
        >
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Icon className="mr-2 h-4 w-4" />
            )}
            {children}
        </Button>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color = "primary",
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: "primary" | "purple" | "green" | "orange";
}) {
    const colorClasses = {
        primary: "from-primary/20 to-primary/5 text-primary",
        purple: "from-purple-500/20 to-purple-500/5 text-purple-400",
        green: "from-green-500/20 to-green-500/5 text-green-400",
        orange: "from-orange-500/20 to-orange-500/5 text-orange-400",
    };

    return (
        <div className="glass rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            {/* Overlay removed as requested */}
            <div className="relative flex items-center gap-4">
                <div className={cn("p-3 rounded-lg bg-gradient-to-br", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white/5 rounded-lg shimmer" />
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-white/5 rounded-lg shimmer" />
                    <div className="h-4 w-40 bg-white/5 rounded-lg shimmer" />
                </div>
            </div>
            <div className="flex gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 w-28 bg-white/5 rounded-lg shimmer" />
                ))}
            </div>
            <div className="h-96 bg-white/5 rounded-xl shimmer" />
        </div>
    );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="p-6 bg-destructive/10 rounded-full mb-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to load instance</h2>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <Button
                onClick={onRetry}
                className="bg-primary hover:bg-primary/90 border-0"
            >
                Retry
            </Button>
        </div>
    );
}

function NotFoundState() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="p-6 bg-muted rounded-full mb-6">
                <Server className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Instance not found</h2>
            <p className="text-muted-foreground mb-6">
                The instance you are looking for does not exist.
            </p>
            <Button
                onClick={() => router.push('/dashboard/instances')}
                className="bg-primary hover:bg-primary/90 border-0"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Instances
            </Button>
        </div>
    );
}

export default function InstanceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [vncUrl, setVncUrl] = useState<string | null>(null);
    const [wsUrl, setWsUrl] = useState<string | null>(null);
    const [vncError, setVncError] = useState<string | null>(null);
    const [showEmbeddedConsole, setShowEmbeddedConsole] = useState(false);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [metricsTimeframe, setMetricsTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('hour');

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
    } = useQuery({
        queryKey: ['instances', isAdmin],
        queryFn: () => getInstances(isAdmin),
        enabled: currentUser !== undefined, // Wait for user info before fetching
    });

    const instance = instances?.find(
        (i: Instance) => i.vmid?.toString() === id || i.id?.endsWith(id)
    );

    // Fetch instance metrics for monitoring tab
    const {
        data: metrics,
        isLoading: metricsLoading,
        refetch: refetchMetrics
    } = useQuery({
        queryKey: ['instance-metrics', id, instance?.node, instance?.type, metricsTimeframe],
        queryFn: () => getInstanceMetrics(
            parseInt(id),
            instance?.node || '',
            instance?.type as 'qemu' | 'lxc' || 'qemu',
            metricsTimeframe
        ),
        enabled: !!instance,
        refetchInterval: 60000,
    });

    const queryClient = useQueryClient();

    const actionMutation = useMutation({
        mutationFn: ({ action }: { action: VmAction }) => {
            if (!instance) throw new Error('Instance not found');
            return vmAction(id, instance.node, action, instance.type);
        },
        onSuccess: (_, { action }) => {
            toast.success(
                `${action.charAt(0).toUpperCase() + action.slice(1)} command sent`,
                `Action performed on ${instance?.name || 'instance'}`
            );
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
        onError: (err: Error) => {
            toast.error('Action failed', err.message);
        },
    });

    const fetchConsole = useCallback(async () => {
        if (!instance) return;
        setVncError(null);
        try {
            const res = await getVnc(id, instance.node, instance.type);
            setVncUrl(res.vncUrl);
            setWsUrl(res.wsUrl || null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load console';
            setVncError(msg);
        }
    }, [id, instance]);

    if (isLoading) return <LoadingSkeleton />;
    if (isError) return <ErrorState error={error as Error} onRetry={refetch} />;
    if (!instance) return <NotFoundState />;

    const isRunning = instance.status === 'running';
    const isStopped = instance.status === 'stopped';
    const isPending = actionMutation.isPending;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard/instances')}
                        className="border border-white/10 hover:border-white/20 hover:bg-white/5"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div
                        className={cn(
                            "p-4 rounded-xl",
                            instance.type === 'qemu'
                                ? "bg-gradient-to-br from-primary/20 to-primary/5"
                                : "bg-gradient-to-br from-purple-500/20 to-purple-500/5"
                        )}
                    >
                        {instance.type === 'qemu' ? (
                            <Server className="h-8 w-8 text-primary" />
                        ) : (
                            <Box className="h-8 w-8 text-purple-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">{instance.name}</h1>
                        <p className="text-muted-foreground">
                            {instance.type.toUpperCase()} · Node: {instance.node} · ID: {instance.vmid}
                        </p>
                    </div>
                </div>
                <StatusBadge status={instance.status} />
            </div>

            {/* Toast Notifications */}
            {actionSuccess && (
                <div className="animate-slide-in-right flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>{actionSuccess}</span>
                </div>
            )}
            {actionError && (
                <div className="animate-slide-in-right flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>Error: {actionError}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setActionError(null)}
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
                <ActionButton
                    onClick={() => actionMutation.mutate({ action: 'start' })}
                    disabled={isRunning || isPending}
                    isPending={isPending}
                    variant="default"
                    icon={Play}
                >
                    Start
                </ActionButton>
                <ActionButton
                    onClick={() => actionMutation.mutate({ action: 'stop' })}
                    disabled={isStopped || isPending}
                    isPending={isPending}
                    variant="destructive"
                    icon={Square}
                >
                    Stop
                </ActionButton>
                <ActionButton
                    onClick={() => actionMutation.mutate({ action: 'reset' })}
                    disabled={isStopped || isPending}
                    isPending={isPending}
                    variant="outline"
                    icon={RotateCw}
                >
                    Reset
                </ActionButton>
                <ActionButton
                    onClick={() => actionMutation.mutate({ action: 'shutdown' })}
                    disabled={isStopped || isPending}
                    isPending={isPending}
                    variant="outline"
                    icon={Power}
                >
                    Shutdown
                </ActionButton>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="glass border border-white/10 p-1">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="console"
                        onClick={fetchConsole}
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
                    >
                        <Terminal className="mr-2 h-4 w-4" />
                        Console
                    </TabsTrigger>
                    <TabsTrigger
                        value="monitoring"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
                    >
                        <Activity className="mr-2 h-4 w-4" />
                        Monitoring
                    </TabsTrigger>
                    <TabsTrigger
                        value="snapshots"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        Snapshots
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Type"
                            value={instance.type === 'qemu' ? 'Virtual Machine' : 'LXC Container'}
                            icon={instance.type === 'qemu' ? Server : Box}
                            color={instance.type === 'qemu' ? 'primary' : 'purple'}
                        />
                        <StatCard
                            title="CPU"
                            value={`${instance.maxcpu} vCPU`}
                            icon={Cpu}
                            color="green"
                        />
                        <StatCard
                            title="Memory"
                            value={formatBytes(instance.maxmem)}
                            icon={MemoryStick}
                            color="orange"
                        />
                        <StatCard
                            title="Disk"
                            value={instance.maxdisk ? formatBytes(instance.maxdisk) : 'N/A'}
                            icon={HardDrive}
                            color="purple"
                        />
                    </div>

                    <Card className="glass border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                Instance Details
                            </CardTitle>
                            <CardDescription>
                                Technical information about this {instance.type === 'qemu' ? 'VM' : 'container'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">VMID</p>
                                    <p className="font-mono font-bold text-lg">{instance.vmid}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Node</p>
                                    <p className="font-bold text-lg">{instance.node}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                                    <p className={cn(
                                        "font-bold text-lg capitalize",
                                        isRunning ? "text-green-400" : "text-gray-400"
                                    )}>
                                        {instance.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                                    <p className="font-bold text-lg uppercase">{instance.type}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Console Tab */}
                <TabsContent value="console" className="mt-6">
                    <Card className="glass border-white/10 min-h-[500px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5 text-primary" />
                                    {instance.type === 'qemu' ? 'Console VNC' : 'Terminal'}
                                </CardTitle>
                                <CardDescription>
                                    {instance.type === 'qemu'
                                        ? 'Accès graphique via VNC'
                                        : 'Accès terminal au conteneur'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {wsUrl && showEmbeddedConsole && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(vncUrl || '', '_blank')}
                                        className="gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Nouvelle fenêtre
                                    </Button>
                                )}
                                {vncUrl && !showEmbeddedConsole && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowEmbeddedConsole(true)}
                                        className="gap-2"
                                    >
                                        <Terminal className="h-4 w-4" />
                                        Console intégrée
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {/* Embedded VNC Console */}
                            {showEmbeddedConsole && wsUrl ? (
                                <VncConsole
                                    wsUrl={wsUrl}
                                    className="flex-1 min-h-[450px]"
                                    onError={(err) => {
                                        setVncError(err);
                                        setShowEmbeddedConsole(false);
                                    }}
                                />
                            ) : (
                                /* Fallback / Initial View */
                                <div className="flex-1 flex flex-col items-center justify-center py-8">
                                    <div className="text-center max-w-md">
                                        <div className="p-6 bg-primary/10 rounded-full mb-6 inline-block">
                                            <Terminal className="h-16 w-16 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">Console Access</h3>

                                        {vncError ? (
                                            <div className="space-y-4">
                                                <p className="text-destructive text-sm">{vncError}</p>
                                                <Button onClick={fetchConsole} variant="outline">
                                                    Réessayer
                                                </Button>
                                            </div>
                                        ) : vncUrl ? (
                                            <div className="space-y-4">
                                                <p className="text-muted-foreground mb-4">
                                                    Choisissez comment accéder à la console de votre instance.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                                    {wsUrl && (
                                                        <Button
                                                            onClick={() => setShowEmbeddedConsole(true)}
                                                            className="bg-primary hover:bg-primary/90 gap-2"
                                                            size="lg"
                                                        >
                                                            <Terminal className="h-5 w-5" />
                                                            Console intégrée
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => window.open(vncUrl, '_blank')}
                                                        variant="outline"
                                                        size="lg"
                                                        className="gap-2"
                                                    >
                                                        <ExternalLink className="h-5 w-5" />
                                                        Ouvrir dans Proxmox
                                                    </Button>
                                                </div>

                                                {!wsUrl && (
                                                    <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 text-sm text-left">
                                                        <strong>Note:</strong> La console intégrée n&apos;est pas disponible.
                                                        Utilisez le bouton ci-dessus pour ouvrir la console Proxmox.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-muted-foreground justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Chargement de la console...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Monitoring Tab */}
                <TabsContent value="monitoring" className="mt-6 space-y-6">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Select value={metricsTimeframe} onValueChange={(v) => setMetricsTimeframe(v as typeof metricsTimeframe)}>
                                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="hour">1 heure</SelectItem>
                                    <SelectItem value="day">24 heures</SelectItem>
                                    <SelectItem value="week">7 jours</SelectItem>
                                    <SelectItem value="month">30 jours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchMetrics()}
                            disabled={metricsLoading}
                            className="gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", metricsLoading && "animate-spin")} />
                            Rafraîchir
                        </Button>
                    </div>

                    {metricsLoading ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-[300px] bg-slate-800/30 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : !metrics || metrics.length === 0 ? (
                        <Card className="glass border-white/10">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Activity className="h-12 w-12 text-slate-500 mb-4" />
                                <p className="text-slate-400">Aucune donnée de monitoring disponible</p>
                                <p className="text-sm text-slate-500 mt-1">L&apos;instance doit être en cours d&apos;exécution.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* CPU Chart */}
                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-cyan-400" />
                                        Utilisation CPU
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={metrics}>
                                                <defs>
                                                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => new Date(v * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                />
                                                <YAxis
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                                    domain={[0, 1]}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                    labelFormatter={(v) => new Date(v * 1000).toLocaleString('fr-FR')}
                                                    formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'CPU']}
                                                />
                                                <Area type="monotone" dataKey="cpu" stroke="#22d3ee" fill="url(#cpuGradient)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Memory Chart */}
                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MemoryStick className="h-4 w-4 text-violet-400" />
                                        Utilisation Mémoire
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={metrics}>
                                                <defs>
                                                    <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => new Date(v * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                />
                                                <YAxis
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => formatBytes(v)}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                    labelFormatter={(v) => new Date(v * 1000).toLocaleString('fr-FR')}
                                                    formatter={(v: number) => [formatBytes(v), 'Mémoire']}
                                                />
                                                <Area type="monotone" dataKey="mem" stroke="#a78bfa" fill="url(#memGradient)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Network In Chart */}
                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-emerald-400" />
                                        Réseau (Entrant)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={metrics}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => new Date(v * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                />
                                                <YAxis
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => formatBytes(v)}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                    labelFormatter={(v) => new Date(v * 1000).toLocaleString('fr-FR')}
                                                    formatter={(v: number) => [formatBytes(v), 'Entrant']}
                                                />
                                                <Line type="monotone" dataKey="netin" stroke="#34d399" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Network Out Chart */}
                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-amber-400" />
                                        Réseau (Sortant)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={metrics}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => new Date(v * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                />
                                                <YAxis
                                                    stroke="#64748b"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    tickFormatter={(v) => formatBytes(v)}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                    labelFormatter={(v) => new Date(v * 1000).toLocaleString('fr-FR')}
                                                    formatter={(v: number) => [formatBytes(v), 'Sortant']}
                                                />
                                                <Line type="monotone" dataKey="netout" stroke="#fbbf24" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* Snapshots Tab */}
                <TabsContent value="snapshots" className="mt-6">
                    <SnapshotsTab
                        vmid={parseInt(id)}
                        node={instance.node}
                        type={instance.type as 'qemu' | 'lxc'}
                        isRunning={isRunning}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
