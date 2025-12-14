'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'midnight' | 'ocean' | 'forest' | 'sunset' | 'aurora';

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
    },
};

interface ThemeContextType {
    theme: ThemeName;
    colors: ThemeColors;
    setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>('midnight');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('app-theme') as ThemeName;
        if (saved && themes[saved]) {
            setThemeState(saved);
        }
    }, []);

    const setTheme = (newTheme: ThemeName) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);

        // Update CSS variables for the theme
        const colors = themes[newTheme];
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-primary-hover', colors.primaryHover);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    };

    // Apply theme on mount and change
    useEffect(() => {
        if (mounted) {
            const colors = themes[theme];
            document.documentElement.style.setProperty('--theme-primary', colors.primary);
            document.documentElement.style.setProperty('--theme-primary-hover', colors.primaryHover);
            document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
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
        cardBg: colors.cardBg,
        cardBorder: colors.cardBorder,
        cardHover: colors.cardHover,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        textMuted: colors.textMuted,
    };
}
