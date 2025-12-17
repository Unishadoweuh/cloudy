'use client';

import { Button } from '@/components/ui/button';
import {
    Zap,
    Server,
    Shield,
    BarChart3,
    Cloud,
    HardDrive,
    ArrowRight,
    Cpu,
    Network,
    Database,
    Lock,
    Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 127 96" {...props}>
            <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.25-23.23-3.25-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
        </svg>
    );
}

// Floating tech icons with staggered animations
function FloatingIcons() {
    const icons = [
        { Icon: Cpu, position: 'top-[15%] left-[10%]', delay: '0s', color: 'text-cyan-500/30' },
        { Icon: Server, position: 'top-[25%] right-[15%]', delay: '0.5s', color: 'text-violet-500/30' },
        { Icon: Database, position: 'bottom-[30%] left-[8%]', delay: '1s', color: 'text-emerald-500/30' },
        { Icon: Network, position: 'top-[60%] right-[12%]', delay: '1.5s', color: 'text-orange-500/30' },
        { Icon: Lock, position: 'bottom-[20%] right-[20%]', delay: '2s', color: 'text-pink-500/30' },
        { Icon: Globe, position: 'top-[40%] left-[5%]', delay: '2.5s', color: 'text-blue-500/30' },
    ];

    return (
        <>
            {icons.map(({ Icon, position, delay, color }, i) => (
                <div
                    key={i}
                    className={cn(
                        'absolute pointer-events-none',
                        position
                    )}
                    style={{
                        animation: `float 6s ease-in-out infinite`,
                        animationDelay: delay,
                    }}
                >
                    <Icon className={cn('h-10 w-10 md:h-14 md:w-14', color)} />
                </div>
            ))}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
            `}</style>
        </>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    gradient,
    delay
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
    delay: number;
}) {
    return (
        <div
            className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-[1.03] hover:border-white/20 hover:shadow-2xl hover:shadow-cyan-500/10"
            style={{
                animation: 'slideUp 0.6s ease-out forwards',
                animationDelay: `${delay}ms`,
                opacity: 0,
            }}
        >
            {/* Glow effect on hover */}
            <div className={cn(
                "absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                gradient === 'cyan' ? 'bg-cyan-500/20' :
                    gradient === 'violet' ? 'bg-violet-500/20' :
                        gradient === 'emerald' ? 'bg-emerald-500/20' :
                            'bg-orange-500/20'
            )} />

            <div className="relative z-10">
                <div className={cn(
                    "p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110",
                    gradient === 'cyan' ? 'bg-cyan-500/20' :
                        gradient === 'violet' ? 'bg-violet-500/20' :
                            gradient === 'emerald' ? 'bg-emerald-500/20' :
                                'bg-orange-500/20'
                )}>
                    <Icon className={cn(
                        "h-6 w-6 transition-all duration-300 group-hover:scale-110",
                        gradient === 'cyan' ? 'text-cyan-400' :
                            gradient === 'violet' ? 'text-violet-400' :
                                gradient === 'emerald' ? 'text-emerald-400' :
                                    'text-orange-400'
                    )} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function StatBadge({ value, label, delay }: { value: string; label: string; delay: number }) {
    return (
        <div
            className="text-center"
            style={{
                animation: 'fadeIn 0.5s ease-out forwards',
                animationDelay: `${delay}ms`,
                opacity: 0,
            }}
        >
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
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
            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(56, 189, 248, 0.6); }
                }
            `}</style>

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Animated gradient orbs with blur */}
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px] animate-pulse" />
                <div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[150px] animate-pulse"
                    style={{ animationDelay: '1s' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[180px]"
                />

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

                {/* Radial gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.8)_70%)]" />

                {/* Floating tech icons */}
                <FloatingIcons />
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="p-6 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3"
                        style={{ animation: 'slideUp 0.5s ease-out forwards' }}
                    >
                        <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-xl border border-white/10 backdrop-blur-xl shadow-lg shadow-cyan-500/10">
                            <Cloud className="h-7 w-7 text-cyan-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Cloud Proxmox</span>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left - Content */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-sm text-slate-400"
                                    style={{ animation: 'slideUp 0.4s ease-out forwards' }}
                                >
                                    <Zap className="h-4 w-4 text-cyan-400" />
                                    Dashboard de gestion Proxmox
                                </div>
                                <h1
                                    className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight"
                                    style={{ animation: 'slideUp 0.5s ease-out forwards' }}
                                >
                                    Gérez votre infrastructure
                                    <span className="block bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                        en toute simplicité
                                    </span>
                                </h1>
                                <p
                                    className="text-lg text-slate-400 max-w-lg leading-relaxed"
                                    style={{ animation: 'slideUp 0.6s ease-out forwards' }}
                                >
                                    Une interface moderne et intuitive pour administrer vos machines virtuelles,
                                    conteneurs et sauvegardes Proxmox VE depuis un seul endroit.
                                </p>
                            </div>

                            {/* Login Button */}
                            <div
                                className="flex flex-col sm:flex-row gap-4"
                                style={{ animation: 'slideUp 0.7s ease-out forwards' }}
                            >
                                <Button
                                    onClick={handleLogin}
                                    size="lg"
                                    className="h-14 px-8 bg-gradient-to-r from-[#5865F2] to-[#7289DA] hover:from-[#4752C4] hover:to-[#5865F2] text-white font-medium text-lg transition-all duration-300 hover:scale-[1.03] shadow-2xl shadow-[#5865F2]/30 border border-white/10"
                                    style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
                                >
                                    <DiscordIcon className="mr-3 h-6 w-6" />
                                    Se connecter avec Discord
                                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-8 pt-4">
                                <StatBadge value="99.9%" label="Uptime" delay={800} />
                                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
                                <StatBadge value="<50ms" label="Latence API" delay={900} />
                                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
                                <StatBadge value="∞" label="VMs" delay={1000} />
                            </div>
                        </div>

                        {/* Right - Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <FeatureCard
                                icon={Server}
                                title="Instances"
                                description="Créez et gérez vos VMs et conteneurs LXC en quelques clics"
                                gradient="cyan"
                                delay={200}
                            />
                            <FeatureCard
                                icon={HardDrive}
                                title="Stockage"
                                description="Visualisez et organisez vos volumes de stockage"
                                gradient="violet"
                                delay={300}
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Sécurité"
                                description="Pare-feu intégré et gestion des règles de sécurité"
                                gradient="emerald"
                                delay={400}
                            />
                            <FeatureCard
                                icon={BarChart3}
                                title="Monitoring"
                                description="Surveillance en temps réel de vos ressources"
                                gradient="orange"
                                delay={500}
                            />
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="p-6 text-center">
                    <p
                        className="text-sm text-slate-500"
                        style={{ animation: 'fadeIn 1s ease-out forwards', animationDelay: '1.2s', opacity: 0 }}
                    >
                        © 2024 Cloud Proxmox • Propulsé par Proxmox VE
                    </p>
                </footer>
            </div>
        </div>
    );
}
