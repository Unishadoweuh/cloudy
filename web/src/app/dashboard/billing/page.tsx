'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBillingSummary, getTransactions, getPricing } from '@/lib/api';
import type { Transaction, UsageRecord, PricingTier } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Wallet,
    TrendingDown,
    Clock,
    Server,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Euro,
    Zap,
    Calendar,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

function formatHours(hours: number | null): string {
    if (hours === null) return '∞';
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}j`;
}

function TransactionIcon({ type }: { type: string }) {
    switch (type) {
        case 'CREDIT':
            return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
        case 'DEBIT':
            return <ArrowDownRight className="h-4 w-4 text-red-400" />;
        case 'REFUND':
            return <ArrowUpRight className="h-4 w-4 text-cyan-400" />;
        default:
            return <Euro className="h-4 w-4 text-slate-400" />;
    }
}

function TransactionBadge({ type }: { type: string }) {
    const styles = {
        CREDIT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        DEBIT: 'bg-red-500/20 text-red-300 border-red-500/30',
        REFUND: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        ADJUSTMENT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
    return (
        <Badge variant="outline" className={cn('text-xs', styles[type as keyof typeof styles] || '')}>
            {type}
        </Badge>
    );
}

function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor,
    trend,
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    iconColor: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-400">{title}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                        {subtitle && (
                            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-xl", iconColor)}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ActiveUsageCard({ usage }: { usage: UsageRecord }) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                    <Server className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <p className="font-medium">{usage.vmName || `VM ${usage.vmid}`}</p>
                    <p className="text-xs text-slate-500">
                        {usage.cores} vCPU • {(usage.memoryMB / 1024).toFixed(1)}GB RAM • {usage.diskGB}GB
                    </p>
                </div>
            </div>
            <div className="text-right">
                <Badge variant="outline" className={cn(
                    'text-xs',
                    usage.billingMode === 'PAYG'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                )}>
                    {usage.billingMode === 'PAYG' ? (
                        <><Zap className="h-3 w-3 mr-1" /> PAYG</>
                    ) : (
                        <><Calendar className="h-3 w-3 mr-1" /> Reserved</>
                    )}
                </Badge>
                <p className="text-sm mt-1 text-slate-400">
                    {formatCurrency(usage.hourlyRate)}/h
                </p>
            </div>
        </div>
    );
}

function PricingCard({ pricing }: { pricing: PricingTier }) {
    return (
        <Card className={cn(
            "bg-slate-800/50 border-slate-700/50",
            pricing.isDefault && "ring-2 ring-cyan-500/50"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pricing.name}</CardTitle>
                    {pricing.isDefault && (
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            Par défaut
                        </Badge>
                    )}
                </div>
                {pricing.description && (
                    <CardDescription>{pricing.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-2">PAYG (Horaire)</p>
                        <div className="space-y-1 text-sm">
                            <p>CPU: {formatCurrency(pricing.cpuHourly)}/core/h</p>
                            <p>RAM: {formatCurrency(pricing.memoryHourly)}/GB/h</p>
                            <p>Disk: {formatCurrency(pricing.diskHourly)}/GB/h</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-2">Reserved (Mensuel)</p>
                        <div className="space-y-1 text-sm">
                            <p>CPU: {formatCurrency(pricing.cpuMonthly)}/core</p>
                            <p>RAM: {formatCurrency(pricing.memoryMonthly)}/GB</p>
                            <p>Disk: {formatCurrency(pricing.diskMonthly)}/GB</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />
                ))}
            </div>
            <div className="h-96 bg-slate-800/50 rounded-xl" />
        </div>
    );
}

export default function BillingPage() {
    const [tab, setTab] = useState<'overview' | 'transactions' | 'pricing'>('overview');

    const { data: summary, isLoading, refetch } = useQuery({
        queryKey: ['billing-summary'],
        queryFn: getBillingSummary,
    });

    const { data: transactions } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => getTransactions(50),
        enabled: tab === 'transactions',
    });

    const { data: pricing } = useQuery({
        queryKey: ['pricing'],
        queryFn: getPricing,
        enabled: tab === 'pricing',
    });

    if (isLoading) return <LoadingSkeleton />;

    const balance = summary?.balance || 0;
    const burnRate = summary?.hourlyBurnRate || 0;
    const remainingHours = summary?.estimatedRemainingHours;
    const activeCount = summary?.activeInstances || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Facturation</h1>
                    <p className="text-slate-400 mt-1">Gérez vos crédits et consultez votre consommation</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title="Solde"
                    value={formatCurrency(balance)}
                    subtitle={balance < 10 ? '⚠️ Solde faible' : undefined}
                    icon={Wallet}
                    iconColor={balance > 50 ? 'bg-emerald-500' : balance > 10 ? 'bg-amber-500' : 'bg-red-500'}
                />
                <StatsCard
                    title="Consommation"
                    value={`${formatCurrency(burnRate)}/h`}
                    subtitle={`~${formatCurrency(burnRate * 24 * 30)}/mois`}
                    icon={TrendingDown}
                    iconColor="bg-violet-500"
                />
                <StatsCard
                    title="Temps restant"
                    value={formatHours(remainingHours ?? null)}
                    subtitle={remainingHours && remainingHours < 24 ? '⚠️ Pensez à recharger' : undefined}
                    icon={Clock}
                    iconColor="bg-cyan-500"
                />
                <StatsCard
                    title="Instances actives"
                    value={String(activeCount)}
                    subtitle={`${summary?.activeUsage?.filter(u => u.billingMode === 'PAYG').length || 0} PAYG`}
                    icon={Server}
                    iconColor="bg-slate-600"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-2">
                {(['overview', 'transactions', 'pricing'] as const).map((t) => (
                    <Button
                        key={t}
                        variant={tab === t ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTab(t)}
                    >
                        {t === 'overview' && 'Aperçu'}
                        {t === 'transactions' && 'Transactions'}
                        {t === 'pricing' && 'Tarifs'}
                    </Button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Active Usage */}
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Server className="h-5 w-5 text-violet-400" />
                                Instances actives
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {summary?.activeUsage?.length ? (
                                summary.activeUsage.map((usage) => (
                                    <ActiveUsageCard key={usage.id} usage={usage} />
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">
                                    Aucune instance active
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Euro className="h-5 w-5 text-emerald-400" />
                                Transactions récentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {summary?.recentTransactions?.length ? (
                                summary.recentTransactions.slice(0, 5).map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <TransactionIcon type={tx.type} />
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[200px]">
                                                    {tx.description}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatDate(tx.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            'font-medium',
                                            tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                                        )}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">
                                    Aucune transaction
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {tab === 'transactions' && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle>Historique des transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {transactions?.length ? (
                                transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <TransactionIcon type={tx.type} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{tx.description}</p>
                                                    <TransactionBadge type={tx.type} />
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {formatDate(tx.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                'text-lg font-semibold',
                                                tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                                            )}>
                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Solde: {formatCurrency(tx.balance)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">
                                    Aucune transaction
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {tab === 'pricing' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-cyan-400" />
                            Économisez jusqu'à 30% avec Reserved
                        </h3>
                        <p className="text-slate-400 mt-2">
                            Le mode Reserved vous permet de réserver vos ressources à l'avance pour un mois,
                            avec une réduction significative par rapport au mode Pay-as-you-go.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pricing?.map((tier) => (
                            <PricingCard key={tier.id} pricing={tier} />
                        ))}
                        {!pricing?.length && (
                            <p className="text-slate-500 col-span-full text-center py-8">
                                Aucun tarif configuré
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
