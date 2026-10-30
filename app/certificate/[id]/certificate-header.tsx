import Link from "next/link";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

export function CertificateHeader({ brand, home }: { brand: string; home: string }) {
    return (
        <header className="sg-bar flex items-center justify-between gap-3 rounded-[28px] py-2 pr-2 pl-3.5">
            <Link href="/" aria-label={home} className={cn("flex items-center gap-2.5 rounded-full", focusRing)}>
                <UMark className="size-[30px]" />
                <span className="font-display sg-soft text-lg font-semibold whitespace-nowrap">{brand}</span>
            </Link>
            <ThemeSwitch />
        </header>
    );
}
