"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";

// Carried between login and sign-up so a picked plan or an interview invitation survives the switch.
// Nothing else is: a reset link's token must not follow the visitor to the login page.
const KEPT_PARAMS = ["plan", "selected", "period", "callbackUrl"];

interface BackButtonProps {
    href: string;
    label: string;
    prompt?: string;
}

export const BackButton = ({ href, label, prompt }: BackButtonProps) => {
    const searchParams = useSearchParams();

    const kept = new URLSearchParams();
    for (const key of KEPT_PARAMS) {
        const value = searchParams.get(key);
        if (value) kept.set(key, value);
    }
    const preservedHref = kept.size ? `${href}?${kept.toString()}` : href;

    return (
        <p className="mt-6 text-center text-[15px] text-sg-muted">
            {prompt && <>{prompt} </>}
            <Link href={preservedHref} className={cn("rounded font-bold text-sg-text underline-offset-4 hover:underline", focusRing)}>
                {label}
            </Link>
        </p>
    );
};
