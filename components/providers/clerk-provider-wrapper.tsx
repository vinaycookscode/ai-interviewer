"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ClerkProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const { resolvedTheme } = useTheme();

    return (
        <ClerkProvider
            afterSignOutUrl="/sign-in"
            appearance={{
                baseTheme: resolvedTheme === "dark" ? dark : undefined,
                variables: {
                    colorPrimary: resolvedTheme === "dark" ? "#8b5cf6" : "#6366f1",
                },
            }}
        >
            {children}
        </ClerkProvider>
    );
}
