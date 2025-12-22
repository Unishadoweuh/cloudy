'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Cloud, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const mutation = useMutation({
        mutationFn: () => forgotPassword(email),
        onSuccess: () => setSent(true),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

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
                        Mot de passe oublié
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {sent ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                            <p className="text-slate-300 mb-2">Email envoyé !</p>
                            <p className="text-sm text-slate-500 mb-4">
                                Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
                            </p>
                            <Link href="/auth">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour à la connexion
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        className="pl-10 bg-slate-700/50 border-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Envoyer le lien'
                                )}
                            </Button>

                            <div className="text-center">
                                <Link href="/auth" className="text-sm text-slate-400 hover:text-white">
                                    Retour à la connexion
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
