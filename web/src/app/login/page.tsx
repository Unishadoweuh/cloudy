'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Redirect from old /login to new /auth page
export default function LoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
