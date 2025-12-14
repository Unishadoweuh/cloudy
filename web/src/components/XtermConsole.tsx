'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XtermConsoleProps {
    wsUrl: string;
    className?: string;
    onError?: (error: string) => void;
}

export function XtermConsole({ wsUrl, className, onError }: XtermConsoleProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const connect = useCallback(async () => {
        if (!terminalRef.current || !wsUrl) return;

        setStatus('connecting');
        setErrorMessage(null);

        try {
            // Dynamic imports for xterm
            const { Terminal } = await import('xterm');
            const { FitAddon } = await import('xterm-addon-fit');

            // Import xterm CSS
            await import('xterm/css/xterm.css');

            // Clean up existing
            if (termRef.current) {
                termRef.current.dispose();
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            terminalRef.current.innerHTML = '';

            // Create terminal
            const term = new Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                theme: {
                    background: '#0f172a',
                    foreground: '#e2e8f0',
                    cursor: '#22d3ee',
                    cursorAccent: '#0f172a',
                    selectionBackground: '#334155',
                },
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            fitAddon.fit();

            // Connect WebSocket
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                setStatus('connected');
                term.focus();
            };

            ws.onmessage = (e) => {
                const data = typeof e.data === 'string'
                    ? e.data
                    : new TextDecoder().decode(e.data);
                term.write(data);
            };

            ws.onerror = () => {
                setStatus('error');
                setErrorMessage('WebSocket connection failed');
                onError?.('WebSocket connection failed');
            };

            ws.onclose = () => {
                setStatus('disconnected');
            };

            // Send terminal input to WebSocket
            term.onData((data: string) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            });

            // Handle resize
            const handleResize = () => {
                fitAddon.fit();
            };
            window.addEventListener('resize', handleResize);

            termRef.current = term;
            wsRef.current = ws;

            // Cleanup function stored for later
            (termRef.current as any)._cleanup = () => {
                window.removeEventListener('resize', handleResize);
            };

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
            if (termRef.current) {
                (termRef.current as any)._cleanup?.();
                termRef.current.dispose();
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const toggleFullscreen = () => {
        if (!terminalRef.current?.parentElement) return;

        if (!document.fullscreenElement) {
            terminalRef.current.parentElement.requestFullscreen();
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

            {/* Terminal container */}
            <div className="relative flex-1 bg-slate-900 rounded-b-lg overflow-hidden min-h-[500px]">
                {status === 'connecting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-4" />
                        <p className="text-slate-400">Connecting to terminal...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                        <p className="text-slate-400 mb-4">Disconnected</p>
                        <Button onClick={connect} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reconnect
                        </Button>
                    </div>
                )}

                <div
                    ref={terminalRef}
                    className="w-full h-full p-2"
                    style={{ minHeight: '500px' }}
                />
            </div>
        </div>
    );
}
