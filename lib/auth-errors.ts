// What went wrong on sign-in or sign-up, as a code the forms turn into a message (AIIN-57). Plain module: shared by
// the server actions and the client forms.

export const AUTH_ERRORS = {
    WRONG_PASSWORD: { tone: "danger", action: "reset" },
    NO_ACCOUNT: { tone: "danger", action: "register" },
    TOO_MANY: { tone: "calm", action: "reset" },
    INVITED: { tone: "calm" },
    UNAVAILABLE: { tone: "calm" },
    EMAIL_TAKEN: { tone: "danger", action: "login" },
    PENDING_INVITE: { tone: "calm" },
    WEAK_PASSWORD: { tone: "danger" },
    INVALID: { tone: "danger" },
} as const satisfies Record<string, { tone: "danger" | "calm"; action?: "reset" | "register" | "login" }>;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

/** Where each error's next step goes. */
export const AUTH_ACTION_HREF = { reset: "/auth/forgot-password", register: "/auth/register", login: "/auth/login" } as const;

export function isAuthErrorCode(v: unknown): v is AuthErrorCode {
    return typeof v === "string" && v in AUTH_ERRORS;
}
