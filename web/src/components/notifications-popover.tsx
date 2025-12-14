'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification
} from '@/lib/api';
import type { AppNotification } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function NotificationsPopover() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // Fetch notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        // Poll every minute
        refetchInterval: 60000,
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: markNotificationRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markReadMutation.mutate(id);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteMutation.mutate(id);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
            default: return <Info className="h-4 w-4 text-cyan-400" />;
        }
    };

    const getTypeBgColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10';
            case 'warning': return 'bg-amber-500/10';
            case 'error': return 'bg-red-500/10';
            default: return 'bg-cyan-500/10';
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer w-full">
                    <div className="relative">
                        <Bell className={cn("h-5 w-5", isOpen && "text-cyan-400")} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-slate-900" />
                        )}
                    </div>
                    <span className="font-medium">{t('common.notifications') || 'Notifications'}</span>
                    {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center bg-cyan-400 text-slate-900 text-[10px] font-bold rounded-full px-1">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-96 bg-slate-900 border-slate-800 text-slate-200" side="right">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-cyan-400 hover:text-cyan-300"
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            Tout marquer lu
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            Aucune notification
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-default focus:bg-slate-800",
                                    !notification.read && "bg-slate-800/30"
                                )}
                            >
                                <div className="flex items-start justify-between w-full gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-1.5 rounded-lg", getTypeBgColor(notification.type))}>
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="font-medium text-sm text-slate-200">
                                            {notification.title}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-cyan-400"
                                                onClick={(e) => handleMarkRead(notification.id, e)}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-red-400"
                                            onClick={(e) => handleDelete(notification.id, e)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 leading-relaxed pl-9">
                                    {notification.message}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 pl-9">
                                    {formatDateTime(notification.createdAt)}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
