'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuthConfig, login, register } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cp.unishadow.ovh';

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

    // Check for error in URL
    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError === 'discord_disabled') {
            setError('La connexion Discord est désactivée par l\'administrateur.');
        }
    }, [searchParams]);

    // Get auth config
    const { data: authConfig, isLoading: configLoading } = useQuery({
        queryKey: ['authConfig'],
        queryFn: getAuthConfig,
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: () => login(loginEmail, loginPassword),
        onSuccess: (data) => {
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
            if (data.user.mustChangePassword) {
                router.push('/auth/change-password');
            } else {
                router.push('/dashboard');
            }
        },
        onError: (err: Error) => {
            setError(err.message.replace('API Error: ', ''));
        },
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: () => register(registerUsername, registerEmail, registerPassword),
        onSuccess: (data) => {
            setSuccess(data.message);
            setActiveTab('login');
            setRegisterUsername('');
            setRegisterEmail('');
            setRegisterPassword('');
            setRegisterConfirmPassword('');
        },
        onError: (err: Error) => {
            setError(err.message.replace('API Error: ', ''));
        },
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        loginMutation.mutate();
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (registerPassword !== registerConfirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (registerPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        registerMutation.mutate();
    };

    const handleDiscordLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/discord`;
    };

    if (configLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    <CardTitle className="text-2xl font-bold text-white">Cloudy</CardTitle>
                    <CardDescription className="text-slate-400">
                        Connectez-vous pour accéder à votre infrastructure
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Alerts */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Discord Login */}
                    {authConfig?.enableDiscordAuth && (
                        <>
                            <Button
                                onClick={handleDiscordLogin}
                                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white gap-2"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                Continuer avec Discord
                            </Button>

                            {authConfig?.enableLocalAuth && (
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-700" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-slate-800 px-2 text-slate-500">ou</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Email/Password Forms */}
                    {authConfig?.enableLocalAuth && (
                        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'register'); setError(null); }}>
                            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                                <TabsTrigger value="login">Connexion</TabsTrigger>
                                <TabsTrigger value="register">Inscription</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login" className="space-y-4 mt-4">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="login-email"
                                                type="email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="votre@email.com"
                                                className="pl-10 bg-slate-700/50 border-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="login-password" className="text-slate-300">Mot de passe</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="login-password"
                                                type="password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pl-10 bg-slate-700/50 border-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/90"
                                        disabled={loginMutation.isPending}
                                    >
                                        {loginMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Se connecter'
                                        )}
                                    </Button>

                                    <div className="text-center">
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="register" className="space-y-4 mt-4">
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="register-username" className="text-slate-300">Nom d&apos;utilisateur</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="register-username"
                                                type="text"
                                                value={registerUsername}
                                                onChange={(e) => setRegisterUsername(e.target.value)}
                                                placeholder="johndoe"
                                                className="pl-10 bg-slate-700/50 border-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="register-email" className="text-slate-300">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="register-email"
                                                type="email"
                                                value={registerEmail}
                                                onChange={(e) => setRegisterEmail(e.target.value)}
                                                placeholder="votre@email.com"
                                                className="pl-10 bg-slate-700/50 border-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="register-password" className="text-slate-300">Mot de passe</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="register-password"
                                                type="password"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pl-10 bg-slate-700/50 border-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="register-confirm" className="text-slate-300">Confirmer le mot de passe</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="register-confirm"
                                                type="password"
                                                value={registerConfirmPassword}
                                                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pl-10 bg-slate-700/50 border-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/90"
                                        disabled={registerMutation.isPending}
                                    >
                                        {registerMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "S'inscrire"
                                        )}
                                    </Button>

                                    {authConfig?.requireEmailVerification && (
                                        <p className="text-xs text-slate-500 text-center">
                                            Un email de vérification sera envoyé à votre adresse.
                                        </p>
                                    )}
                                </form>
                            </TabsContent>
                        </Tabs>
                    )}

                    {/* No auth methods configured */}
                    {!authConfig?.enableLocalAuth && !authConfig?.enableDiscordAuth && (
                        <div className="text-center text-slate-400 py-8">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                            <p>Aucune méthode de connexion n&apos;est configurée.</p>
                            <p className="text-sm mt-2">Contactez l&apos;administrateur.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}

