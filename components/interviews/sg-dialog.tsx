"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { softGlassFonts } from "@/lib/fonts";
import { focusRing } from "@/components/soft-glass/classes";

// Dialogs render in a portal outside the page's `.soft-glass` root, so the overlay and the panel
// each opt in to the tokens themselves.
const overlayClass =
    "soft-glass fixed inset-0 z-50 backdrop-blur-[6px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
const overlayStyle: React.CSSProperties = { background: "color-mix(in srgb, var(--sg-bg) 72%, transparent)" };

const panelClass = cn(
    softGlassFonts,
    "soft-glass fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-[18px] overflow-y-auto rounded-[28px] border border-sg-glass-border p-5 text-base leading-6 shadow-[var(--sg-shadow-lg)] outline-none sm:p-7",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
);

export const dialogTitleClass = "font-display sg-soft text-[22px] leading-7 font-semibold";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

interface DialogPanelProps extends Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title"> {
    title: React.ReactNode;
    /** Shown under the title and read as the dialog's description. */
    description?: React.ReactNode;
    closeLabel: string;
}

/** A Soft Glass dialog panel with its title row and close button. */
export function DialogPanel({ title, description, closeLabel, className, children, ...props }: DialogPanelProps) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className={overlayClass} style={overlayStyle} />
            <DialogPrimitive.Content
                // Without a description, opt out explicitly so Radix doesn't warn.
                {...(description ? {} : { "aria-describedby": undefined })}
                className={cn(panelClass, "max-w-[460px]", className)}
                {...props}
            >
                <div className="flex items-center justify-between gap-2">
                    <DialogPrimitive.Title className={dialogTitleClass}>{title}</DialogPrimitive.Title>
                    <DialogPrimitive.Close
                        aria-label={closeLabel}
                        className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}
                    >
                        <X className="size-5" aria-hidden="true" />
                    </DialogPrimitive.Close>
                </div>
                {description && <DialogPrimitive.Description className="-mt-2 text-sg-muted">{description}</DialogPrimitive.Description>}
                {children}
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

interface AlertDialogPanelProps extends Omit<React.ComponentProps<typeof AlertDialogPrimitive.Content>, "title"> {
    title: React.ReactNode;
    description: React.ReactNode;
}

/** A Soft Glass confirmation panel. Put the Cancel and Action buttons in `children`. */
export function AlertDialogPanel({ title, description, className, children, ...props }: AlertDialogPanelProps) {
    return (
        <AlertDialogPrimitive.Portal>
            <AlertDialogPrimitive.Overlay className={overlayClass} style={overlayStyle} />
            <AlertDialogPrimitive.Content className={cn(panelClass, "max-w-[460px]", className)} {...props}>
                <AlertDialogPrimitive.Title className={dialogTitleClass}>{title}</AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="text-sg-muted">{description}</AlertDialogPrimitive.Description>
                <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">{children}</div>
            </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
    );
}
