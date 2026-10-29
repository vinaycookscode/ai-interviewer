"use client";

import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { RotateCw } from "lucide-react";
import messages from "../messages/en.json";
import { SystemPage } from "@/components/layout/system-page";
import { errorReference } from "@/lib/error-reference";

/**
 * Shown when the root layout itself fails, so it brings its own html, styles and messages.
 * Same page as app/error.tsx (AIIN-137).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const t = messages.System;
    const code = errorReference(error.digest);

    return (
        <html lang="en">
            <body>
                <NextIntlClientProvider locale="en" messages={messages}>
                    <SystemPage
                        brand={t.brand}
                        homeLabel={t.home}
                        eyebrow={t.error.eyebrow}
                        title={t.error.title}
                        body={t.error.body}
                        primary={{ label: t.error.retry, onClick: reset, icon: <RotateCw className="size-[18px]" aria-hidden="true" /> }}
                        secondary={{ label: t.dashboard, href: "/dashboard" }}
                        reference={code ? t.error.reference.replace("{code}", code) : undefined}
                    />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
