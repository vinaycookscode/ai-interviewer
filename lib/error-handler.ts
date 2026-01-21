/**
 * Centralized error handling utility.
 * Provides consistent error logging and user feedback.
 */

import { toast } from "sonner";

type ErrorContext = {
    context: string;
    userId?: string;
    metadata?: Record<string, unknown>;
};

/**
 * Handle errors consistently across the application.
 * Logs to console and shows user-friendly toast notification.
 *
 * @param error - The error object
 * @param context - Description of where the error occurred
 * @param options - Additional options for error handling
 */
export function handleError(
    error: unknown,
    context: string,
    options?: {
        showToast?: boolean;
        toastMessage?: string;
        metadata?: Record<string, unknown>;
    }
): void {
    const { showToast = true, toastMessage, metadata } = options ?? {};

    // Extract error message
    const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

    // Log to console with context
    console.error(`[${context}]`, {
        message,
        error,
        timestamp: new Date().toISOString(),
        ...metadata,
    });

    // Show user-friendly toast
    if (showToast) {
        toast.error(toastMessage ?? "Something went wrong. Please try again.");
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (process.env.NODE_ENV === "production") {
    //   captureException(error, { context, metadata });
    // }
}

/**
 * Wrap an async function with error handling.
 * Useful for event handlers and callbacks.
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context: string
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
    return async (...args: Parameters<T>) => {
        try {
            return (await fn(...args)) as ReturnType<T>;
        } catch (error) {
            handleError(error, context);
            return undefined;
        }
    };
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

/**
 * Extract error message safely from unknown error
 */
export function getErrorMessage(error: unknown): string {
    if (isError(error)) return error.message;
    if (typeof error === "string") return error;
    return "An unexpected error occurred";
}
