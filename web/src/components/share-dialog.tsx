'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    shareInstance,
    getInstanceShares,
    revokeShare,
    searchUsersForSharing,
    type SharePermission,
    type InstanceShare,
    type ShareUser
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Share2,
    Trash2,
    Search,
    User,
    Eye,
    Monitor,
    Power,
    Camera,
    Crown,
    Loader2,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vmid: number;
    node: string;
    vmType: string;
    vmName: string;
}

const PERMISSION_OPTIONS: { value: SharePermission; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'READONLY', label: 'Lecture seule', icon: Eye, description: 'Voir le statut et les métriques' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: Power, description: 'Console + Démarrer/Arrêter' },
    { value: 'ADMIN', label: 'Administrateur', icon: Crown, description: 'Toutes les permissions sauf suppression' },
];

function getPermissionBadgeColor(permission: SharePermission): string {
    switch (permission) {
        case 'READONLY': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        case 'MAINTENANCE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'ADMIN': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}

export function ShareDialog({ open, onOpenChange, vmid, node, vmType, vmName }: ShareDialogProps) {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [permission, setPermission] = useState<SharePermission>('READONLY');
    const [selectedUser, setSelectedUser] = useState<ShareUser | null>(null);
    const [expiresAt, setExpiresAt] = useState('');

    // Fetch existing shares
    const { data: shares = [], isLoading: loadingShares } = useQuery({
        queryKey: ['instance-shares', vmid, node],
        queryFn: () => getInstanceShares(vmid, node),
        enabled: open,
    });

    // Search users
    const { data: searchResults = [], isLoading: searching } = useQuery({
        queryKey: ['search-users', searchQuery],
        queryFn: () => searchUsersForSharing(searchQuery),
        enabled: searchQuery.length >= 2,
    });

    // Share mutation
    const shareMutation = useMutation({
        mutationFn: () => shareInstance(
            vmid,
            node,
            vmType,
            vmName,
            selectedUser?.email || email,
            permission,
            expiresAt || undefined
        ),
        onSuccess: () => {
            toast({
                title: 'Instance Shared',
                description: `Successfully shared ${vmName} with ${selectedUser?.username || email}`,
            });
            queryClient.invalidateQueries({ queryKey: ['instance-shares', vmid, node] });
            setEmail('');
            setSelectedUser(null);
            setSearchQuery('');
            setExpiresAt('');
        },
        onError: (error: Error) => {
            toast({
                title: 'Share Failed',
                description: error.message,
                variant: 'error',
            });
        },
    });

    // Revoke mutation
    const revokeMutation = useMutation({
        mutationFn: (shareId: string) => revokeShare(shareId),
        onSuccess: () => {
            toast({
                title: 'Share Revoked',
                description: 'Access has been removed',
            });
            queryClient.invalidateQueries({ queryKey: ['instance-shares', vmid, node] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Revoke Failed',
                description: error.message,
                variant: 'error',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser || email) {
            shareMutation.mutate();
        }
    };

    const handleSelectUser = (user: ShareUser) => {
        setSelectedUser(user);
        setEmail(user.email || '');
        setSearchQuery('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Share2 className="h-5 w-5 text-primary" />
                        Share Instance
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Share "{vmName}" with other users. They will be able to access this instance based on the permissions you grant.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User search/input */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Share with</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search users by email or username..."
                                value={selectedUser ? selectedUser.email || selectedUser.username : searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedUser(null);
                                    setEmail(e.target.value);
                                }}
                                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                            />

                            {/* Search results dropdown */}
                            {searchQuery.length >= 2 && searchResults.length > 0 && !selectedUser && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-48 overflow-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => handleSelectUser(user)}
                                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                                                ) : (
                                                    <User className="h-4 w-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user.username}</p>
                                                {user.email && (
                                                    <p className="text-xs text-slate-400">{user.email}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Permission selector */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Permission Level</Label>
                        <Select value={permission} onValueChange={(v) => setPermission(v as SharePermission)}>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {PERMISSION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-slate-700">
                                        <div className="flex items-center gap-2">
                                            <opt.icon className="h-4 w-4" />
                                            <span>{opt.label}</span>
                                            <span className="text-slate-500 text-xs">- {opt.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Optional expiration */}
                    <div className="space-y-2">
                        <Label className="text-slate-300 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Expiration (optional)
                        </Label>
                        <Input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="bg-slate-800/50 border-slate-700 text-white"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={shareMutation.isPending || (!selectedUser && !email)}
                    >
                        {shareMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sharing...
                            </>
                        ) : (
                            <>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Instance
                            </>
                        )}
                    </Button>
                </form>

                {/* Existing shares */}
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4" />
                        Currently Shared With
                    </h4>

                    {loadingShares ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                        </div>
                    ) : shares.length === 0 ? (
                        <p className="text-center py-4 text-slate-500 text-sm">
                            This instance hasn't been shared with anyone yet.
                        </p>
                    ) : (
                        <div className="max-h-48 overflow-auto">
                            <div className="space-y-2">
                                {shares.map((share) => (
                                    <div
                                        key={share.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                                                {share.sharedWith?.avatar ? (
                                                    <img src={share.sharedWith.avatar} alt="" className="h-8 w-8 rounded-full" />
                                                ) : (
                                                    <User className="h-4 w-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {share.sharedWith?.username || 'Unknown User'}
                                                </p>
                                                {share.sharedWith?.email && (
                                                    <p className="text-xs text-slate-400">{share.sharedWith.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn('text-xs', getPermissionBadgeColor(share.permission))}>
                                                {share.permission}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => revokeMutation.mutate(share.id)}
                                                disabled={revokeMutation.isPending}
                                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                {revokeMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
