'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BillingConfig {
    enabled: boolean;
    loading: boolean;
    setEnabled: (enabled: boolean) => Promise<void>;
}

const BillingConfigContext = createContext<BillingConfig | undefined>(undefined);

// API calls
async function getBillingEnabled(): Promise<boolean> {
    // Check localStorage first (for immediate UI), then could sync with server
    const stored = localStorage.getItem('billing_enabled');
    // Default to false (billing disabled) for new deployments
    return stored === 'true';
}

async function setBillingEnabledApi(enabled: boolean): Promise<void> {
    localStorage.setItem('billing_enabled', String(enabled));
    // Could sync with server here in the future
}

export function BillingConfigProvider({ children }: { children: ReactNode }) {
    const [enabled, setEnabledState] = useState(false);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        getBillingEnabled().then((value) => {
            setEnabledState(value);
            setLoading(false);
        });
    }, []);

    const setEnabled = async (value: boolean) => {
        await setBillingEnabledApi(value);
        setEnabledState(value);
        // Invalidate billing queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['billing'] });
        queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
    };

    return (
        <BillingConfigContext.Provider value={{ enabled, loading, setEnabled }}>
            {children}
        </BillingConfigContext.Provider>
    );
}

export function useBillingConfig() {
    const context = useContext(BillingConfigContext);
    if (context === undefined) {
        // Return default disabled state during SSR
        return {
            enabled: false,
            loading: true,
            setEnabled: async () => { },
        };
    }
    return context;
}
