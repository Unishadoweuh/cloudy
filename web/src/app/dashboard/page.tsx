'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getInstances, getNodes, getNotifications } from '@/lib/api';
import type { Instance } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedCounter, FadeIn, PulseIndicator } from '@/components/Animations';
import {
    Server,
    Box,
    Activity,
    Cpu,
    Plus,
    ArrowRight,
    Zap,
    HardDrive,
    Network,
    Bell,
    Clock,
    CheckCircle,
    AlertCircle,
    Info,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function QuickStatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    href,
    delay = 0,
}: {
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    href?: string;
    delay?: number;
}) {
    const content = (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 group",
            "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
            "border-slate-700/50 hover:border-slate-600/50",
            href && "cursor-pointer hover:scale-[1.02]"
        )}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-30", color)} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-white">
                            <AnimatedCounter value={value} duration={1200} />
                        </p>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn(
                        "p-3 rounded-xl transition-transform group-hover:scale-110",
                        color.replace('bg-', 'bg-').replace('-500', '-500/20')
                    )}>
                        <Icon className={cn("h-6 w-6", color.replace('bg-', 'text-'))} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const wrappedContent = (
        <FadeIn delay={delay} direction="up">
            {content}
        </FadeIn>
    );

    if (href) {
        return <Link href={href}>{wrappedContent}</Link>;
    }
    return wrappedContent;
}

function QuickActionCard({
    title,
    description,
    icon: Icon,
    href,
    color,
    delay = 0,
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: string;
    delay?: number;
}) {
    return (
        <FadeIn delay={delay} direction="up">
            <Link href={href}>
                <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 group cursor-pointer",
                    "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
                    "border-slate-700/50 hover:border-slate-600/50",
                    "hover:scale-[1.02]"
                )}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", color)}>
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                    {title}
                                </h3>
                                <p className="text-sm text-slate-400">{description}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </FadeIn>
    );
}

function ActivityItem({
    notification,
    delay
}: {
    notification: { id: string; title: string; message: string; type: string; createdAt: string; read: boolean };
    delay: number;
}) {
    const typeIcons = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertCircle,
        info: Info,
    };
    const typeColors = {
        success: 'text-emerald-400 bg-emerald-500/10',
        error: 'text-red-400 bg-red-500/10',
        warning: 'text-amber-400 bg-amber-500/10',
        info: 'text-cyan-400 bg-cyan-500/10',
    };

    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
    const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.info;

    return (
        <FadeIn delay={delay} direction="left">
            <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                "hover:bg-slate-800/50",
                !notification.read && "bg-slate-800/30"
            )}>
                <div className={cn("p-2 rounded-lg", colorClass.split(' ')[1])}>
                    <Icon className={cn("h-4 w-4", colorClass.split(' ')[0])} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{notification.title}</p>
                    <p className="text-xs text-slate-400 truncate">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                </div>
                {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                )}
            </div>
        </FadeIn>
    );
}

export default function DashboardPage() {
    const { data: instances, refetch: refetchInstances, isFetching } = useQuery({
        queryKey: ['instances'],
        queryFn: () => getInstances(),
    });

    const { data: nodes } = useQuery({
        queryKey: ['nodes'],
        queryFn: getNodes,
    });

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
    });

    const filteredInstances = instances?.filter((i: Instance) => !i.template) || [];
    const runningCount = filteredInstances.filter((i: Instance) => i.status === 'running').length;
    const vmCount = filteredInstances.filter((i: Instance) => i.type === 'qemu').length;
    const lxcCount = filteredInstances.filter((i: Instance) => i.type === 'lxc').length;
    const recentNotifications = (notifications || []).slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Header */}
            <FadeIn delay={0} direction="down">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-white">
                                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Uni-Cloud</span>
                            </h1>
                        </div>
                        <p className="text-slate-400">
                            Your Proxmox infrastructure at a glance
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchInstances()}
                        disabled={isFetching}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                        Rafraîchir
                    </Button>
                </div>
            </FadeIn>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <QuickStatCard
                    title="Total Instances"
                    value={filteredInstances.length}
                    subtitle={`${vmCount} VMs, ${lxcCount} containers`}
                    icon={Server}
                    color="bg-cyan-500"
                    href="/dashboard/instances"
                    delay={100}
                />
                <QuickStatCard
                    title="Running"
                    value={runningCount}
                    subtitle={`${filteredInstances.length > 0 ? Math.round((runningCount / filteredInstances.length) * 100) : 0}% uptime`}
                    icon={Activity}
                    color="bg-emerald-500"
                    delay={150}
                />
                <QuickStatCard
                    title="Virtual Machines"
                    value={vmCount}
                    subtitle="KVM"
                    icon={Cpu}
                    color="bg-violet-500"
                    delay={200}
                />
                <QuickStatCard
                    title="Containers"
                    value={lxcCount}
                    subtitle="LXC"
                    icon={Box}
                    color="bg-amber-500"
                    delay={250}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <FadeIn delay={300} direction="up">
                        <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                    </FadeIn>
                    <div className="grid gap-4 md:grid-cols-2">
                        <QuickActionCard
                            title="Create Instance"
                            description="Deploy a new VM or container"
                            icon={Plus}
                            href="/dashboard/instances/new"
                            color="bg-gradient-to-br from-cyan-500 to-cyan-600"
                            delay={350}
                        />
                        <QuickActionCard
                            title="View Instances"
                            description="Manage your running infrastructure"
                            icon={Server}
                            href="/dashboard/instances"
                            color="bg-gradient-to-br from-violet-500 to-violet-600"
                            delay={400}
                        />
                        <QuickActionCard
                            title="Storage"
                            description="Manage volumes and disks"
                            icon={HardDrive}
                            href="/dashboard/volumes"
                            color="bg-gradient-to-br from-amber-500 to-amber-600"
                            delay={450}
                        />
                        <QuickActionCard
                            title="Monitoring"
                            description="View metrics and performance"
                            icon={Activity}
                            href="/dashboard/monitoring"
                            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                            delay={500}
                        />
                    </div>

                    {/* System Status */}
                    <FadeIn delay={550} direction="up">
                        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse" />
                                        <div className="relative p-3 bg-emerald-500/20 rounded-full">
                                            <Zap className="h-6 w-6 text-emerald-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white">All Systems Operational</h3>
                                            <PulseIndicator color="emerald" size="sm" />
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            {nodes?.length || 0} nodes online • Your infrastructure is running smoothly
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>

                {/* Right: Activity Feed */}
                <div>
                    <FadeIn delay={300} direction="up">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Bell className="h-5 w-5 text-slate-400" />
                                Recent Activity
                            </h2>
                            <Link href="/dashboard/settings" className="text-xs text-cyan-400 hover:text-cyan-300">
                                View all
                            </Link>
                        </div>
                    </FadeIn>
                    <FadeIn delay={350} direction="up">
                        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                            <CardContent className="p-4">
                                {recentNotifications.length > 0 ? (
                                    <div className="space-y-1">
                                        {recentNotifications.map((n: any, i: number) => (
                                            <ActivityItem key={n.id} notification={n} delay={400 + i * 50} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Bell className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400">No recent activity</p>
                                        <p className="text-xs text-slate-500">Your actions will appear here</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>
            </div>
        </div>
    );
}
