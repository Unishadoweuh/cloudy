'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useLanguage } from "@/lib/language-context";
import { getInstances, getMe } from "@/lib/api";
import type { Instance } from "@/lib/types";
import {
    Server,
    HardDrive,
    Network,
    LayoutDashboard,
    Plus,
    Zap,
    Shield,
    Settings,
    Users,
    BarChart3,
    Bell,
    Archive,
    Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "@/components/notifications-popover";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { t } = useLanguage();

    // Fetch instances to show count badges
    const { data: instances } = useQuery({
        queryKey: ['instances-sidebar'],
        queryFn: () => getInstances(),
        refetchInterval: 30000,
        staleTime: 10000,
    });

    const instanceCount = instances?.filter((i: Instance) => !i.template)?.length || 0;
    const runningCount = instances?.filter((i: Instance) => !i.template && i.status === 'running')?.length || 0;

    type NavigationItem = {
        name: string;
        href: string;
        icon: any;
        exact?: boolean;
        disabled?: boolean;
        badge?: number | string;
        badgeColor?: string;
    };

    const navigation: NavigationItem[] = [
        {
            name: t('nav.dashboard'),
            href: "/dashboard",
            icon: LayoutDashboard,
            exact: true,
        },
        {
            name: t('nav.instances'),
            href: "/dashboard/instances",
            icon: Server,
            badge: instanceCount > 0 ? `${runningCount}/${instanceCount}` : undefined,
            badgeColor: runningCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400',
        },
        {
            name: t('nav.volumes'),
            href: "/dashboard/volumes",
            icon: HardDrive,
        },
        {
            name: t('nav.networks'),
            href: "/dashboard/networks",
            icon: Network,
        },
        {
            name: 'Sauvegardes',
            href: "/dashboard/backups",
            icon: Archive,
        },
        {
            name: 'Facturation',
            href: "/dashboard/billing",
            icon: Wallet,
        },
    ];

    const secondaryNav: NavigationItem[] = [
        {
            name: t('nav.security'),
            href: "/dashboard/security",
            icon: Shield,
        },
        {
            name: t('nav.monitoring'),
            href: "/dashboard/monitoring",
            icon: BarChart3,
        },
        {
            name: t('nav.users'),
            href: "/dashboard/users",
            icon: Users,
        },
    ];

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800/50">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-5 border-b border-slate-800/50">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors">
                                <Zap className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Uni-Cloud</h1>
                                <p className="text-xs text-slate-500">Proxmox Dashboard</p>
                            </div>
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                            Infrastructure
                        </p>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.disabled ? "#" : item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                        isActive
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                        item.disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive && "text-cyan-400")} />
                                    <span className="font-medium">{item.name}</span>
                                    {item.badge && (
                                        <span className={cn(
                                            "ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium",
                                            item.badgeColor || "bg-slate-700 text-slate-400"
                                        )}>
                                            {item.badge}
                                        </span>
                                    )}
                                    {item.disabled && !item.badge && (
                                        <span className="ml-auto text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                            Soon
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        <div className="pt-4">
                            <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                                Management
                            </p>
                            {secondaryNav.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.disabled ? "#" : item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                            isActive
                                                ? "bg-slate-800 text-white"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                            item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5", isActive && "text-cyan-400")} />
                                        <span className="font-medium">{item.name}</span>
                                        {item.disabled && (
                                            <span className="ml-auto text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                                Soon
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Bottom Section */}
                    <div className="p-4 border-t border-slate-800/50 space-y-2">
                        <NotificationsPopover />

                        <Link
                            href="/dashboard/settings"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                pathname === '/dashboard/settings'
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <Settings className={cn("h-5 w-5", pathname === '/dashboard/settings' && "text-cyan-400")} />
                            <span className="font-medium">{t('common.settings')}</span>
                        </Link>

                        {/* Status - hidden on main dashboard page */}
                        {pathname !== '/dashboard' && (
                            <div className="mt-4 px-3 py-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                    </span>
                                    <span className="text-sm text-white">{t('dashboard.systemOnline')}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 ml-4">{t('dashboard.allServicesRunning')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <Breadcrumbs />
                        <GlobalSearch />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
