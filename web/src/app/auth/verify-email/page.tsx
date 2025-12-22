'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { verifyEmail } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Cloud } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [verified, setVerified] = useState(false);

    const mutation = useMutation({
        mutationFn: () => verifyEmail(token || ''),
        onSuccess: () => setVerified(true),
    });

    useEffect(() => {
        if (token && !mutation.isPending && !mutation.isSuccess && !mutation.isError) {
            mutation.mutate();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-primary/20 rounded-2xl">
                            <Cloud className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Vérification Email
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 text-center">
                    {!token && (
                        <div className="py-8">
                            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <p className="text-slate-300">Token de vérification manquant.</p>
                            <Link href="/auth">
                                <Button className="mt-4">Retour à la connexion</Button>
                            </Link>
                        </div>
                    )}

                    {token && mutation.isPending && (
                        <div className="py-8">
                            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                            <p className="text-slate-300">Vérification en cours...</p>
                        </div>
                    )}

                    {verified && (
                        <div className="py-8">
                            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                            <p className="text-slate-300 mb-4">
                                Votre email a été vérifié avec succès !
                            </p>
                            <Link href="/auth">
                                <Button className="bg-primary hover:bg-primary/90">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    )}

                    {mutation.isError && (
                        <div className="py-8">
                            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <p className="text-slate-300 mb-2">La vérification a échoué.</p>
                            <p className="text-sm text-slate-500 mb-4">
                                {(mutation.error as Error)?.message?.replace('API Error: ', '')}
                            </p>
                            <Link href="/auth">
                                <Button variant="outline">Retour à la connexion</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
