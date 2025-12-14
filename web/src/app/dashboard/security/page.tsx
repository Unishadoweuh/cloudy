'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFirewallRules } from '@/lib/api';
import type { FirewallRule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    Shield,
    ShieldCheck,
    ShieldX,
    RefreshCw,
    Search,
    ArrowDownLeft,
    ArrowUpRight,
    Server,
    Layers,
    Box,
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
    value: number;
    icon: React.ElementType;
    iconColor: string;
}) {
    return (
        <Card className="bg-slate-800/30 border-slate-700/30">
            <CardContent className="p-5">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-lg bg-slate-700/30")}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-xs text-slate-500">{title}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RuleRow({ rule }: { rule: FirewallRule }) {
    const { t } = useLanguage();

    const getActionColor = (action: string) => {
        switch (action) {
            case 'ACCEPT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'DROP': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'REJECT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getScopeIcon = (scope?: string) => {
        switch (scope) {
            case 'cluster': return <Layers className="h-4 w-4 text-violet-400" />;
            case 'node': return <Server className="h-4 w-4 text-cyan-400" />;
            case 'vm': return <Box className="h-4 w-4 text-amber-400" />;
            default: return <Shield className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    {getScopeIcon(rule.scope)}
                    <span className="text-slate-300 capitalize">{rule.scope || 'cluster'}</span>
                    {rule.vmid && <span className="text-slate-500">/ VM {rule.vmid}</span>}
                </div>
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                    {rule.type === 'in' ? (
                        <ArrowDownLeft className="h-4 w-4 text-cyan-400" />
                    ) : (
                        <ArrowUpRight className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="text-slate-300 capitalize">
                        {rule.type === 'in' ? t('security.inbound') : t('security.outbound')}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4">
                <Badge variant="outline" className={cn("font-medium", getActionColor(rule.action))}>
                    {rule.action}
                </Badge>
            </td>
            <td className="py-3 px-4 text-slate-300 font-mono text-sm">
                {rule.proto?.toUpperCase() || 'ANY'}
            </td>
            <td className="py-3 px-4 text-slate-300 font-mono text-sm">
                {rule.dport || '-'}
            </td>
            <td className="py-3 px-4 text-slate-400 text-sm max-w-[200px] truncate">
                {rule.comment || '-'}
            </td>
            <td className="py-3 px-4">
                <Badge
                    variant="outline"
                    className={cn(
                        "font-medium",
                        rule.enable === 1
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                    )}
                >
                    {rule.enable === 1 ? t('security.enabled') : t('security.disabled')}
                </Badge>
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
            <div className="h-96 bg-slate-800/30 rounded-xl animate-pulse" />
        </div>
    );
}

export default function SecurityPage() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [scopeFilter, setScopeFilter] = useState<string>('all');
    const [actionFilter, setActionFilter] = useState<string>('all');

    const { data: rules, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['firewall-rules'],
        queryFn: () => getFirewallRules(),
        refetchInterval: 30000,
    });

    const filteredRules = useMemo(() => {
        if (!rules) return [];
        return rules.filter((rule) => {
            const matchesSearch = !searchQuery ||
                rule.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.dport?.includes(searchQuery) ||
                rule.proto?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesScope = scopeFilter === 'all' || rule.scope === scopeFilter;
            const matchesAction = actionFilter === 'all' || rule.action === actionFilter;
            return matchesSearch && matchesScope && matchesAction;
        });
    }, [rules, searchQuery, scopeFilter, actionFilter]);

    const stats = useMemo(() => {
        if (!rules) return { total: 0, accept: 0, drop: 0, inbound: 0 };
        return {
            total: rules.length,
            accept: rules.filter(r => r.action === 'ACCEPT').length,
            drop: rules.filter(r => r.action === 'DROP' || r.action === 'REJECT').length,
            inbound: rules.filter(r => r.type === 'in').length,
        };
    }, [rules]);

    if (isLoading) return <LoadingSkeleton />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <ShieldX className="h-16 w-16 text-red-400" />
                <h2 className="text-xl font-semibold text-white">Error loading firewall rules</h2>
                <p className="text-slate-400">{(error as Error)?.message}</p>
                <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
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
                    <h1 className="text-2xl font-bold text-white">{t('security.title')}</h1>
                    <p className="text-slate-500 text-sm">{t('security.subtitle')}</p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                    <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title={t('security.firewallRules')}
                    value={stats.total}
                    icon={Shield}
                    iconColor="text-violet-400"
                />
                <StatsCard
                    title={t('security.accept')}
                    value={stats.accept}
                    icon={ShieldCheck}
                    iconColor="text-emerald-400"
                />
                <StatsCard
                    title={t('security.drop')}
                    value={stats.drop}
                    icon={ShieldX}
                    iconColor="text-red-400"
                />
                <StatsCard
                    title={t('security.inbound')}
                    value={stats.inbound}
                    icon={ArrowDownLeft}
                    iconColor="text-cyan-400"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder={`${t('common.search')}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                </div>
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                    <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700 text-slate-300">
                        <SelectValue placeholder={t('security.allScopes')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">{t('security.allScopes')}</SelectItem>
                        <SelectItem value="cluster">{t('security.cluster')}</SelectItem>
                        <SelectItem value="node">Node</SelectItem>
                        <SelectItem value="vm">VM</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-32 bg-slate-900/50 border-slate-700 text-slate-300">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="ACCEPT">{t('security.accept')}</SelectItem>
                        <SelectItem value="DROP">{t('security.drop')}</SelectItem>
                        <SelectItem value="REJECT">{t('security.reject')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Rules Table */}
            <Card className="bg-slate-800/30 border-slate-700/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Scope</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Direction</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">{t('security.protocol')}</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">{t('security.port')}</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Comment</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRules.length > 0 ? (
                                filteredRules.map((rule, index) => (
                                    <RuleRow key={`${rule.scope}-${rule.pos}-${index}`} rule={rule} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500">
                                        <Shield className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                                        <p>{t('security.noRules')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
