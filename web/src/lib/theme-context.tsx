'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'midnight' | 'ocean' | 'forest' | 'sunset' | 'aurora' | 'neon' | 'lavender' | 'ember';

export interface ThemeColors {
    name: string;
    displayName: string;
    description: string;
    // Primary accents
    primary: string;
    primaryHover: string;
    primaryGlow: string;
    // Secondary accents
    secondary: string;
    secondaryGlow: string;
    // Background gradient orbs
    orbPrimary: string;
    orbSecondary: string;
    // Sidebar
    sidebarBg: string;
    sidebarBorder: string;
    sidebarActive: string;
    // Cards
    cardBg: string;
    cardBorder: string;
    cardHover: string;
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    // Accent gradient for buttons/highlights
    gradient: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
    midnight: {
        name: 'midnight',
        displayName: 'Midnight',
        description: 'Thème sombre classique avec accents cyan',
        primary: 'rgb(34, 211, 238)',
        primaryHover: 'rgb(6, 182, 212)',
        primaryGlow: 'rgba(34, 211, 238, 0.2)',
        secondary: 'rgb(139, 92, 246)',
        secondaryGlow: 'rgba(139, 92, 246, 0.2)',
        orbPrimary: 'bg-cyan-500/20',
        orbSecondary: 'bg-violet-500/20',
        sidebarBg: 'bg-slate-900',
        sidebarBorder: 'border-slate-800/50',
        sidebarActive: 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400',
        cardBg: 'bg-slate-800/50',
        cardBorder: 'border-slate-700/50',
        cardHover: 'hover:bg-slate-800',
        success: 'rgb(52, 211, 153)',
        warning: 'rgb(251, 191, 36)',
        error: 'rgb(248, 113, 113)',
        info: 'rgb(96, 165, 250)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-cyan-500 to-violet-500',
    },
    ocean: {
        name: 'ocean',
        displayName: 'Ocean',
        description: 'Bleu profond avec accents turquoise',
        primary: 'rgb(56, 189, 248)',
        primaryHover: 'rgb(14, 165, 233)',
        primaryGlow: 'rgba(56, 189, 248, 0.2)',
        secondary: 'rgb(34, 211, 238)',
        secondaryGlow: 'rgba(34, 211, 238, 0.2)',
        orbPrimary: 'bg-sky-500/20',
        orbSecondary: 'bg-teal-500/20',
        sidebarBg: 'bg-slate-950',
        sidebarBorder: 'border-sky-900/30',
        sidebarActive: 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400',
        cardBg: 'bg-slate-900/50',
        cardBorder: 'border-sky-800/30',
        cardHover: 'hover:bg-slate-900',
        success: 'rgb(45, 212, 191)',
        warning: 'rgb(250, 204, 21)',
        error: 'rgb(251, 113, 133)',
        info: 'rgb(56, 189, 248)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-sky-400 to-teal-400',
    },
    forest: {
        name: 'forest',
        displayName: 'Forest',
        description: 'Nature avec accents émeraude',
        primary: 'rgb(52, 211, 153)',
        primaryHover: 'rgb(16, 185, 129)',
        primaryGlow: 'rgba(52, 211, 153, 0.2)',
        secondary: 'rgb(163, 230, 53)',
        secondaryGlow: 'rgba(163, 230, 53, 0.2)',
        orbPrimary: 'bg-emerald-500/20',
        orbSecondary: 'bg-lime-500/20',
        sidebarBg: 'bg-slate-950',
        sidebarBorder: 'border-emerald-900/30',
        sidebarActive: 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400',
        cardBg: 'bg-slate-900/50',
        cardBorder: 'border-emerald-800/30',
        cardHover: 'hover:bg-slate-900',
        success: 'rgb(52, 211, 153)',
        warning: 'rgb(250, 204, 21)',
        error: 'rgb(248, 113, 113)',
        info: 'rgb(96, 165, 250)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-emerald-400 to-lime-400',
    },
    sunset: {
        name: 'sunset',
        displayName: 'Sunset',
        description: 'Tons chauds avec accents orange',
        primary: 'rgb(251, 146, 60)',
        primaryHover: 'rgb(249, 115, 22)',
        primaryGlow: 'rgba(251, 146, 60, 0.2)',
        secondary: 'rgb(244, 114, 182)',
        secondaryGlow: 'rgba(244, 114, 182, 0.2)',
        orbPrimary: 'bg-orange-500/20',
        orbSecondary: 'bg-pink-500/20',
        sidebarBg: 'bg-slate-950',
        sidebarBorder: 'border-orange-900/30',
        sidebarActive: 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-400',
        cardBg: 'bg-slate-900/50',
        cardBorder: 'border-orange-800/30',
        cardHover: 'hover:bg-slate-900',
        success: 'rgb(52, 211, 153)',
        warning: 'rgb(251, 146, 60)',
        error: 'rgb(248, 113, 113)',
        info: 'rgb(96, 165, 250)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-orange-400 to-pink-400',
    },
    aurora: {
        name: 'aurora',
        displayName: 'Aurora',
        description: 'Aurore boréale avec violet et vert',
        primary: 'rgb(167, 139, 250)',
        primaryHover: 'rgb(139, 92, 246)',
        primaryGlow: 'rgba(167, 139, 250, 0.2)',
        secondary: 'rgb(74, 222, 128)',
        secondaryGlow: 'rgba(74, 222, 128, 0.2)',
        orbPrimary: 'bg-violet-500/20',
        orbSecondary: 'bg-green-500/20',
        sidebarBg: 'bg-slate-950',
        sidebarBorder: 'border-violet-900/30',
        sidebarActive: 'bg-violet-500/10 text-violet-400 border-l-2 border-violet-400',
        cardBg: 'bg-slate-900/50',
        cardBorder: 'border-violet-800/30',
        cardHover: 'hover:bg-slate-900',
        success: 'rgb(74, 222, 128)',
        warning: 'rgb(250, 204, 21)',
        error: 'rgb(248, 113, 113)',
        info: 'rgb(167, 139, 250)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-violet-400 to-green-400',
    },
    neon: {
        name: 'neon',
        displayName: 'Neon',
        description: 'Cyberpunk avec rose et bleu électrique',
        primary: 'rgb(236, 72, 153)',
        primaryHover: 'rgb(219, 39, 119)',
        primaryGlow: 'rgba(236, 72, 153, 0.3)',
        secondary: 'rgb(56, 189, 248)',
        secondaryGlow: 'rgba(56, 189, 248, 0.3)',
        orbPrimary: 'bg-pink-500/25',
        orbSecondary: 'bg-sky-500/25',
        sidebarBg: 'bg-gray-950',
        sidebarBorder: 'border-pink-900/40',
        sidebarActive: 'bg-pink-500/15 text-pink-400 border-l-2 border-pink-400',
        cardBg: 'bg-gray-900/60',
        cardBorder: 'border-pink-800/30',
        cardHover: 'hover:bg-gray-900',
        success: 'rgb(74, 222, 128)',
        warning: 'rgb(250, 204, 21)',
        error: 'rgb(248, 113, 113)',
        info: 'rgb(56, 189, 248)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-pink-500 via-purple-500 to-sky-500',
    },
    lavender: {
        name: 'lavender',
        displayName: 'Lavender',
        description: 'Doux et élégant avec tons lavande',
        primary: 'rgb(192, 132, 252)',
        primaryHover: 'rgb(168, 85, 247)',
        primaryGlow: 'rgba(192, 132, 252, 0.2)',
        secondary: 'rgb(251, 207, 232)',
        secondaryGlow: 'rgba(251, 207, 232, 0.2)',
        orbPrimary: 'bg-purple-400/20',
        orbSecondary: 'bg-pink-300/20',
        sidebarBg: 'bg-slate-950',
        sidebarBorder: 'border-purple-900/30',
        sidebarActive: 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-400',
        cardBg: 'bg-slate-900/50',
        cardBorder: 'border-purple-800/30',
        cardHover: 'hover:bg-slate-900',
        success: 'rgb(52, 211, 153)',
        warning: 'rgb(250, 204, 21)',
        error: 'rgb(248, 113, 113)',
        info: 'rgb(192, 132, 252)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-purple-400 to-pink-300',
    },
    ember: {
        name: 'ember',
        displayName: 'Ember',
        description: 'Rouge profond avec accents dorés',
        primary: 'rgb(239, 68, 68)',
        primaryHover: 'rgb(220, 38, 38)',
        primaryGlow: 'rgba(239, 68, 68, 0.2)',
        secondary: 'rgb(251, 191, 36)',
        secondaryGlow: 'rgba(251, 191, 36, 0.2)',
        orbPrimary: 'bg-red-500/20',
        orbSecondary: 'bg-amber-500/20',
        sidebarBg: 'bg-gray-950',
        sidebarBorder: 'border-red-900/30',
        sidebarActive: 'bg-red-500/10 text-red-400 border-l-2 border-red-400',
        cardBg: 'bg-gray-900/50',
        cardBorder: 'border-red-800/30',
        cardHover: 'hover:bg-gray-900',
        success: 'rgb(52, 211, 153)',
        warning: 'rgb(251, 191, 36)',
        error: 'rgb(239, 68, 68)',
        info: 'rgb(96, 165, 250)',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        gradient: 'from-red-500 to-amber-500',
    },
};

interface ThemeContextType {
    theme: ThemeName;
    colors: ThemeColors;
    setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeCSS(colors: ThemeColors) {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-hover', colors.primaryHover);
    root.style.setProperty('--theme-primary-glow', colors.primaryGlow);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-secondary-glow', colors.secondaryGlow);
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);
    root.style.setProperty('--theme-info', colors.info);

    // Store theme name for data attribute
    root.setAttribute('data-theme', colors.name);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>('midnight');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('app-theme') as ThemeName;
        if (saved && themes[saved]) {
            setThemeState(saved);
            applyThemeCSS(themes[saved]);
        } else {
            applyThemeCSS(themes.midnight);
        }
    }, []);

    const setTheme = (newTheme: ThemeName) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
        applyThemeCSS(themes[newTheme]);
    };

    // Apply theme on mount and change
    useEffect(() => {
        if (mounted) {
            applyThemeCSS(themes[theme]);
        }
    }, [theme, mounted]);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, colors: themes[theme], setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    // Return default theme during SSR/prerendering when context is not available
    if (context === undefined) {
        return {
            theme: 'midnight' as ThemeName,
            colors: themes.midnight,
            setTheme: () => { },
        };
    }
    return context;
}

// Helper to get theme-aware classes
export function useThemeClasses() {
    const { colors } = useTheme();

    return {
        orbPrimary: colors.orbPrimary,
        orbSecondary: colors.orbSecondary,
        sidebarBg: colors.sidebarBg,
        sidebarBorder: colors.sidebarBorder,
        sidebarActive: colors.sidebarActive,
        cardBg: colors.cardBg,
        cardBorder: colors.cardBorder,
        cardHover: colors.cardHover,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        textMuted: colors.textMuted,
        gradient: colors.gradient,
    };
}
