'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VncConsoleProps {
    wsUrl: string;
    className?: string;
    onError?: (error: string) => void;
}

export function VncConsole({ wsUrl, className, onError }: VncConsoleProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const rfbRef = useRef<any>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const connect = useCallback(async () => {
        if (!canvasRef.current || !wsUrl) return;

        setStatus('connecting');
        setErrorMessage(null);

        try {
            // Dynamic import of noVNC RFB
            const { default: RFB } = await import('@novnc/novnc/lib/rfb');

            // Clean up existing connection
            if (rfbRef.current) {
                rfbRef.current.disconnect();
                rfbRef.current = null;
            }

            // Clear the container
            canvasRef.current.innerHTML = '';

            // Create new RFB connection
            const rfb = new RFB(canvasRef.current, wsUrl, {
                credentials: { password: '' },
                wsProtocols: ['binary'],
            });

            rfb.scaleViewport = true;
            rfb.resizeSession = true;
            rfb.qualityLevel = 6;
            rfb.compressionLevel = 2;

            rfb.addEventListener('connect', () => {
                setStatus('connected');
            });

            rfb.addEventListener('disconnect', (e: any) => {
                setStatus('disconnected');
                if (e.detail?.clean === false) {
                    setErrorMessage('Connection closed unexpectedly');
                    onError?.('Connection closed unexpectedly');
                }
            });

            rfb.addEventListener('securityfailure', (e: any) => {
                setStatus('error');
                const msg = e.detail?.reason || 'Security failure';
                setErrorMessage(msg);
                onError?.(msg);
            });

            rfbRef.current = rfb;
        } catch (error) {
            setStatus('error');
            const msg = error instanceof Error ? error.message : 'Failed to connect';
            setErrorMessage(msg);
            onError?.(msg);
        }
    }, [wsUrl, onError]);

    useEffect(() => {
        connect();

        return () => {
            if (rfbRef.current) {
                rfbRef.current.disconnect();
                rfbRef.current = null;
            }
        };
    }, [connect]);

    const toggleFullscreen = () => {
        if (!canvasRef.current?.parentElement) return;

        if (!document.fullscreenElement) {
            canvasRef.current.parentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className={cn("relative flex flex-col", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-slate-800/80 border-b border-slate-700 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        status === 'connected' ? "bg-green-500" :
                            status === 'connecting' ? "bg-yellow-500 animate-pulse" :
                                "bg-red-500"
                    )} />
                    <span className="text-xs text-slate-400 capitalize">{status}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={connect}
                        className="h-7 w-7 text-slate-400 hover:text-white"
                        disabled={status === 'connecting'}
                    >
                        <RefreshCw className={cn("h-4 w-4", status === 'connecting' && "animate-spin")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="h-7 w-7 text-slate-400 hover:text-white"
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Console container */}
            <div className="relative flex-1 bg-black rounded-b-lg overflow-hidden min-h-[500px]">
                {status === 'connecting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-4" />
                        <p className="text-slate-400">Connecting to console...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
                        <p className="text-red-400 mb-2">Connection Error</p>
                        <p className="text-slate-500 text-sm mb-4">{errorMessage}</p>
                        <Button onClick={connect} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                {status === 'disconnected' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                        <p className="text-slate-400 mb-4">Disconnected</p>
                        <Button onClick={connect} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reconnect
                        </Button>
                    </div>
                )}

                <div
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ minHeight: '500px' }}
                />
            </div>
        </div>
    );
}
