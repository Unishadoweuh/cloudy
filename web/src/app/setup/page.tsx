'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Zap,
    Server,
    Link as LinkIcon,
    Shield,
    Archive,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface StepProps {
    onNext: () => void;
    onBack?: () => void;
    data: SetupData;
    setData: (data: SetupData) => void;
}

interface SetupData {
    // Proxmox
    pveHost: string;
    pveTokenId: string;
    pveTokenSecret: string;
    proxmoxTested: boolean;
    // URLs
    frontendUrl: string;
    apiUrl: string;
    // PBS
    pbsEnabled: boolean;
    pbsHost: string;
    pbsTokenId: string;
    pbsTokenSecret: string;
    // Auth
    enableLocalAuth: boolean;
    enableDiscordAuth: boolean;
    discordClientId: string;
    discordClientSecret: string;
    discordCallbackUrl: string;
    // Billing
    billingEnabled: boolean;
}

const defaultData: SetupData = {
    pveHost: '',
    pveTokenId: '',
    pveTokenSecret: '',
    proxmoxTested: false,
    frontendUrl: typeof window !== 'undefined' ? window.location.origin : '',
    apiUrl: API_URL,
    pbsEnabled: false,
    pbsHost: '',
    pbsTokenId: '',
    pbsTokenSecret: '',
    enableLocalAuth: true,
    enableDiscordAuth: false,
    discordClientId: '',
    discordClientSecret: '',
    discordCallbackUrl: '',
    billingEnabled: false,
};

// Step 1: Welcome
function WelcomeStep({ onNext }: StepProps) {
    return (
        <div className="text-center space-y-6">
            <div className="mx-auto p-4 bg-cyan-500/20 rounded-2xl w-fit">
                <Zap className="h-12 w-12 text-cyan-400" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Bienvenue sur Cloudy</h1>
                <p className="text-slate-400 max-w-md mx-auto">
                    Configurons votre tableau de bord Proxmox en quelques étapes simples.
                </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-slate-300 mb-2">Vous allez configurer :</p>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>✓ Connexion à votre serveur Proxmox</li>
                    <li>✓ URLs de l'application</li>
                    <li>✓ Méthodes d'authentification</li>
                    <li>✓ Options avancées (PBS, Facturation)</li>
                </ul>
            </div>
            <Button onClick={onNext} size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                Commencer la configuration
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}

// Step 2: Proxmox Configuration
function ProxmoxStep({ onNext, onBack, data, setData }: StepProps) {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`${API_URL}/config/test-proxmox`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: data.pveHost,
                    tokenId: data.pveTokenId,
                    tokenSecret: data.pveTokenSecret,
                }),
            });
            const result = await res.json();
            setTestResult(result);
            if (result.success) {
                setData({ ...data, proxmoxTested: true });
            }
        } catch (error) {
            setTestResult({ success: false, message: 'Erreur de connexion au serveur' });
        } finally {
            setTesting(false);
        }
    };

    const canProceed = data.pveHost && data.pveTokenId && data.pveTokenSecret && data.proxmoxTested;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Server className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">Configuration Proxmox</h2>
                    <p className="text-sm text-slate-400">Connectez votre serveur Proxmox VE</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-slate-300">URL du serveur Proxmox</Label>
                    <Input
                        value={data.pveHost}
                        onChange={(e) => setData({ ...data, pveHost: e.target.value, proxmoxTested: false })}
                        placeholder="https://pve.example.com:8006"
                        className="bg-slate-800/50 border-slate-700"
                    />
                    <p className="text-xs text-slate-500">L'URL complète avec le port (généralement 8006)</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-300">Token ID</Label>
                    <Input
                        value={data.pveTokenId}
                        onChange={(e) => setData({ ...data, pveTokenId: e.target.value, proxmoxTested: false })}
                        placeholder="user@pam!token-name"
                        className="bg-slate-800/50 border-slate-700"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-300">Token Secret</Label>
                    <Input
                        type="password"
                        value={data.pveTokenSecret}
                        onChange={(e) => setData({ ...data, pveTokenSecret: e.target.value, proxmoxTested: false })}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="bg-slate-800/50 border-slate-700"
                    />
                </div>

                <Button
                    onClick={testConnection}
                    disabled={testing || !data.pveHost || !data.pveTokenId || !data.pveTokenSecret}
                    variant="outline"
                    className="w-full border-slate-600"
                >
                    {testing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Test en cours...
                        </>
                    ) : (
                        'Tester la connexion'
                    )}
                </Button>

                {testResult && (
                    <Alert className={testResult.success ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
                        {testResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <AlertDescription className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                            {testResult.message}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="ghost" className="text-slate-400">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Button onClick={onNext} disabled={!canProceed} className="bg-cyan-600 hover:bg-cyan-700">
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Step 3: URLs Configuration
function UrlsStep({ onNext, onBack, data, setData }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">URLs de l'application</h2>
                    <p className="text-sm text-slate-400">Configurez les URLs pour votre déploiement</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-slate-300">URL du Frontend</Label>
                    <Input
                        value={data.frontendUrl}
                        onChange={(e) => setData({ ...data, frontendUrl: e.target.value })}
                        placeholder="https://cloudy.example.com"
                        className="bg-slate-800/50 border-slate-700"
                    />
                    <p className="text-xs text-slate-500">L'URL où les utilisateurs accèdent à l'application</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-300">URL de l'API</Label>
                    <Input
                        value={data.apiUrl}
                        onChange={(e) => setData({ ...data, apiUrl: e.target.value })}
                        placeholder="https://api.cloudy.example.com"
                        className="bg-slate-800/50 border-slate-700"
                    />
                    <p className="text-xs text-slate-500">L'URL du serveur backend API</p>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="ghost" className="text-slate-400">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Button onClick={onNext} className="bg-cyan-600 hover:bg-cyan-700">
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Step 4: Authentication
function AuthStep({ onNext, onBack, data, setData }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">Authentification</h2>
                    <p className="text-sm text-slate-400">Choisissez les méthodes de connexion</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Local Auth */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Shield className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Email / Mot de passe</p>
                            <p className="text-xs text-slate-400">Authentification locale classique</p>
                        </div>
                    </div>
                    <Switch
                        checked={data.enableLocalAuth}
                        onCheckedChange={(checked) => setData({ ...data, enableLocalAuth: checked })}
                    />
                </div>

                {/* Discord Auth */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#5865F2]/20 rounded-lg">
                                <svg className="h-4 w-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-white">Discord OAuth</p>
                                <p className="text-xs text-slate-400">Connexion via Discord</p>
                            </div>
                        </div>
                        <Switch
                            checked={data.enableDiscordAuth}
                            onCheckedChange={(checked) => setData({ ...data, enableDiscordAuth: checked })}
                        />
                    </div>

                    {data.enableDiscordAuth && (
                        <div className="ml-4 pl-4 border-l-2 border-[#5865F2]/30 space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-300">Client ID</Label>
                                <Input
                                    value={data.discordClientId}
                                    onChange={(e) => setData({ ...data, discordClientId: e.target.value })}
                                    placeholder="123456789012345678"
                                    className="bg-slate-800/50 border-slate-700 h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-300">Client Secret</Label>
                                <Input
                                    type="password"
                                    value={data.discordClientSecret}
                                    onChange={(e) => setData({ ...data, discordClientSecret: e.target.value })}
                                    placeholder="••••••••"
                                    className="bg-slate-800/50 border-slate-700 h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-300">Callback URL</Label>
                                <Input
                                    value={data.discordCallbackUrl || `${data.frontendUrl}/auth/discord/callback`}
                                    onChange={(e) => setData({ ...data, discordCallbackUrl: e.target.value })}
                                    className="bg-slate-800/50 border-slate-700 h-9"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="ghost" className="text-slate-400">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Button onClick={onNext} disabled={!data.enableLocalAuth && !data.enableDiscordAuth} className="bg-cyan-600 hover:bg-cyan-700">
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Step 5: Options (PBS, Billing)
function OptionsStep({ onNext, onBack, data, setData }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Archive className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">Options avancées</h2>
                    <p className="text-sm text-slate-400">Fonctionnalités optionnelles</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* PBS */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/20 rounded-lg">
                                <Archive className="h-4 w-4 text-teal-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Proxmox Backup Server</p>
                                <p className="text-xs text-slate-400">Intégration avec PBS pour les sauvegardes</p>
                            </div>
                        </div>
                        <Switch
                            checked={data.pbsEnabled}
                            onCheckedChange={(checked) => setData({ ...data, pbsEnabled: checked })}
                        />
                    </div>

                    {data.pbsEnabled && (
                        <div className="ml-4 pl-4 border-l-2 border-teal-500/30 space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-300">URL PBS</Label>
                                <Input
                                    value={data.pbsHost}
                                    onChange={(e) => setData({ ...data, pbsHost: e.target.value })}
                                    placeholder="https://pbs.example.com:8007"
                                    className="bg-slate-800/50 border-slate-700 h-9"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-300">Token ID</Label>
                                    <Input
                                        value={data.pbsTokenId}
                                        onChange={(e) => setData({ ...data, pbsTokenId: e.target.value })}
                                        placeholder="user@pbs!token"
                                        className="bg-slate-800/50 border-slate-700 h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-300">Token Secret</Label>
                                    <Input
                                        type="password"
                                        value={data.pbsTokenSecret}
                                        onChange={(e) => setData({ ...data, pbsTokenSecret: e.target.value })}
                                        placeholder="••••••••"
                                        className="bg-slate-800/50 border-slate-700 h-9"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Billing */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-white">Système de facturation</p>
                            <p className="text-xs text-slate-400">Gestion des crédits et paiements</p>
                        </div>
                    </div>
                    <Switch
                        checked={data.billingEnabled}
                        onCheckedChange={(checked) => setData({ ...data, billingEnabled: checked })}
                    />
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="ghost" className="text-slate-400">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Button onClick={onNext} className="bg-cyan-600 hover:bg-cyan-700">
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Step 6: Summary & Complete
function SummaryStep({ onBack, data }: StepProps & { onComplete: () => void; completing: boolean }) {
    return null; // Placeholder, will be replaced
}

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<SetupData>(defaultData);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Check if setup is already completed
    useEffect(() => {
        const checkSetup = async () => {
            try {
                const res = await fetch(`${API_URL}/config/setup-status`);
                const status = await res.json();
                if (status.setupCompleted) {
                    router.push('/auth');
                } else {
                    setCheckingStatus(false);
                }
            } catch (err) {
                setCheckingStatus(false);
            }
        };
        checkSetup();
    }, [router]);

    const completeSetup = async () => {
        setCompleting(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/config/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pveHost: data.pveHost,
                    pveTokenId: data.pveTokenId,
                    pveTokenSecret: data.pveTokenSecret,
                    frontendUrl: data.frontendUrl,
                    apiUrl: data.apiUrl,
                    pbsEnabled: data.pbsEnabled,
                    pbsHost: data.pbsHost,
                    pbsTokenId: data.pbsTokenId,
                    pbsTokenSecret: data.pbsTokenSecret,
                    enableLocalAuth: data.enableLocalAuth,
                    enableDiscordAuth: data.enableDiscordAuth,
                    discordClientId: data.discordClientId,
                    discordClientSecret: data.discordClientSecret,
                    discordCallbackUrl: data.discordCallbackUrl || `${data.frontendUrl}/auth/discord/callback`,
                    billingEnabled: data.billingEnabled,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erreur lors de la configuration');
            }

            // Redirect to login
            router.push('/auth');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCompleting(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    const steps = [
        { name: 'Bienvenue', component: WelcomeStep },
        { name: 'Proxmox', component: ProxmoxStep },
        { name: 'URLs', component: UrlsStep },
        { name: 'Auth', component: AuthStep },
        { name: 'Options', component: OptionsStep },
    ];

    const CurrentStep = steps[step]?.component || WelcomeStep;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[150px]" />
            </div>

            <Card className="w-full max-w-lg bg-slate-900/80 border-slate-800 backdrop-blur-sm relative z-10">
                {/* Progress indicator */}
                {step > 0 && (
                    <div className="px-6 pt-6">
                        <div className="flex items-center gap-1">
                            {steps.map((s, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'h-1 flex-1 rounded-full transition-colors',
                                        i <= step ? 'bg-cyan-500' : 'bg-slate-700'
                                    )}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Étape {step + 1} sur {steps.length}
                        </p>
                    </div>
                )}

                <CardContent className="p-6">
                    {step < steps.length ? (
                        <CurrentStep
                            onNext={() => setStep(step + 1)}
                            onBack={step > 0 ? () => setStep(step - 1) : undefined}
                            data={data}
                            setData={setData}
                        />
                    ) : (
                        // Final step - Summary
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="mx-auto p-3 bg-emerald-500/20 rounded-full w-fit mb-4">
                                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Prêt à terminer</h2>
                                <p className="text-sm text-slate-400 mt-1">Vérifiez votre configuration</p>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Proxmox</span>
                                    <span className="text-white">{data.pveHost}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">PBS</span>
                                    <span className={data.pbsEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                                        {data.pbsEnabled ? 'Activé' : 'Désactivé'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Auth Email</span>
                                    <span className={data.enableLocalAuth ? 'text-emerald-400' : 'text-slate-500'}>
                                        {data.enableLocalAuth ? 'Activé' : 'Désactivé'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Auth Discord</span>
                                    <span className={data.enableDiscordAuth ? 'text-emerald-400' : 'text-slate-500'}>
                                        {data.enableDiscordAuth ? 'Activé' : 'Désactivé'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Facturation</span>
                                    <span className={data.billingEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                                        {data.billingEnabled ? 'Activée' : 'Désactivée'}
                                    </span>
                                </div>
                            </div>

                            <Alert className="bg-amber-500/10 border-amber-500/30">
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                                <AlertDescription className="text-amber-300 text-sm">
                                    Après la configuration, connectez-vous avec : <strong>admin / admin</strong>
                                </AlertDescription>
                            </Alert>

                            {error && (
                                <Alert className="bg-red-500/10 border-red-500/30">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-between pt-2">
                                <Button onClick={() => setStep(step - 1)} variant="ghost" className="text-slate-400">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour
                                </Button>
                                <Button onClick={completeSetup} disabled={completing} className="bg-emerald-600 hover:bg-emerald-700">
                                    {completing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Configuration...
                                        </>
                                    ) : (
                                        <>
                                            Terminer la configuration
                                            <CheckCircle className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
