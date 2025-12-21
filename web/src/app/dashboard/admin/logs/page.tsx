'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe, getAuditLogs, getAuditStats, type AuditLog, type AuditCategory, type AuditStatus, type AuditLogFilters } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
    Shield,
    FileText,
    Search,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Server,
    Wallet,
    Users,
    Database,
    Settings,
    Activity,
    ArrowLeft,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const categoryConfig: Record<AuditCategory, { label: string; icon: React.ElementType; color: string }> = {
    COMPUTE: { label: 'Compute', icon: Server, color: 'text-cyan-400 bg-cyan-400/10' },
    BILLING: { label: 'Facturation', icon: Wallet, color: 'text-emerald-400 bg-emerald-400/10' },
    AUTH: { label: 'Auth', icon: Users, color: 'text-violet-400 bg-violet-400/10' },
    BACKUP: { label: 'Backup', icon: Database, color: 'text-amber-400 bg-amber-400/10' },
    ADMIN: { label: 'Admin', icon: Settings, color: 'text-red-400 bg-red-400/10' },
    SYSTEM: { label: 'Système', icon: Activity, color: 'text-slate-400 bg-slate-400/10' },
};

const statusConfig: Record<AuditStatus, { label: string; icon: React.ElementType; color: string }> = {
    SUCCESS: { label: 'Succès', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' },
    ERROR: { label: 'Erreur', icon: XCircle, color: 'text-red-400 bg-red-400/10 border-red-500/30' },
    WARNING: { label: 'Avertissement', icon: AlertTriangle, color: 'text-amber-400 bg-amber-400/10 border-amber-500/30' },
};

const actionLabels: Record<string, string> = {
    CREATE_INSTANCE: 'Création instance',
    DELETE_INSTANCE: 'Suppression instance',
    START_VM: 'Démarrage VM',
    STOP_VM: 'Arrêt VM',
    RESTART_VM: 'Redémarrage VM',
    SHUTDOWN_VM: 'Extinction VM',
    CREATE_SNAPSHOT: 'Création snapshot',
    DELETE_SNAPSHOT: 'Suppression snapshot',
    ROLLBACK_SNAPSHOT: 'Rollback snapshot',
    ADD_CREDITS: 'Ajout crédits',
    DEDUCT_CREDITS: 'Débit crédits',
    REFUND_CREDITS: 'Remboursement',
    USER_LOGIN: 'Connexion',
    USER_LOGOUT: 'Déconnexion',
    UPDATE_USER_ROLE: 'Modification rôle',
    UPDATE_USER_LIMITS: 'Modification limites',
    DELETE_USER: 'Suppression utilisateur',
    CREATE_BACKUP: 'Création backup',
    DELETE_BACKUP: 'Suppression backup',
    RESTORE_BACKUP: 'Restauration backup',
    UPDATE_PRICING: 'Modification tarifs',
    UPDATE_BILLING_CONFIG: 'Modification config facturation',
    SYSTEM_ERROR: 'Erreur système',
};

function StatCard({ title, value, icon: Icon, iconColor }: { title: string; value: number | string; icon: React.ElementType; iconColor: string }) {
    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", iconColor)}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-slate-400">{title}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LogRow({ log }: { log: AuditLog }) {
    const category = categoryConfig[log.category];
    const status = statusConfig[log.status];
    const CategoryIcon = category?.icon || Activity;
    const StatusIcon = status?.icon || CheckCircle;

    return (
        <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
            {/* Status indicator */}
            <div className={cn("p-2 rounded-lg", status?.color)}>
                <StatusIcon className="h-4 w-4" />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">
                        {actionLabels[log.action] || log.action}
                    </span>
                    <Badge className={cn("text-xs px-2 py-0", category?.color, "border-0")}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {category?.label || log.category}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    {log.user?.username || log.username ? (
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {log.user?.username || log.username}
                        </span>
                    ) : null}
                    {log.targetName && (
                        <>
                            <span>→</span>
                            <span className="text-slate-300">{log.targetName}</span>
                        </>
                    )}
                    {log.errorMessage && (
                        <span className="text-red-400 truncate max-w-xs" title={log.errorMessage}>
                            {log.errorMessage}
                        </span>
                    )}
                </div>
            </div>

            {/* Timestamp */}
            <div className="text-right text-sm">
                <div className="text-slate-400">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </div>
                <div className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                </div>
            </div>
        </div>
    );
}

export default function AdminLogsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<AuditCategory | undefined>();
    const [selectedStatus, setSelectedStatus] = useState<AuditStatus | undefined>();
    const limit = 20;

    // Check if user is admin
    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });

    const filters: AuditLogFilters = {
        search: search || undefined,
        category: selectedCategory,
        status: selectedStatus,
    };

    const { data: logsData, isLoading, refetch } = useQuery({
        queryKey: ['audit-logs', page, filters],
        queryFn: () => getAuditLogs(filters, page, limit),
        enabled: currentUser?.role === 'ADMIN',
    });

    const { data: stats } = useQuery({
        queryKey: ['audit-stats'],
        queryFn: getAuditStats,
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

    const categories = Object.entries(categoryConfig) as [AuditCategory, typeof categoryConfig[AuditCategory]][];
    const statuses = Object.entries(statusConfig) as [AuditStatus, typeof statusConfig[AuditStatus]][];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-500/20">
                            <FileText className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Logs d'Audit</h1>
                            <p className="text-slate-400 mt-1">Historique de toutes les actions</p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Logs"
                    value={stats?.totalLogs || 0}
                    icon={FileText}
                    iconColor="bg-indigo-500/20 text-indigo-400"
                />
                <StatCard
                    title="Dernières 24h"
                    value={stats?.last24hCount || 0}
                    icon={Clock}
                    iconColor="bg-cyan-500/20 text-cyan-400"
                />
                <StatCard
                    title="7 derniers jours"
                    value={stats?.last7dCount || 0}
                    icon={Activity}
                    iconColor="bg-emerald-500/20 text-emerald-400"
                />
                <StatCard
                    title="Erreurs"
                    value={stats?.errorCount || 0}
                    icon={AlertTriangle}
                    iconColor="bg-red-500/20 text-red-400"
                />
            </div>

            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Filtres:</span>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 bg-slate-900/50 border-slate-700"
                            />
                        </div>

                        {/* Category filter */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={!selectedCategory ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => { setSelectedCategory(undefined); setPage(1); }}
                            >
                                Tous
                            </Button>
                            {categories.map(([key, config]) => (
                                <Button
                                    key={key}
                                    variant={selectedCategory === key ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => { setSelectedCategory(key); setPage(1); }}
                                    className={selectedCategory === key ? config.color : ''}
                                >
                                    <config.icon className="h-4 w-4 mr-1" />
                                    {config.label}
                                </Button>
                            ))}
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-2 ml-auto">
                            {statuses.map(([key, config]) => (
                                <Button
                                    key={key}
                                    variant={selectedStatus === key ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => {
                                        setSelectedStatus(selectedStatus === key ? undefined : key);
                                        setPage(1);
                                    }}
                                    className={selectedStatus === key ? config.color : ''}
                                >
                                    <config.icon className="h-4 w-4 mr-1" />
                                    {config.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            Logs ({logsData?.pagination.total || 0})
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : logsData?.logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <p>Aucun log trouvé</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {logsData?.logs.map((log) => (
                                <LogRow key={log.id} log={log} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {logsData && logsData.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
                            <p className="text-sm text-slate-400">
                                Page {logsData.pagination.page} sur {logsData.pagination.totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Précédent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(logsData.pagination.totalPages, p + 1))}
                                    disabled={page === logsData.pagination.totalPages}
                                >
                                    Suivant
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
