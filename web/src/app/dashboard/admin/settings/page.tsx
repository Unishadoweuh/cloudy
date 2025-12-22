'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, getAppConfig, updateAppConfig } from '@/lib/api';
import type { AppConfigFull } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Shield,
    Mail,
    Save,
    Loader2,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Key,
    Server,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Check if user is admin
    const { data: currentUser, isLoading: userLoading } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });

    const { data: config, isLoading: configLoading } = useQuery({
        queryKey: ['appConfig'],
        queryFn: getAppConfig,
        enabled: currentUser?.role === 'ADMIN',
    });

    // Form state
    const [formData, setFormData] = useState<Partial<AppConfigFull> | null>(null);

    // Initialize form when config loads
    if (config && !formData) {
        setFormData({
            enableLocalAuth: config.enableLocalAuth,
            enableDiscordAuth: config.enableDiscordAuth,
            requireEmailVerification: config.requireEmailVerification,
            smtpHost: config.smtpHost || '',
            smtpPort: config.smtpPort || 587,
            smtpSecure: config.smtpSecure || false,
            smtpUser: config.smtpUser || '',
            smtpPassword: '',
            mailFrom: config.mailFrom || '',
        });
    }

    const updateMutation = useMutation({
        mutationFn: (data: Partial<AppConfigFull>) => updateAppConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appConfig'] });
            queryClient.invalidateQueries({ queryKey: ['authConfig'] });
            setSaveSuccess(true);
            setSaveError(null);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
        onError: (err: Error) => {
            setSaveError(err.message.replace('API Error: ', ''));
            setSaveSuccess(false);
        },
    });

    const handleSave = () => {
        if (!formData) return;

        // Only send password if changed (not empty and not the masked value)
        const data = { ...formData };
        if (!data.smtpPassword || data.smtpPassword === '********') {
            delete data.smtpPassword;
        }

        updateMutation.mutate(data);
    };

    if (userLoading || configLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (currentUser?.role !== 'ADMIN') {
        router.push('/dashboard');
        return null;
    }

    if (!formData) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin">
                        <Button variant="ghost" size="icon" className="border border-slate-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Paramètres Application</h1>
                        <p className="text-slate-500 text-sm">Configurez l&apos;authentification et les services de mail</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90 gap-2"
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Enregistrer
                </Button>
            </div>

            {/* Alerts */}
            {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Paramètres enregistrés avec succès
                </div>
            )}

            {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {saveError}
                </div>
            )}

            <Tabs defaultValue="auth" className="w-full">
                <TabsList className="bg-slate-800/50 border border-slate-700">
                    <TabsTrigger value="auth" className="data-[state=active]:bg-primary/20 gap-2">
                        <Shield className="h-4 w-4" />
                        Authentification
                    </TabsTrigger>
                    <TabsTrigger value="mail" className="data-[state=active]:bg-primary/20 gap-2">
                        <Mail className="h-4 w-4" />
                        Serveur Mail
                    </TabsTrigger>
                </TabsList>

                {/* Auth Tab */}
                <TabsContent value="auth" className="mt-6 space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" />
                                Méthodes de connexion
                            </CardTitle>
                            <CardDescription>
                                Activez ou désactivez les différentes façons de se connecter
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Local Auth */}
                            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Mail className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Connexion Email/Mot de passe</p>
                                        <p className="text-sm text-slate-400">
                                            Permet aux utilisateurs de créer un compte avec email
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enableLocalAuth}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, enableLocalAuth: checked })
                                    }
                                />
                            </div>

                            {/* Discord Auth */}
                            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-[#5865F2]/20 rounded-lg">
                                        <svg className="h-5 w-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Connexion Discord</p>
                                        <p className="text-sm text-slate-400">
                                            OAuth2 via Discord (nécessite config dans .env)
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enableDiscordAuth}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, enableDiscordAuth: checked })
                                    }
                                />
                            </div>

                            {/* Email Verification */}
                            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Vérification Email obligatoire</p>
                                        <p className="text-sm text-slate-400">
                                            Les utilisateurs doivent vérifier leur email avant de se connecter
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.requireEmailVerification}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, requireEmailVerification: checked })
                                    }
                                    disabled={!formData.enableLocalAuth}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Mail Tab */}
                <TabsContent value="mail" className="mt-6 space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5 text-primary" />
                                Configuration SMTP
                            </CardTitle>
                            <CardDescription>
                                Configurez le serveur mail pour l&apos;envoi des emails de vérification
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Serveur SMTP</Label>
                                    <Input
                                        value={formData.smtpHost || ''}
                                        onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                        placeholder="smtp.example.com"
                                        className="bg-slate-700/50 border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Port</Label>
                                    <Input
                                        type="number"
                                        value={formData.smtpPort || 587}
                                        onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                                        placeholder="587"
                                        className="bg-slate-700/50 border-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Utilisateur SMTP</Label>
                                    <Input
                                        value={formData.smtpUser || ''}
                                        onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                                        placeholder="user@example.com"
                                        className="bg-slate-700/50 border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Mot de passe SMTP</Label>
                                    <Input
                                        type="password"
                                        value={formData.smtpPassword || ''}
                                        onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="bg-slate-700/50 border-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Adresse expéditeur (From)</Label>
                                <Input
                                    value={formData.mailFrom || ''}
                                    onChange={(e) => setFormData({ ...formData, mailFrom: e.target.value })}
                                    placeholder="noreply@example.com"
                                    className="bg-slate-700/50 border-slate-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div>
                                    <p className="font-medium text-white">Connexion sécurisée (TLS/SSL)</p>
                                    <p className="text-sm text-slate-400">Utiliser le port 465 avec SSL direct</p>
                                </div>
                                <Switch
                                    checked={formData.smtpSecure}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, smtpSecure: checked })
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
