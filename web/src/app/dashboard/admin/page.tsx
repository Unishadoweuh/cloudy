'use client';

import { useQuery } from '@tanstack/react-query';
import { getMe, getAllBalances, getInstances, getNodes } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    Shield,
    Users,
    Wallet,
    Server,
    Activity,
    Settings,
    ChevronRight,
    BarChart3,
    Euro,
    HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}

function AdminCard({
    title,
    description,
    icon: Icon,
    href,
    stats,
    iconColor,
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    stats?: { label: string; value: string | number }[];
    iconColor: string;
}) {
    return (
        <Link href={href}>
            <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer group">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={cn("p-3 rounded-xl", iconColor)}>
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors">
                                    {title}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">{description}</p>
                                {stats && stats.length > 0 && (
                                    <div className="flex gap-4 mt-3">
                                        {stats.map((stat, i) => (
                                            <div key={i} className="text-sm">
                                                <span className="text-slate-500">{stat.label}:</span>{' '}
                                                <span className="font-semibold text-white">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function AdminDashboardPage() {
    // Check if user is admin
    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });

    const { data: balances } = useQuery({
        queryKey: ['admin-balances'],
        queryFn: getAllBalances,
        enabled: currentUser?.role === 'ADMIN',
    });

    const { data: instances } = useQuery({
        queryKey: ['instances', true],
        queryFn: () => getInstances(true),
        enabled: currentUser?.role === 'ADMIN',
    });

    const { data: nodes } = useQuery({
        queryKey: ['nodes'],
        queryFn: getNodes,
        enabled: currentUser?.role === 'ADMIN',
    });

    if (currentUser?.role !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Shield className="h-16 w-16 text-red-400 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
                <p className="text-slate-400">
                    Cette page est réservée aux administrateurs.
                </p>
            </div>
        );
    }

    const totalCredits = balances?.reduce((sum, b) => sum + b.balance, 0) || 0;
    const userCount = balances?.length || 0;
    const instanceCount = instances?.length || 0;
    const runningCount = instances?.filter((i: any) => i.status === 'running')?.length || 0;
    const nodeCount = nodes?.length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20">
                    <Shield className="h-8 w-8 text-red-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Administration</h1>
                    <p className="text-slate-400 mt-1">Panneau de contrôle administrateur</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-violet-400" />
                            <div>
                                <p className="text-2xl font-bold">{userCount}</p>
                                <p className="text-xs text-slate-400">Utilisateurs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Euro className="h-5 w-5 text-emerald-400" />
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalCredits)}</p>
                                <p className="text-xs text-slate-400">Crédits totaux</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Server className="h-5 w-5 text-cyan-400" />
                            <div>
                                <p className="text-2xl font-bold">{runningCount}/{instanceCount}</p>
                                <p className="text-xs text-slate-400">Instances running</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-amber-400" />
                            <div>
                                <p className="text-2xl font-bold">{nodeCount}</p>
                                <p className="text-xs text-slate-400">Nœuds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Admin Sections */}
            <div className="grid gap-4 md:grid-cols-2">
                <AdminCard
                    title="Gestion des Crédits"
                    description="Allouer ou retirer des crédits aux utilisateurs"
                    icon={Wallet}
                    href="/dashboard/admin/billing"
                    iconColor="bg-emerald-500"
                    stats={[
                        { label: 'Utilisateurs', value: userCount },
                        { label: 'Total', value: formatCurrency(totalCredits) },
                    ]}
                />
                <AdminCard
                    title="Gestion des Utilisateurs"
                    description="Gérer les comptes et permissions utilisateurs"
                    icon={Users}
                    href="/dashboard/users"
                    iconColor="bg-violet-500"
                    stats={[
                        { label: 'Total', value: userCount },
                    ]}
                />
                <AdminCard
                    title="Toutes les Instances"
                    description="Voir et gérer toutes les instances du cluster"
                    icon={Server}
                    href="/dashboard/instances?showAll=true"
                    iconColor="bg-cyan-500"
                    stats={[
                        { label: 'Running', value: runningCount },
                        { label: 'Total', value: instanceCount },
                    ]}
                />
                <AdminCard
                    title="Monitoring Cluster"
                    description="Surveillance globale des ressources"
                    icon={BarChart3}
                    href="/dashboard/monitoring"
                    iconColor="bg-amber-500"
                    stats={[
                        { label: 'Nœuds', value: nodeCount },
                    ]}
                />
                <AdminCard
                    title="Sécurité"
                    description="Règles de pare-feu et politiques de sécurité"
                    icon={Shield}
                    href="/dashboard/security"
                    iconColor="bg-red-500"
                />
                <AdminCard
                    title="Paramètres"
                    description="Configuration générale de la plateforme"
                    icon={Settings}
                    href="/dashboard/settings"
                    iconColor="bg-slate-600"
                />
            </div>
        </div>
    );
}
