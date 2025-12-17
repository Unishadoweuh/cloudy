'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Animated counter that counts up to a target value
export function AnimatedCounter({
    value,
    duration = 1000,
    prefix = '',
    suffix = '',
    className,
    decimals = 0,
}: {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    decimals?: number;
}) {
    const [count, setCount] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const startTime = performance.now();
        const difference = value - startValue;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + difference * easeOut;

            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = value;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span className={cn("tabular-nums", className)}>
            {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{suffix}
        </span>
    );
}

// Animated progress bar with smooth transitions
export function AnimatedProgress({
    value,
    max = 100,
    className,
    barClassName,
    showLabel = false,
    labelPosition = 'right',
}: {
    value: number;
    max?: number;
    className?: string;
    barClassName?: string;
    showLabel?: boolean;
    labelPosition?: 'left' | 'right' | 'inside';
}) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {showLabel && labelPosition === 'left' && (
                <span className="text-xs text-slate-400 w-10">{percentage.toFixed(0)}%</span>
            )}
            <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        "bg-gradient-to-r from-cyan-500 to-blue-500",
                        barClassName
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && labelPosition === 'right' && (
                <span className="text-xs text-slate-400 w-10 text-right">{percentage.toFixed(0)}%</span>
            )}
        </div>
    );
}

// Fade in animation wrapper
export function FadeIn({
    children,
    delay = 0,
    duration = 500,
    direction = 'up',
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    className?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const transforms = {
        up: 'translate-y-4',
        down: '-translate-y-4',
        left: 'translate-x-4',
        right: '-translate-x-4',
        none: '',
    };

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all",
                isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${transforms[direction]}`,
                className
            )}
            style={{ transitionDuration: `${duration}ms` }}
        >
            {children}
        </div>
    );
}

// Staggered list animation
export function StaggeredList({
    children,
    staggerDelay = 50,
    className,
}: {
    children: React.ReactNode[];
    staggerDelay?: number;
    className?: string;
}) {
    return (
        <div className={className}>
            {children.map((child, index) => (
                <FadeIn key={index} delay={index * staggerDelay} direction="up">
                    {child}
                </FadeIn>
            ))}
        </div>
    );
}

// Pulse animation for live indicators
export function PulseIndicator({
    color = 'emerald',
    size = 'md',
    className,
}: {
    color?: 'emerald' | 'red' | 'amber' | 'cyan' | 'violet';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const colors = {
        emerald: 'bg-emerald-400',
        red: 'bg-red-400',
        amber: 'bg-amber-400',
        cyan: 'bg-cyan-400',
        violet: 'bg-violet-400',
    };

    const sizes = {
        sm: 'h-1.5 w-1.5',
        md: 'h-2.5 w-2.5',
        lg: 'h-3.5 w-3.5',
    };

    return (
        <span className={cn("relative flex", sizes[size], className)}>
            <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                colors[color]
            )} />
            <span className={cn(
                "relative inline-flex rounded-full",
                sizes[size],
                colors[color]
            )} />
        </span>
    );
}

// Shimmer effect for loading states
export function Shimmer({ className }: { className?: string }) {
    return (
        <div className={cn(
            "relative overflow-hidden",
            "before:absolute before:inset-0",
            "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
            "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
            className
        )} />
    );
}

// Hover card with 3D tilt effect
export function TiltCard({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0) rotateY(0)');

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0) rotateY(0)');
    };

    return (
        <div
            ref={cardRef}
            className={cn("transition-transform duration-200", className)}
            style={{ transform }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}

// Animated badge that glows
export function GlowBadge({
    children,
    color = 'cyan',
    className,
}: {
    children: React.ReactNode;
    color?: 'cyan' | 'emerald' | 'amber' | 'red' | 'violet';
    className?: string;
}) {
    const colors = {
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-cyan-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/20',
        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-violet-500/20',
    };

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            "border shadow-lg animate-pulse",
            colors[color],
            className
        )}>
            {children}
        </span>
    );
}

// Typing animation for text
export function TypeWriter({
    text,
    speed = 50,
    className,
    onComplete,
}: {
    text: string;
    speed?: number;
    className?: string;
    onComplete?: () => void;
}) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    return (
        <span className={className}>
            {displayedText}
            <span className="animate-pulse">|</span>
        </span>
    );
}

// Floating animation
export function Float({
    children,
    amplitude = 10,
    duration = 3,
    className,
}: {
    children: React.ReactNode;
    amplitude?: number;
    duration?: number;
    className?: string;
}) {
    return (
        <div
            className={cn("animate-float", className)}
            style={{
                animation: `float ${duration}s ease-in-out infinite`,
            }}
        >
            {children}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-${amplitude}px); }
                }
            `}</style>
        </div>
    );
}
