'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    fullWidth?: boolean;
}

export function FadeIn({
    children,
    className,
    delay = 0,
    duration = 500,
    direction = 'up',
    fullWidth = false
}: FadeInProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const getTransform = () => {
        if (!isVisible && direction === 'up') return 'translate-y-4';
        if (!isVisible && direction === 'down') return '-translate-y-4';
        if (!isVisible && direction === 'left') return 'translate-x-4';
        if (!isVisible && direction === 'right') return '-translate-x-4';
        return 'translate-0';
    };

    return (
        <div
            className={cn(
                "transition-all ease-out transform",
                isVisible ? "opacity-100" : "opacity-0",
                getTransform(),
                fullWidth ? "w-full" : "",
                className
            )}
            style={{ transitionDuration: `${duration}ms` }}
        >
            {children}
        </div>
    );
}
