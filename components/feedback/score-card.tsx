import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
    score: number | null;
}

export function ScoreCard({ score }: ScoreCardProps) {
    if (score === null) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Overall Score</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-3">
                            <span className="text-4xl">⏳</span>
                        </div>
                        <p className="text-muted-foreground">Scoring in progress...</p>
                    </div>
                </CardContent>
            </Card>
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
        <Card className={cn("border-2", borderClass)}>
            <CardHeader>
                <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative w-40 h-40 mb-4">
                    {/* Background circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-muted/20"
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
                            className={cn("transition-all duration-1000", colorClass)}
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
                <div className={cn("px-4 py-2 rounded-full text-sm font-medium", bgClass, "text-white")}>
                    {score >= 8 ? "Excellent" : score >= 5 ? "Good" : "Needs Improvement"}
                </div>
            </CardContent>
        </Card>
    );
}
