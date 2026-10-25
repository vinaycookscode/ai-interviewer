import { cn } from "@/lib/utils";

// The "U" body, drawn on a 64×64 grid.
const U_PATH =
    "M12 14c0-3 2-5 5-5h4c3 0 5 2 5 5v20c0 4 3 7 6 7s6-3 6-7V14c0-3 2-5 5-5h4c3 0 5 2 5 5v20c0 12-9 21-20 21S12 46 12 34z";

interface MascotProps {
    className?: string;
    /** Accessible name; omit when the mascot is decorative. */
    label?: string;
    /** Smile and blush. The logo mark leaves them off. */
    expressive?: boolean;
}

/** U, the coach. A "U" with a face, in the coral accent. */
export function Mascot({ className, label, expressive = true }: MascotProps) {
    const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

    return (
        <svg viewBox="0 0 64 64" className={cn("size-12 shrink-0", className)} {...a11y}>
            <path d={U_PATH} className="fill-sg-coral" />
            {expressive && (
                <path d="M16 17c0-2 1-3 3-3h2" className="stroke-white/60" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            )}
            <circle cx="24" cy="30" r="2.6" className="fill-sg-coral-ink" />
            <circle cx="40" cy="30" r="2.6" className="fill-sg-coral-ink" />
            {expressive && (
                <>
                    <circle cx="24.9" cy="29.1" r="0.9" className="fill-white" />
                    <circle cx="40.9" cy="29.1" r="0.9" className="fill-white" />
                    <ellipse cx="18.5" cy="36.5" rx="3" ry="1.8" className="fill-white/35" />
                    <ellipse cx="45.5" cy="36.5" rx="3" ry="1.8" className="fill-white/35" />
                    <path d="M27 38c3 3 7 3 10 0" className="stroke-sg-coral-ink" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </>
            )}
        </svg>
    );
}

/** Logo mark: the mascot without its expression. */
export function UMark({ className }: { className?: string }) {
    return <Mascot expressive={false} className={cn("size-8", className)} />;
}
