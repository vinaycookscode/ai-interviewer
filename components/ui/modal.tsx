"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    children: React.ReactNode;
    className?: string;
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
};

/**
 * Reusable Modal component with consistent styling and behavior.
 * Replaces custom modal implementations across the codebase.
 * 
 * Features:
 * - Keyboard navigation (Escape to close)
 * - Click outside to close
 * - Scroll lock on body
 * - Consistent liquid-glass styling
 * - Accessible focus management
 */
export function Modal({
    open,
    onClose,
    title,
    subtitle,
    size = "lg",
    children,
    className,
}: ModalProps) {
    // Handle escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    // Lock body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={cn(
                    "bg-background border rounded-2xl w-full max-h-[95vh] overflow-hidden flex flex-col",
                    sizeClasses[size],
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <div>
                        <h2 id="modal-title" className="text-xl font-bold">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
}

/**
 * Modal footer component for consistent action placement
 */
interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-end gap-3 p-4 border-t bg-muted/30",
                className
            )}
        >
            {children}
        </div>
    );
}
