'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useLanguage } from "@/lib/language-context";
import { useThemeClasses } from "@/lib/theme-context";
import { useBillingConfig } from "@/lib/billing-config";
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
    Menu,
    X,
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
    const themeClasses = useThemeClasses();
    const { enabled: billingEnabled } = useBillingConfig();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSidebarOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

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
        icon: React.ElementType;
        badge?: string | number;
        badgeColor?: string;
        disabled?: boolean;
        exact?: boolean;
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
            badgeColor: runningCount > 0 ? "bg-emerald-500/20 text-emerald-400" : undefined,
        },
        {
            name: 'Monitoring',
            href: "/dashboard/monitoring",
            icon: BarChart3,
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
        // Billing nav item - only shown if billing is enabled
        ...(billingEnabled ? [{
            name: 'Facturation',
            href: "/dashboard/billing",
            icon: Wallet,
        }] : []),
    ];

    const secondaryNav: NavigationItem[] = [
        {
            name: t('nav.users'),
            href: "/dashboard/users",
            icon: Users,
        },
        {
            name: 'Administration',
            href: "/dashboard/admin",
            icon: Shield,
        },
    ];

    // Sidebar content (reusable for both mobile and desktop)
    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                        <Zap className="h-5 w-5 text-[var(--theme-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Cloudy</h1>
                        <p className="text-xs text-white/50">Proxmox Dashboard</p>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
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
                                    ? themeClasses.sidebarActive
                                    : "text-white/60 hover:text-white hover:bg-white/10",
                                item.disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                                <span className={cn(
                                    "ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium",
                                    item.badgeColor || "bg-white/10 text-white/60"
                                )}>
                                    {item.badge}
                                </span>
                            )}
                            {item.disabled && !item.badge && (
                                <span className="ml-auto text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded">
                                    Soon
                                </span>
                            )}
                        </Link>
                    );
                })}

                <div className="pt-4">
                    <p className="px-3 text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
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
                                        ? themeClasses.sidebarActive
                                        : "text-white/60 hover:text-white hover:bg-white/10",
                                    item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                                {item.disabled && (
                                    <span className="ml-auto text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded">
                                        Soon
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="pt-2">
                    <Link
                        href="/dashboard/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                            pathname === '/dashboard/settings'
                                ? "themeClasses.sidebarActive"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <Settings className={cn("h-5 w-5", pathname === '/dashboard/settings' && "text-[var(--theme-primary)]")} />
                        <span className="font-medium">{t('common.settings')}</span>
                    </Link>

                    {/* Status - hidden on main dashboard page */}
                    {pathname !== '/dashboard' && (
                        <div className="mt-4 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                </span>
                                <span className="text-sm text-white">{t('dashboard.systemOnline')}</span>
                            </div>
                            <p className="text-xs text-white/50 mt-1 ml-4">{t('dashboard.allServicesRunning')}</p>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className={cn(
                    "absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-50",
                    themeClasses.orbPrimary
                )} />
                <div className={cn(
                    "absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[150px] opacity-50",
                    themeClasses.orbSecondary
                )} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop (always visible) */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen w-64 border-r hidden lg:block",
                themeClasses.sidebarBg,
                themeClasses.sidebarBorder
            )}>
                <SidebarContent />
            </aside>

            {/* Sidebar - Mobile (slide-in drawer) */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen w-72 border-r transform transition-transform duration-300 ease-in-out lg:hidden",
                themeClasses.sidebarBg,
                themeClasses.sidebarBorder,
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Close button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64">
                {/* Mobile Header */}
                <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-[var(--theme-primary)]" />
                            <span className="font-bold text-white">Cloudy</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <GlobalSearch />
                        </div>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between p-8 pb-4">
                    <Breadcrumbs />
                    <GlobalSearch />
                </div>

                {/* Page Content */}
                <div className="p-4 lg:p-8 lg:pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
