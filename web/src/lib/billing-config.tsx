'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAppConfig } from '@/lib/api';

interface BillingConfig {
    enabled: boolean;
    loading: boolean;
}

const BillingConfigContext = createContext<BillingConfig | undefined>(undefined);

export function BillingConfigProvider({ children }: { children: ReactNode }) {
    // Fetch billing config from API (read-only, changes via admin settings)
    const { data: config, isLoading } = useQuery({
        queryKey: ['appConfig'],
        queryFn: getAppConfig,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: false, // Don't retry on failure (non-admin users can't access this)
    });

    const enabled = config?.billingEnabled ?? false;

    return (
        <BillingConfigContext.Provider value={{ enabled, loading: isLoading }}>
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
        };
    }
    return context;
}

