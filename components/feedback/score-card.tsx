import { cn } from "@/lib/utils";

interface ScoreCardProps {
    score: number | null;
}

export function ScoreCard({ score }: ScoreCardProps) {
    if (score === null) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-2xl font-semibold mb-6">Overall Score</h3>
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-3">
                            <span className="text-4xl">⏳</span>
                        </div>
                        <p className="text-muted-foreground">Scoring in progress...</p>
                    </div>
                </div>
            </div>
        );
    }

    const formattedScore = score.toFixed(1);
    const percentage = (score / 10) * 100;

    let colorClass = "text-yellow-600";
    let bgClass = "bg-yellow-500";
    let borderClass = "border-yellow-200";

    if (score >= 8) {
        colorClass = "text-green-600";
        bgClass = "bg-green-500";
        borderClass = "border-green-200";
    } else if (score < 5) {
        colorClass = "text-red-600";
        bgClass = "bg-red-500";
        borderClass = "border-red-200";
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h3 className="text-2xl font-semibold mb-6">Overall Score</h3>
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4">
                    {/* Background circle */}
                    {/* Background circle */}
                    <svg className="w-full h-full" viewBox="0 0 160 160">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-muted-foreground/20"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 70}`}
                            strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
                            className={cn("transition-all duration-1000 origin-center -rotate-90", colorClass)}
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Score text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("text-5xl font-bold", colorClass)}>
                            {formattedScore}
                        </span>
                        <span className="text-sm text-muted-foreground">out of 10</span>
                    </div>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-xs font-medium mt-2", bgClass, "text-white")}>
                    {score >= 8 ? "Excellent" : score >= 5 ? "Good" : "Needs Improvement"}
                </div>
            </div>
        </div>
    );
}
