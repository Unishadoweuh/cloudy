'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader2, CheckCircle2, Server, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Instance } from '@/lib/types';

interface DeleteInstanceModalProps {
    instance: Instance | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

type ModalState = 'confirm' | 'deleting' | 'success';

export function DeleteInstanceModal({ instance, isOpen, onClose, onConfirm }: DeleteInstanceModalProps) {
    const [state, setState] = useState<ModalState>('confirm');
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setState('confirm');
            setIsAnimatingOut(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (state === 'deleting') return; // Can't close while deleting
        setIsAnimatingOut(true);
        setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
        }, 200);
    };

    const handleConfirm = async () => {
        setState('deleting');
        try {
            await onConfirm();
            setState('success');
            // Auto close after success animation
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (error) {
            setState('confirm');
        }
    };

    if (!isOpen || !instance) return null;

    const isVM = instance.type === 'qemu';

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
                    isAnimatingOut ? "opacity-0" : "opacity-100"
                )}
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={cn(
                        "relative w-full max-w-md pointer-events-auto",
                        "bg-gradient-to-b from-slate-800 to-slate-900",
                        "border border-slate-700/50 rounded-2xl shadow-2xl",
                        "transform transition-all duration-200",
                        isAnimatingOut
                            ? "opacity-0 scale-95"
                            : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    {state === 'confirm' && (
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}

                    <div className="p-6">
                        {/* Confirm State */}
                        {state === 'confirm' && (
                            <div className="space-y-5">
                                {/* Icon */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                                        <div className="relative p-4 bg-red-500/10 border border-red-500/20 rounded-full">
                                            <AlertTriangle className="h-8 w-8 text-red-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-white mb-2">Supprimer l'instance ?</h2>
                                    <p className="text-sm text-slate-400">Cette action est irréversible</p>
                                </div>

                                {/* Instance Card */}
                                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2.5 rounded-lg",
                                            isVM ? "bg-cyan-500/10 text-cyan-400" : "bg-violet-500/10 text-violet-400"
                                        )}>
                                            {isVM ? <Server className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{instance.name}</p>
                                            <p className="text-xs text-slate-500">
                                                VMID: {instance.vmid} · {instance.node}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning */}
                                <p className="text-sm text-slate-400 text-center">
                                    L'instance et toutes ses données seront définitivement supprimées.
                                </p>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleClose}
                                        className="flex-1 border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleConfirm}
                                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Deleting State */}
                        {state === 'deleting' && (
                            <div className="py-8 space-y-5">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                                        <div className="relative p-4 bg-slate-800 border border-slate-700 rounded-full">
                                            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-lg font-semibold text-white mb-1">Suppression en cours...</h2>
                                    <p className="text-sm text-slate-500">{instance.name}</p>
                                </div>
                                {/* Progress bar animation */}
                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full animate-progress" />
                                </div>
                            </div>
                        )}

                        {/* Success State */}
                        {state === 'success' && (
                            <div className="py-8 space-y-5">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                                        <div className="relative p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in zoom-in duration-300">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-lg font-semibold text-white mb-1">Instance supprimée !</h2>
                                    <p className="text-sm text-slate-500">{instance.name} a été supprimée</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom animation styles */}
            <style jsx global>{`
                @keyframes progress {
                    0% { width: 0%; margin-left: 0; }
                    50% { width: 60%; margin-left: 20%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-progress {
                    animation: progress 1.5s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}
