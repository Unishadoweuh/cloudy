'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-slate-700/30",
                className
            )}
        />
    );
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn("p-5 rounded-xl bg-slate-800/50 border border-slate-700/30", className)}>
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonStatsCard() {
    return (
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-10" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonInstanceCard() {
    return (
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <Skeleton className="h-2 w-8" />
                    <Skeleton className="h-2 w-8" />
                </div>
                <Skeleton className="h-1 w-full rounded-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-2 w-8" />
                    <Skeleton className="h-2 w-12" />
                </div>
                <Skeleton className="h-1 w-full rounded-full" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24 ml-auto" />
            </div>
        </div>
    );
}

export function SkeletonTableRow() {
    return (
        <tr className="border-t border-slate-700/30">
            <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </td>
            <td className="py-3 px-4">
                <Skeleton className="h-5 w-16 rounded-full" />
            </td>
            <td className="py-3 px-4">
                <Skeleton className="h-4 w-12" />
            </td>
            <td className="py-3 px-4">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-1 w-full rounded-full" />
                </div>
            </td>
            <td className="py-3 px-4">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-1 w-full rounded-full" />
                </div>
            </td>
            <td className="py-3 px-4">
                <Skeleton className="h-4 w-24" />
            </td>
            <td className="py-3 px-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
            </td>
        </tr>
    );
}

export function InstancesPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-10 w-36 rounded-lg" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <SkeletonStatsCard key={i} />
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-800/50">
                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-20" /></th>
                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-12" /></th>
                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-12" /></th>
                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-8" /></th>
                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                            <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                            <th className="py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <SkeletonTableRow key={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function MonitoringPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <SkeletonStatsCard key={i} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30 min-h-[300px]">
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="flex items-end justify-between h-48 gap-2">
                            {[20, 45, 30, 60, 80, 55, 40, 70, 50, 35, 65, 45].map((height, j) => (
                                <div
                                    key={j}
                                    className="flex-1 rounded-t bg-slate-700/30 animate-pulse"
                                    style={{ height: `${height}%` }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <SkeletonStatsCard key={i} />
                ))}
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-lg" />
                        ))}
                    </div>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <Skeleton className="h-5 w-40 mb-4" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
