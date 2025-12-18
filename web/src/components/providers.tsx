'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { LanguageProvider } from '@/lib/language-context';
import { ThemeProvider } from '@/lib/theme-context';
import { BillingConfigProvider } from '@/lib/billing-config';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <LanguageProvider>
                    <BillingConfigProvider>
                        {children}
                    </BillingConfigProvider>
                </LanguageProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

