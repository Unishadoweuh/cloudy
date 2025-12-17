'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getInstances } from '@/lib/api';
import type { Instance } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    Server,
    Box,
    Activity,
    Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
    type: 'instance' | 'page' | 'action';
    title: string;
    subtitle?: string;
    href?: string;
    action?: () => void;
    icon: React.ElementType;
    status?: 'running' | 'stopped';
}

const staticPages: SearchResult[] = [
    { type: 'page', title: 'Dashboard', href: '/dashboard', icon: Activity },
    { type: 'page', title: 'Instances', href: '/dashboard/instances', icon: Server },
    { type: 'page', title: 'Nouvelle instance', href: '/dashboard/instances/new', icon: Server },
    { type: 'page', title: 'Monitoring', href: '/dashboard/monitoring', icon: Activity },
    { type: 'page', title: 'Volumes', href: '/dashboard/volumes', icon: Box },
    { type: 'page', title: 'Réseaux', href: '/dashboard/networks', icon: Activity },
    { type: 'page', title: 'Sécurité', href: '/dashboard/security', icon: Activity },
    { type: 'page', title: 'Sauvegardes', href: '/dashboard/backups', icon: Box },
    { type: 'page', title: 'Paramètres', href: '/dashboard/settings', icon: Activity },
];

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Fetch instances for search
    const { data: instances } = useQuery({
        queryKey: ['instances'],
        queryFn: () => getInstances(),
        enabled: open,
    });

    // Filter and combine results
    const results: SearchResult[] = useCallback(() => {
        if (!query.trim()) {
            return staticPages.slice(0, 5);
        }

        const lowerQuery = query.toLowerCase();
        const matchedPages = staticPages.filter(
            page => page.title.toLowerCase().includes(lowerQuery)
        );

        const matchedInstances: SearchResult[] = (instances || [])
            .filter((i: Instance) =>
                i.name?.toLowerCase().includes(lowerQuery) ||
                i.vmid?.toString().includes(lowerQuery)
            )
            .slice(0, 5)
            .map((i: Instance) => ({
                type: 'instance' as const,
                title: i.name || `Instance ${i.vmid}`,
                subtitle: `${i.type.toUpperCase()} · ${i.node} · ID: ${i.vmid}`,
                href: `/dashboard/instances/${i.vmid}`,
                icon: i.type === 'qemu' ? Server : Box,
                status: i.status as 'running' | 'stopped',
            }));

        return [...matchedInstances, ...matchedPages].slice(0, 8);
    }, [query, instances])();

    // Keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, results.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            }
            if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                const result = results[selectedIndex];
                if (result.href) {
                    router.push(result.href);
                    setOpen(false);
                    setQuery('');
                } else if (result.action) {
                    result.action();
                    setOpen(false);
                    setQuery('');
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, results, selectedIndex, router]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input when dialog opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    return (
        <>
            {/* Search trigger button */}
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-slate-400 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:text-white"
            >
                <Search className="h-4 w-4" />
                <span>Recherche...</span>
                <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-700 px-1.5 font-mono text-[10px] font-medium text-slate-300">
                    <Command className="h-3 w-3" />K
                </kbd>
            </Button>

            {/* Search dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="glass-strong border-slate-700 p-0 max-w-lg overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Recherche globale</DialogTitle>
                    </DialogHeader>

                    {/* Search input */}
                    <div className="flex items-center border-b border-slate-700 px-4">
                        <Search className="h-4 w-4 text-slate-400 mr-2" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher instances, pages..."
                            className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-slate-500 py-4"
                        />
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-700 px-1.5 font-mono text-[10px] font-medium text-slate-300">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto py-2">
                        {results.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500">
                                Aucun résultat pour &quot;{query}&quot;
                            </div>
                        ) : (
                            results.map((result, index) => {
                                const Icon = result.icon;
                                return (
                                    <button
                                        key={`${result.type}-${result.title}-${index}`}
                                        onClick={() => {
                                            if (result.href) {
                                                router.push(result.href);
                                            } else if (result.action) {
                                                result.action();
                                            }
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                            selectedIndex === index
                                                ? "bg-slate-700/50"
                                                : "hover:bg-slate-700/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            result.type === 'instance'
                                                ? "bg-cyan-500/20 text-cyan-400"
                                                : "bg-slate-600/50 text-slate-400"
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium truncate">
                                                    {result.title}
                                                </span>
                                                {result.status && (
                                                    <span className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        result.status === 'running' ? "bg-emerald-400" : "bg-slate-500"
                                                    )} />
                                                )}
                                            </div>
                                            {result.subtitle && (
                                                <span className="text-xs text-slate-500 truncate block">
                                                    {result.subtitle}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 capitalize">
                                            {result.type === 'instance' ? 'Instance' : 'Page'}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-700 px-4 py-2 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600">↑</kbd>
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600">↓</kbd>
                            pour naviguer
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600">↵</kbd>
                            pour sélectionner
                        </span>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
