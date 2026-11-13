"use client";

import { useTranslations } from "next-intl";
import { AUTH_ACTION_HREF, AUTH_ERRORS, type AuthErrorCode } from "@/lib/auth-errors";
import { FormError } from "@/components/auth/form-error";

/** A sign-in or sign-up error code as its message, colour and next step (AIIN-57). */
export function AuthError({ code }: { code: AuthErrorCode | null }) {
    const t = useTranslations("Auth.errors");
    if (!code) return null;
    const look: { tone: "danger" | "calm"; action?: keyof typeof AUTH_ACTION_HREF } = AUTH_ERRORS[code];
    return (
        <FormError
            message={t(code)}
            tone={look.tone}
            action={look.action ? { label: t(`actions.${look.action}`), href: AUTH_ACTION_HREF[look.action] } : undefined}
        />
    );
}
