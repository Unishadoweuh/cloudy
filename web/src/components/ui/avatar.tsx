"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarStatus = "loading" | "error" | "loaded"

const AvatarContext = React.createContext<{
    status: AvatarStatus
    setStatus: (status: AvatarStatus) => void
} | null>(null)

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const [status, setStatus] = React.useState<AvatarStatus>("error") // Default to error to show fallback immediately if no image

    return (
        <AvatarContext.Provider value={{ status, setStatus }}>
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </AvatarContext.Provider>
    )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    React.useLayoutEffect(() => {
        if (!src) {
            context?.setStatus("error")
            return
        }
        context?.setStatus("loading")
        const img = new Image()
        if (typeof src === 'string') {
            img.src = src
        }
        img.onload = () => context?.setStatus("loaded")
        img.onerror = () => context?.setStatus("error")
    }, [src, context])

    // Only render if we have a src and status is loaded (avoid flickering or broken icons)
    // Actually, we can return null if status is not loaded?
    // Use opacity to handle transition?
    // Simpler: If status === 'loaded', show. Else hidden?

    if (!context) return null

    return (
        <img
            ref={ref}
            src={src}
            className={cn(
                "aspect-square h-full w-full",
                className,
                context.status === "loaded" ? "block" : "hidden"
            )}
            {...props}
        />
    )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (context && context.status === "loaded") {
        return null
    }

    return (
        <div
            ref={ref}
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-slate-800 text-slate-400",
                className
            )}
            {...props}
        />
    )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
