/**
 * Protected action utilities for server actions.
 * Ensures consistent authentication checks across all actions.
 */

import { auth } from "@/auth";
import { ActionResult } from "@/types";

/**
 * Wrap a server action to require authentication.
 * Automatically injects userId and handles auth errors.
 *
 * @example
 * ```ts
 * export const getMyData = protectedAction(async (userId) => {
 *   const data = await db.data.findMany({ where: { userId } });
 *   return { success: true, data };
 * });
 * ```
 */
export function protectedAction<TResult>(
    action: (userId: string) => Promise<ActionResult<TResult>>
): () => Promise<ActionResult<TResult>> {
    return async () => {
        const session = await auth();

        if (!session?.user?.id) {
            return {
                success: false,
                error: "You must be logged in to perform this action.",
            };
        }

        try {
            return await action(session.user.id);
        } catch (error) {
            console.error("[protectedAction]", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "An error occurred",
            };
        }
    };
}

/**
 * Protected action with parameters.
 * Passes both userId and additional parameters to the action.
 */
export function protectedActionWithParams<TParams, TResult>(
    action: (userId: string, params: TParams) => Promise<ActionResult<TResult>>
): (params: TParams) => Promise<ActionResult<TResult>> {
    return async (params: TParams) => {
        const session = await auth();

        if (!session?.user?.id) {
            return {
                success: false,
                error: "You must be logged in to perform this action.",
            };
        }

        try {
            return await action(session.user.id, params);
        } catch (error) {
            console.error("[protectedActionWithParams]", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "An error occurred",
            };
        }
    };
}

/**
 * Check if user has required role.
 */
export function requireRole<TResult>(
    role: "ADMIN" | "EMPLOYER" | "CANDIDATE",
    action: (userId: string) => Promise<ActionResult<TResult>>
): () => Promise<ActionResult<TResult>> {
    return async () => {
        const session = await auth();

        if (!session?.user?.id) {
            return {
                success: false,
                error: "You must be logged in to perform this action.",
            };
        }

        // @ts-ignore - role is added via session callback
        if (session.user.role !== role && session.user.role !== "ADMIN") {
            return {
                success: false,
                error: "You do not have permission to perform this action.",
            };
        }

        try {
            return await action(session.user.id);
        } catch (error) {
            console.error("[requireRole]", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "An error occurred",
            };
        }
    };
}
