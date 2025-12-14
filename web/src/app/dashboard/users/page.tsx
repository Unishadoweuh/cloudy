'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserRole, deleteUser, getMe } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Loader2, Shield, Trash2, UserCog } from "lucide-react";
import { useLanguage } from '@/lib/language-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EditLimitsModal } from '@/components/edit-limits-modal';

export default function UsersPage() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: currentUser, isError: isMeError } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
        retry: 1,
    });

    const { data: users = [], isLoading, isError, error } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
        enabled: !!currentUser && currentUser.role === 'ADMIN',
    });

    useEffect(() => {
        if (currentUser && currentUser.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [currentUser, router]);

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
            updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const [editingUser, setEditingUser] = useState<any | null>(null);

    if (isLoading && currentUser?.role === 'ADMIN') {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'ADMIN') {
        return (
            <div className="p-8 text-center text-slate-400">
                Access Denied. Admins only.
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400">
                Error loading users: {(error as Error).message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t('nav.users') || 'Users'}</h2>
                    <p className="text-slate-400">Manage application users and permissions</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Total Users:</span>
                    <Badge variant="secondary" className="bg-slate-800 text-cyan-400 border-slate-700">
                        {users.length}
                    </Badge>
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-400">User</TableHead>
                            <TableHead className="text-slate-400">Role</TableHead>
                            <TableHead className="text-slate-400">Joined</TableHead>
                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user: any) => (
                            <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-slate-700">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-slate-800 text-slate-400">
                                                {user.username.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-slate-200">{user.username}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                                        className={user.role === 'ADMIN'
                                            ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                            : "bg-slate-800 text-slate-400 border-slate-700"
                                        }
                                    >
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-400 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                className="cursor-pointer focus:bg-slate-800 focus:text-white group"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <UserCog className="mr-2 h-4 w-4 text-cyan-400" />
                                                Edit Limits
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-800" />
                                            <DropdownMenuItem
                                                className="cursor-pointer focus:bg-slate-800 focus:text-white group"
                                                onClick={() => updateRoleMutation.mutate({
                                                    id: user.id,
                                                    role: user.role === 'ADMIN' ? 'USER' : 'ADMIN'
                                                })}
                                                disabled={user.id === currentUser.id}
                                            >
                                                <Shield className="mr-2 h-4 w-4 text-red-400" />
                                                {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-800" />
                                            <DropdownMenuItem
                                                className="text-red-400 cursor-pointer focus:bg-red-900/20 focus:text-red-300 group"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this user?')) {
                                                        deleteUserMutation.mutate(user.id);
                                                    }
                                                }}
                                                disabled={user.id === currentUser.id}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {editingUser && (
                <EditLimitsModal
                    user={editingUser}
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                />
            )}
        </div>
    );
}


