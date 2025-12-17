'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href: string;
    current?: boolean;
}

const pathLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'instances': 'Instances',
    'new': 'Nouvelle instance',
    'monitoring': 'Monitoring',
    'volumes': 'Volumes',
    'networks': 'Réseaux',
    'security': 'Sécurité',
    'backups': 'Sauvegardes',
    'settings': 'Paramètres',
    'users': 'Utilisateurs',
};

export function Breadcrumbs() {
    const pathname = usePathname();

    if (!pathname || pathname === '/dashboard') {
        return null;
    }

    const segments = pathname.split('/').filter(Boolean);

    const items: BreadcrumbItem[] = segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;

        // Check if this is a dynamic segment (like an ID)
        const isId = /^\d+$/.test(segment);

        let label = pathLabels[segment] || segment;
        if (isId) {
            label = `#${segment}`;
        }

        return {
            label,
            href,
            current: isLast,
        };
    });

    return (
        <nav className="flex items-center gap-1 text-sm mb-4" aria-label="Breadcrumb">
            <Link
                href="/dashboard"
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>

            {items.slice(1).map((item, index) => (
                <div key={item.href} className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                    {item.current ? (
                        <span className="text-slate-300 font-medium">{item.label}</span>
                    ) : (
                        <Link
                            href={item.href}
                            className={cn(
                                "text-slate-500 hover:text-slate-300 transition-colors",
                                "hover:underline underline-offset-2"
                            )}
                        >
                            {item.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
