'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getInstances, getNodes } from '@/lib/api';
import type { Instance } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

function QuickStatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    href,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    href?: string;
}) {
    const content = (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 group",
            "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
            "border-slate-700/50 hover:border-slate-600/50",
            href && "cursor-pointer hover:scale-[1.02]"
        )}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2", color)} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-white">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-xl", color.replace('bg-', 'bg-').replace('-500', '-500/20'))}>
                        <Icon className={cn("h-6 w-6", color.replace('bg-', 'text-'))} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return content;
}

function QuickActionCard({
    title,
    description,
    icon: Icon,
    href,
    color,
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: string;
}) {
    return (
        <Link href={href}>
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300 group cursor-pointer",
                "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
                "border-slate-700/50 hover:border-slate-600/50",
                "hover:scale-[1.02]"
            )}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", color)}>
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
    );
}

export default function DashboardPage() {
    const { data: instances } = useQuery({
        queryKey: ['instances'],
        queryFn: () => getInstances(),
    });

    const { data: nodes } = useQuery({
        queryKey: ['nodes'],
        queryFn: getNodes,
    });

    const filteredInstances = instances?.filter((i: Instance) => !i.template) || [];
    const runningCount = filteredInstances.filter((i: Instance) => i.status === 'running').length;
    const vmCount = filteredInstances.filter((i: Instance) => i.type === 'qemu').length;
    const lxcCount = filteredInstances.filter((i: Instance) => i.type === 'lxc').length;

    return (
        <div className="space-y-8">
            {/* Header */}
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

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <QuickStatCard
                    title="Total Instances"
                    value={filteredInstances.length}
                    subtitle={`${vmCount} VMs, ${lxcCount} containers`}
                    icon={Server}
                    color="bg-cyan-500"
                    href="/dashboard/instances"
                />
                <QuickStatCard
                    title="Running"
                    value={runningCount}
                    subtitle={`${Math.round((runningCount / filteredInstances.length) * 100) || 0}% uptime`}
                    icon={Activity}
                    color="bg-emerald-500"
                />
                <QuickStatCard
                    title="Virtual Machines"
                    value={vmCount}
                    subtitle="KVM"
                    icon={Cpu}
                    color="bg-violet-500"
                />
                <QuickStatCard
                    title="Containers"
                    value={lxcCount}
                    subtitle="LXC"
                    icon={Box}
                    color="bg-amber-500"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <QuickActionCard
                        title="Create Instance"
                        description="Deploy a new VM or container"
                        icon={Plus}
                        href="/dashboard/instances/new"
                        color="bg-gradient-to-br from-cyan-500 to-cyan-600"
                    />
                    <QuickActionCard
                        title="View Instances"
                        description="Manage your running infrastructure"
                        icon={Server}
                        href="/dashboard/instances"
                        color="bg-gradient-to-br from-violet-500 to-violet-600"
                    />
                    <QuickActionCard
                        title="Storage"
                        description="Manage volumes and disks"
                        icon={HardDrive}
                        href="/dashboard/volumes"
                        color="bg-gradient-to-br from-amber-500 to-amber-600"
                    />
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full" />
                                <div className="relative p-3 bg-emerald-500/20 rounded-full">
                                    <Zap className="h-6 w-6 text-emerald-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">All Systems Operational</h3>
                                <p className="text-sm text-slate-400">
                                    Your infrastructure is running smoothly
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
