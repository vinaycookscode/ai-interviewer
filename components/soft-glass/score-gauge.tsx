import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
    /** Score out of 10. */
    value: number;
    className?: string;
    /** Show the number inside the arc. */
    showValue?: boolean;
    /** Colour of the filled arc; use a deeper tone on tinted surfaces. */
    arcClassName?: string;
}

const RADIUS = 80;
const ARC = Math.PI * RADIUS;

/** A soft half-ring for a score out of 10. */
export function ScoreGauge({ value, className, showValue = true, arcClassName }: ScoreGaugeProps) {
    const clamped = Math.max(0, Math.min(10, value));
    const filled = (clamped / 10) * ARC;

    return (
        <svg
            viewBox="0 0 200 112"
            role="img"
            aria-label={`Score ${clamped.toFixed(1)} out of 10`}
            className={cn("w-48", className)}
        >
            <path d="M20 100a80 80 0 0 1 160 0" fill="none" strokeWidth="16" strokeLinecap="round" className="stroke-sg-track" />
            <path
                d="M20 100a80 80 0 0 1 160 0"
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${ARC}`}
                className={cn("stroke-sg-lavender", arcClassName)}
            />
            {showValue && (
                <text x="100" y="96" textAnchor="middle" className="fill-sg-text font-display text-[40px] font-semibold">
                    {clamped.toFixed(1)}
                </text>
            )}
        </svg>
    );
}
