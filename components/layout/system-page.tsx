import Link from "next/link";
import { softGlassFonts } from "@/lib/fonts";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { Mascot, UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { glassButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

type Action = { label: string; href: string } | { label: string; onClick: () => void; icon?: React.ReactNode };

interface SystemPageProps {
    brand: string;
    homeLabel: string;
    eyebrow: string;
    title: string;
    body: string;
    /** The main next step (coral) and an alternative (glass). */
    primary: Action;
    secondary?: Action;
    /** A short code people can quote when they write to us. */
    reference?: string;
}

/**
 * A whole page for a state outside the app (an error, a missing page): U, what happened in plain words,
 * and where to go next. Brings its own Soft Glass root because it renders outside the app shell (AIIN-137).
 */
export function SystemPage({ brand, homeLabel, eyebrow, title, body, primary, secondary, reference }: SystemPageProps) {
    const button = (action: Action, className: string) =>
        "href" in action ? (
            <Link href={action.href} className={className}>
                {action.label}
            </Link>
        ) : (
            <button type="button" onClick={action.onClick} className={className}>
                {action.icon}
                {action.label}
            </button>
        );

    return (
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <div className="relative mx-auto flex min-h-screen max-w-[1160px] flex-col gap-6 px-4 pt-4 pb-10 sm:px-8">
                <header className="sg-bar flex items-center justify-between gap-3 rounded-full py-2 pr-2 pl-3.5">
                    <Link href="/" aria-label={homeLabel} className={cn("flex items-center gap-2.5 rounded-full", focusRing)}>
                        <UMark className="size-[30px]" />
                        <span className="font-display sg-soft text-lg font-semibold whitespace-nowrap">{brand}</span>
                    </Link>
                    <ThemeSwitch />
                </header>
                <main className="flex flex-1 items-center justify-center py-8 sm:py-24">
                    <div className="flex max-w-[560px] flex-col items-center gap-4 text-center">
                        <Mascot className="size-24" />
                        <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{eyebrow}</span>
                        <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{title}</h1>
                        <p className="text-lg leading-[30px] text-pretty text-sg-muted">{body}</p>
                        <div className="mt-2 flex w-full flex-wrap justify-center gap-3">
                            {button(primary, cn(coralButton, "h-14 max-w-[280px] flex-[1_1_220px] px-6 text-[17px]"))}
                            {secondary && button(secondary, cn(glassButton, "h-14 max-w-[260px] flex-[1_1_200px]"))}
                        </div>
                        {reference && (
                            <span className="mt-1 inline-flex h-[30px] items-center rounded-full bg-sg-chip px-3 text-[13px] font-bold text-sg-muted">{reference}</span>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
