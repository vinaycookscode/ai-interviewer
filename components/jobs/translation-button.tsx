"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";

const LANGUAGES = ["Hindi", "Marathi", "Tamil", "Kannada", "English", "Spanish"];

interface TranslationButtonProps {
    onTranslate: (language: string) => Promise<void>;
}

/** "Translate to…" for the job description. A native select, so it works inside any surface. */
export function TranslationButton({ onTranslate }: TranslationButtonProps) {
    const t = useTranslations("Employer.form");
    const [isLoading, setIsLoading] = useState(false);

    async function handleChange(lang: string) {
        if (!lang) return;
        setIsLoading(true);
        try {
            await onTranslate(lang);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <span className="relative inline-flex items-center">
            {isLoading ? (
                <Loader2 className="pointer-events-none absolute left-3 size-4 animate-spin" aria-hidden="true" />
            ) : (
                <Languages className="pointer-events-none absolute left-3 size-4" aria-hidden="true" />
            )}
            <label htmlFor="jf-translate" className="sr-only">
                {t("translate")}
            </label>
            <select
                id="jf-translate"
                value=""
                disabled={isLoading}
                onChange={(e) => handleChange(e.target.value)}
                className={cn(
                    "h-10 appearance-none rounded-full border border-sg-field-border bg-transparent pr-4 pl-9 text-sm font-semibold text-sg-text disabled:opacity-60",
                    focusRing
                )}
            >
                <option value="">{isLoading ? t("translating") : t("translate")}</option>
                {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                        {lang}
                    </option>
                ))}
            </select>
        </span>
    );
}
