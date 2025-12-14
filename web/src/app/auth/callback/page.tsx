'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Set cookie for 7 days
            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
            // Redirect to dashboard
            router.push('/dashboard');
        } else {
            // Handle error or redirect to login
            router.push('/login?error=missing_token');
        }
    }, [router, searchParams]);

    return (
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
            <p className="text-slate-400">Authenticating...</p>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
