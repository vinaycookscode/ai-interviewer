"use client";

import { useState } from "react";
import { updateInterviewLanguage } from "@/actions/interview";
import { Loader2, Languages } from "lucide-react";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";
import { FocusCard, FocusRoot } from "./session-shell";

const LANGUAGES = [
    { value: "en", label: "English", native: "Default" },
    { value: "hi", label: "Hindi", native: "हिंदी" },
    { value: "mr", label: "Marathi", native: "मराठी" },
    { value: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
    { value: "ta", label: "Tamil", native: "தமிழ்" },
];

interface LanguageSelectorProps {
    interviewId: string;
    onLanguageSelected: (language: string) => void;
}

export function LanguageSelector({ interviewId, onLanguageSelected }: LanguageSelectorProps) {
    const [language, setLanguage] = useState("en");
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            if (language !== 'en') {
                await updateInterviewLanguage(interviewId, language);
            }
            onLanguageSelected(language);
        } catch (error) {
            console.error(error);
            // Even if server update fails, we can continue locally
            onLanguageSelected(language);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FocusRoot>
            <FocusCard>
                <span className="flex size-12 items-center justify-center rounded-full bg-sg-lavender-soft text-sg-lavender-ink">
                    <Languages className="size-6" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-2">
                    <h1 className="font-display sg-soft text-[30px] font-semibold leading-9 sm:text-[34px] sm:leading-10">
                        Which language?
                    </h1>
                    <p className="text-sg-muted">
                        Answer in the language you&apos;re most comfortable in. Questions are read out in it, and your
                        feedback uses it too.
                    </p>
                </div>
                <div role="radiogroup" aria-label="Interview language" className="flex flex-col gap-2">
                    {LANGUAGES.map((option) => {
                        const checked = language === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                onClick={() => setLanguage(option.value)}
                                className={cn(
                                    "flex min-h-12 items-center justify-between gap-3 rounded-2xl border-2 px-4 text-left font-semibold transition-colors",
                                    checked
                                        ? "border-sg-ink bg-[var(--sg-glass-strong)]"
                                        : "border-transparent bg-sg-row hover:bg-sg-chip",
                                    focusRing
                                )}
                            >
                                <span>{option.label}</span>
                                <span className="text-sm font-medium text-sg-muted">{option.native}</span>
                            </button>
                        );
                    })}
                </div>
                <button type="button" onClick={handleContinue} disabled={isLoading} className={cn(coralButton, "h-14 w-full text-[17px]")}>
                    {isLoading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                    Continue
                </button>
            </FocusCard>
        </FocusRoot>
    );
}
