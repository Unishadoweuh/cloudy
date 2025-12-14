'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Zap,
    Server,
    Shield,
    BarChart3,
    Cloud,
    Cpu,
    HardDrive,
    Network,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 127 96" {...props}>
            <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.25-23.23-3.25-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
        </svg>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    gradient
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
}) {
    return (
        <div className="group relative p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 hover:scale-[1.02] hover:border-slate-600/50">
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                gradient
            )} />
            <div className={cn(
                "p-3 rounded-xl w-fit mb-4",
                gradient.replace('bg-', 'bg-opacity-10 bg-')
            )} style={{ backgroundColor: `${gradient.includes('cyan') ? 'rgba(34, 211, 238, 0.1)' : gradient.includes('violet') ? 'rgba(139, 92, 246, 0.1)' : gradient.includes('emerald') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 146, 60, 0.1)'}` }}>
                <Icon className={cn(
                    "h-6 w-6",
                    gradient.includes('cyan') ? 'text-cyan-400' :
                        gradient.includes('violet') ? 'text-violet-400' :
                            gradient.includes('emerald') ? 'text-emerald-400' :
                                'text-orange-400'
                )} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        </div>
    );
}

function StatBadge({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                {value}
            </div>
            <div className="text-sm text-slate-500 mt-1">{label}</div>
        </div>
    );
}

export default function LoginPage() {
    const handleLogin = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cp.unishadow.ovh';
        window.location.href = `${apiUrl}/auth/discord`;
    };

    return (
        <div className="min-h-screen bg-slate-950 overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-800/50 rounded-full blur-[128px]" />

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-xl border border-slate-700/50">
                            <Cloud className="h-6 w-6 text-cyan-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Cloud Proxmox</span>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left - Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm text-slate-400">
                                    <Zap className="h-4 w-4 text-cyan-400" />
                                    Dashboard de gestion Proxmox
                                </div>
                                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                                    Gérez votre infrastructure
                                    <span className="block bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                        en toute simplicité
                                    </span>
                                </h1>
                                <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                                    Une interface moderne et intuitive pour administrer vos machines virtuelles,
                                    conteneurs et sauvegardes Proxmox VE depuis un seul endroit.
                                </p>
                            </div>

                            {/* Login Button */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    onClick={handleLogin}
                                    size="lg"
                                    className="h-14 px-8 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-lg transition-all hover:scale-[1.02] shadow-lg shadow-[#5865F2]/25"
                                >
                                    <DiscordIcon className="mr-3 h-6 w-6" />
                                    Se connecter avec Discord
                                    <ArrowRight className="ml-3 h-5 w-5" />
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-8 pt-4">
                                <StatBadge value="99.9%" label="Uptime" />
                                <div className="w-px h-12 bg-slate-700" />
                                <StatBadge value="<50ms" label="Latence API" />
                                <div className="w-px h-12 bg-slate-700" />
                                <StatBadge value="∞" label="VMs" />
                            </div>
                        </div>

                        {/* Right - Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <FeatureCard
                                icon={Server}
                                title="Instances"
                                description="Créez et gérez vos VMs et conteneurs LXC en quelques clics"
                                gradient="bg-cyan-500"
                            />
                            <FeatureCard
                                icon={HardDrive}
                                title="Stockage"
                                description="Visualisez et organisez vos volumes de stockage"
                                gradient="bg-violet-500"
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Sécurité"
                                description="Pare-feu intégré et gestion des règles de sécurité"
                                gradient="bg-emerald-500"
                            />
                            <FeatureCard
                                icon={BarChart3}
                                title="Monitoring"
                                description="Surveillance en temps réel de vos ressources"
                                gradient="bg-orange-500"
                            />
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="p-6 text-center text-sm text-slate-500">
                    <p>© 2024 Cloud Proxmox • Propulsé par Proxmox VE</p>
                </footer>
            </div>
        </div>
    );
}
