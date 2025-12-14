'use client';

import { useLanguage, Language } from '@/lib/language-context';
import { useTheme, themes, ThemeName } from '@/lib/theme-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Globe,
    Check,
    Palette,
    Bug,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api';
import { Switch } from '@/components/ui/switch';

function ThemeCard({
    themeName,
    isActive,
    onClick,
}: {
    themeName: ThemeName;
    isActive: boolean;
    onClick: () => void;
}) {
    const themeData = themes[themeName];

    // Get orb colors for preview
    const orbPrimaryClass = themeData.orbPrimary.replace('/20', '/40');
    const orbSecondaryClass = themeData.orbSecondary.replace('/20', '/40');

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden group",
                isActive
                    ? "border-white/50 bg-slate-800/80 scale-[1.02]"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50"
            )}
        >
            {/* Theme preview orbs */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className={cn(
                    "absolute -top-4 -left-4 w-16 h-16 rounded-full blur-2xl opacity-60",
                    orbPrimaryClass
                )} />
                <div className={cn(
                    "absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-60",
                    orbSecondaryClass
                )} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{themeData.displayName}</span>
                    {isActive && (
                        <div className="p-1 rounded-full bg-emerald-500/20">
                            <Check className="h-3 w-3 text-emerald-400" />
                        </div>
                    )}
                </div>
                <p className="text-xs text-slate-400">{themeData.description}</p>

                {/* Color preview dots */}
                <div className="flex gap-2 mt-3">
                    <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: themeData.primary }}
                    />
                    <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: themeData.secondary }}
                    />
                    <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: themeData.success }}
                    />
                </div>
            </div>
        </button>
    );
}

export default function SettingsPage() {
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [saved, setSaved] = useState(false);
    const [themeSaved, setThemeSaved] = useState(false);
    const [debugMode, setDebugMode] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: getMe,
    });

    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const stored = localStorage.getItem('debug_mode') === 'true';
        setDebugMode(stored);
    }, []);

    const handleDebugChange = (checked: boolean) => {
        setDebugMode(checked);
        localStorage.setItem('debug_mode', String(checked));
        window.dispatchEvent(new Event('storage'));
    };

    const handleLanguageChange = (value: Language) => {
        setLanguage(value);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleThemeChange = (themeName: ThemeName) => {
        setTheme(themeName);
        setThemeSaved(true);
        setTimeout(() => setThemeSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
                <p className="text-slate-500 text-sm">{t('settings.subtitle')}</p>
            </div>

            {/* Theme Setting */}
            <Card className="glass border-slate-700/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-slate-800/50 text-violet-400">
                                <Palette className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-white text-lg">Thème</CardTitle>
                                <CardDescription className="text-slate-500">
                                    Personnalisez l'apparence de l'interface
                                </CardDescription>
                            </div>
                        </div>
                        {themeSaved && (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in">
                                <Check className="h-4 w-4" />
                                <span>{t('settings.saved')}</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(Object.keys(themes) as ThemeName[]).map((themeName) => (
                            <ThemeCard
                                key={themeName}
                                themeName={themeName}
                                isActive={theme === themeName}
                                onClick={() => handleThemeChange(themeName)}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Language Setting */}
            <Card className="glass border-slate-700/30">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-800/50 text-cyan-400">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">{t('settings.language')}</CardTitle>
                            <CardDescription className="text-slate-500">
                                {t('settings.languageDesc')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                            <SelectTrigger className="w-48 bg-slate-900/50 border-slate-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="en">
                                    <div className="flex items-center gap-2">
                                        <span>🇬🇧</span>
                                        <span>English</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="fr">
                                    <div className="flex items-center gap-2">
                                        <span>🇫🇷</span>
                                        <span>Français</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {saved && (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in">
                                <Check className="h-4 w-4" />
                                <span>{t('settings.saved')}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Admin Debug Mode */}
            {isAdmin && (
                <Card className="glass border-slate-700/30">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-slate-800/50 text-orange-400">
                                <Bug className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-white text-lg">Debug Mode</CardTitle>
                                <CardDescription className="text-slate-500">
                                    Enable verbose logging and debug information (Admin Only)
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-base font-medium text-white">
                                    Enable Debug Tools
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    Show raw data and extended error details in the UI.
                                </p>
                            </div>
                            <Switch
                                checked={debugMode}
                                onCheckedChange={handleDebugChange}
                                className="data-[state=checked]:bg-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info */}
            <div className="text-center text-sm text-slate-600">
                Uni-Cloud v0.3.0 • Proxmox Dashboard
            </div>
        </div>
    );
}
