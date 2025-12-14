declare module '@novnc/novnc/lib/rfb' {
    export default class RFB {
        constructor(
            target: HTMLElement,
            url: string,
            options?: {
                credentials?: { password?: string };
                wsProtocols?: string[];
            }
        );

        scaleViewport: boolean;
        resizeSession: boolean;
        qualityLevel: number;
        compressionLevel: number;

        disconnect(): void;
        sendCredentials(credentials: { password?: string }): void;
        sendKey(keysym: number, code: string, down?: boolean): void;
        focus(): void;
        blur(): void;

        addEventListener(event: 'connect' | 'disconnect' | 'securityfailure' | 'clipboard', callback: (e: any) => void): void;
        removeEventListener(event: string, callback: Function): void;
    }
}

declare module 'xterm' {
    export class Terminal {
        constructor(options?: {
            cursorBlink?: boolean;
            fontSize?: number;
            fontFamily?: string;
            theme?: {
                background?: string;
                foreground?: string;
                cursor?: string;
                cursorAccent?: string;
                selectionBackground?: string;
            };
        });

        open(parent: HTMLElement): void;
        write(data: string): void;
        dispose(): void;
        focus(): void;
        loadAddon(addon: any): void;
        onData(callback: (data: string) => void): void;
    }
}

declare module 'xterm-addon-fit' {
    export class FitAddon {
        fit(): void;
    }
}

declare module 'xterm/css/xterm.css';
