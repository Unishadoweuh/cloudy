'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllBalances, addCredits, getMe } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Wallet,
    Users,
    Plus,
    Minus,
    Search,
    Euro,
    RefreshCw,
    Shield,
    User,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}

export default function AdminBillingPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditDescription, setCreditDescription] = useState('');
    const [isDeducting, setIsDeducting] = useState(false);

    // Check if user is admin
    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });

    const { data: balances, isLoading, refetch } = useQuery({
        queryKey: ['admin-balances'],
        queryFn: getAllBalances,
        enabled: currentUser?.role === 'ADMIN',
    });

    const creditMutation = useMutation({
        mutationFn: ({ userId, amount, description }: { userId: string; amount: number; description?: string }) =>
            addCredits(userId, amount, description),
        onSuccess: (data) => {
            toast.success(
                isDeducting ? 'Crédits retirés' : 'Crédits ajoutés',
                `Nouveau solde: ${formatCurrency(data.balance)}`
            );
            queryClient.invalidateQueries({ queryKey: ['admin-balances'] });
            setSelectedUserId(null);
            setCreditAmount('');
            setCreditDescription('');
            setIsDeducting(false);
        },
        onError: (error: Error) => {
            toast.error('Erreur', error.message);
        },
    });

    const handleCreditAction = () => {
        if (!selectedUserId || !creditAmount) return;
        const amount = parseFloat(creditAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Erreur', 'Montant invalide');
            return;
        }

        // For deduction, we send negative amount (the backend API needs to support this)
        // Alternatively, we can send positive and add a "deduct" flag
        creditMutation.mutate({
            userId: selectedUserId,
            amount: isDeducting ? -amount : amount,
            description: creditDescription || (isDeducting ? 'Retrait de crédits' : 'Ajout de crédits'),
        });
    };

    // Filter users by search term
    const filteredBalances = balances?.filter((b) =>
        b.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const selectedUser = balances?.find((b) => b.userId === selectedUserId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Shield className="h-8 w-8 text-red-400" />
                        Gestion des Crédits
                    </h1>
                    <p className="text-slate-400 mt-1">Allouez ou retirez des crédits aux utilisateurs</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-500/20">
                                <Users className="h-6 w-6 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Utilisateurs</p>
                                <p className="text-2xl font-bold">{balances?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/20">
                                <Euro className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Total Crédits</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(balances?.reduce((sum, b) => sum + b.balance, 0) || 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-500/20">
                                <Wallet className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Solde moyen</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        balances?.length
                                            ? balances.reduce((sum, b) => sum + b.balance, 0) / balances.length
                                            : 0
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User List */}
                <Card className="bg-slate-800/50 border-slate-700/50 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Utilisateurs
                        </CardTitle>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher un utilisateur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-700"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">Chargement...</div>
                        ) : filteredBalances?.length ? (
                            filteredBalances.map((item) => (
                                <div
                                    key={item.userId}
                                    onClick={() => setSelectedUserId(item.userId)}
                                    className={cn(
                                        'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all',
                                        selectedUserId === item.userId
                                            ? 'bg-cyan-500/10 border-cyan-500/30'
                                            : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-slate-700/50">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{item.user.username}</p>
                                                {item.user.role === 'ADMIN' && (
                                                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{item.user.email || 'Pas d\'email'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            'text-lg font-semibold',
                                            item.balance > 50 ? 'text-emerald-400' :
                                                item.balance > 10 ? 'text-amber-400' :
                                                    'text-red-400'
                                        )}>
                                            {formatCurrency(item.balance)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                Aucun utilisateur trouvé
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Credit Panel */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Euro className="h-5 w-5 text-cyan-400" />
                            Gérer les Crédits
                        </CardTitle>
                        <CardDescription>
                            Sélectionnez un utilisateur dans la liste
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedUser ? (
                            <>
                                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                                    <p className="text-sm text-slate-400">Utilisateur</p>
                                    <p className="font-semibold">{selectedUser.user.username}</p>
                                    <p className={cn(
                                        "text-lg font-bold mt-1",
                                        selectedUser.balance > 50 ? 'text-emerald-400' :
                                            selectedUser.balance > 10 ? 'text-amber-400' :
                                                'text-red-400'
                                    )}>
                                        Solde: {formatCurrency(selectedUser.balance)}
                                    </p>
                                </div>

                                {/* Add/Remove Toggle */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={!isDeducting ? "default" : "outline"}
                                        onClick={() => setIsDeducting(false)}
                                        className={cn(
                                            'gap-2',
                                            !isDeducting && 'bg-emerald-600 hover:bg-emerald-700'
                                        )}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ajouter
                                    </Button>
                                    <Button
                                        variant={isDeducting ? "default" : "outline"}
                                        onClick={() => setIsDeducting(true)}
                                        className={cn(
                                            'gap-2',
                                            isDeducting && 'bg-red-600 hover:bg-red-700'
                                        )}
                                    >
                                        <Minus className="h-4 w-4" />
                                        Retirer
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Montant (€)</label>
                                    <Input
                                        type="number"
                                        placeholder="50.00"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        className="bg-slate-900/50 border-slate-700"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Description (optionnel)</label>
                                    <Input
                                        placeholder={isDeducting ? "Raison du retrait" : "Recharge mensuelle"}
                                        value={creditDescription}
                                        onChange={(e) => setCreditDescription(e.target.value)}
                                        className="bg-slate-900/50 border-slate-700"
                                    />
                                </div>

                                {/* Quick amounts */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[10, 25, 50, 100].map((amount) => (
                                        <Button
                                            key={amount}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCreditAmount(String(amount))}
                                            className="text-xs"
                                        >
                                            €{amount}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    onClick={handleCreditAction}
                                    disabled={!creditAmount || creditMutation.isPending}
                                    className={cn(
                                        'w-full',
                                        isDeducting
                                            ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                                    )}
                                >
                                    {creditMutation.isPending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    ) : isDeducting ? (
                                        <ArrowDownRight className="h-4 w-4 mr-2" />
                                    ) : (
                                        <ArrowUpRight className="h-4 w-4 mr-2" />
                                    )}
                                    {isDeducting ? 'Retirer' : 'Ajouter'} {creditAmount ? formatCurrency(parseFloat(creditAmount) || 0) : ''}
                                </Button>

                                {isDeducting && selectedUser.balance < parseFloat(creditAmount || '0') && (
                                    <p className="text-xs text-red-400 text-center">
                                        ⚠️ Le solde sera négatif après cette opération
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Sélectionnez un utilisateur pour gérer ses crédits</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
