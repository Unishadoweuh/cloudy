'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: () => resetPassword(token || '', password),
        onSuccess: () => {
            setTimeout(() => router.push('/auth'), 2000);
        },
        onError: (err: Error) => {
            setError(err.message.replace('API Error: ', ''));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        mutation.mutate();
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur">
                    <CardContent className="text-center py-8">
                        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                        <p className="text-slate-300">Token de réinitialisation manquant.</p>
                        <Link href="/auth">
                            <Button className="mt-4">Retour à la connexion</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-primary/20 rounded-2xl">
                            <Cloud className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Nouveau mot de passe
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Choisissez un nouveau mot de passe sécurisé
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {mutation.isSuccess ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                            <p className="text-slate-300 mb-2">Mot de passe réinitialisé !</p>
                            <p className="text-sm text-slate-500">Redirection vers la connexion...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Nouveau mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 bg-slate-700/50 border-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm" className="text-slate-300">Confirmer</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="confirm"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 bg-slate-700/50 border-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Réinitialiser'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
