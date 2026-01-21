"use client";

import { useState } from "react";
import { Loader2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleError } from "@/lib/error-handler";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
    /** Async action to perform on click */
    action: () => Promise<void>;
    /** Icon to display before text */
    icon?: LucideIcon;
    /** Text to show while loading */
    loadingText?: string;
    /** If provided, shows confirmation dialog before action */
    confirmTitle?: string;
    /** Description in confirmation dialog */
    confirmDescription?: string;
    /** Custom confirm button text */
    confirmText?: string;
    /** Custom cancel button text */
    cancelText?: string;
    /** Called after successful action */
    onSuccess?: () => void;
    /** Called after action fails */
    onActionError?: (error: Error) => void;
    /** Context for error logging */
    errorContext?: string;
}

/**
 * Action button with built-in loading state, error handling, and optional confirmation.
 * Reduces boilerplate across delete buttons, submit buttons, etc.
 *
 * @example
 * ```tsx
 * // Simple action
 * <ActionButton action={handleSave} icon={Save}>Save</ActionButton>
 *
 * // With confirmation
 * <ActionButton
 *   action={handleDelete}
 *   variant="destructive"
 *   confirmTitle="Delete Item?"
 *   confirmDescription="This action cannot be undone."
 * >
 *   Delete
 * </ActionButton>
 * ```
 */
export function ActionButton({
    action,
    icon: Icon,
    loadingText,
    confirmTitle,
    confirmDescription,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onSuccess,
    onActionError,
    errorContext = "ActionButton",
    children,
    disabled,
    className,
    ...props
}: ActionButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const needsConfirmation = !!confirmTitle;

    const executeAction = async () => {
        setIsLoading(true);
        try {
            await action();
            onSuccess?.();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            handleError(err, errorContext);
            onActionError?.(err);
        } finally {
            setIsLoading(false);
            setShowConfirm(false);
        }
    };

    const handleClick = () => {
        if (needsConfirmation) {
            setShowConfirm(true);
        } else {
            executeAction();
        }
    };

    return (
        <>
            <Button
                onClick={handleClick}
                disabled={disabled || isLoading}
                className={cn(className)}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {Icon && <Icon className="h-4 w-4 mr-2" />}
                        {children}
                    </>
                )}
            </Button>

            {needsConfirmation && (
                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                            {confirmDescription && (
                                <AlertDialogDescription>
                                    {confirmDescription}
                                </AlertDialogDescription>
                            )}
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>
                                {cancelText}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={executeAction} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {loadingText || confirmText}
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
