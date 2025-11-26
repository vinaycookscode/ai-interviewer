import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, TrendingUp, AlertCircle } from "lucide-react";

interface PersonalityProfile {
    communicationStyle: string;
    confidenceScore: number;
    technicalDepth: string;
    strengths: string[];
    weaknesses: string[];
    cultureFitScore: number;
    summary: string;
}

interface PersonalityCardProps {
    profile: PersonalityProfile | null;
}

export function PersonalityCard({ profile }: PersonalityCardProps) {
    if (!profile) return null;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Culture Fit */}
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Culture Fit
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8 flex-1">
                        <div className="relative h-32 w-32 flex items-center justify-center mb-4">
                            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 128 128">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    className="text-muted-foreground/10"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={351.8}
                                    strokeDashoffset={351.8 - (351.8 * profile.cultureFitScore) / 100}
                                    strokeLinecap="round"
                                    className={`${profile.cultureFitScore >= 80 ? "text-green-500" :
                                        profile.cultureFitScore >= 60 ? "text-yellow-500" : "text-red-500"
                                        } transition-all duration-1000 ease-out`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{profile.cultureFitScore}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground text-center max-w-[200px]">
                            Based on adaptability & collaboration signals
                        </p>
                    </CardContent>
                </Card>

                {/* Core Traits */}
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-500" />
                            Core Traits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 flex-1">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Communication Style</p>
                            <div className="text-sm px-3 py-2 bg-secondary/50 rounded-md text-foreground leading-relaxed">
                                {profile.communicationStyle}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Technical Depth</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={
                                    profile.technicalDepth === "Expert" ? "default" :
                                        profile.technicalDepth === "Intermediate" ? "secondary" : "outline"
                                } className="text-sm px-3 py-1">
                                    {profile.technicalDepth}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Confidence Score</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{profile.confidenceScore}/10</span>
                                    <span className="text-muted-foreground">
                                        {profile.confidenceScore >= 8 ? "High" : profile.confidenceScore >= 5 ? "Moderate" : "Low"}
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${profile.confidenceScore >= 8 ? "bg-green-500" :
                                            profile.confidenceScore >= 5 ? "bg-yellow-500" : "bg-red-500"
                                            }`}
                                        style={{ width: `${(profile.confidenceScore / 10) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Key Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ul className="space-y-3">
                            {profile.strengths.map((strength, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span className="text-foreground/90">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ul className="space-y-3">
                            {profile.weaknesses.map((weakness, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    <span className="text-foreground/90">{weakness}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Summary */}
            <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/40">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg">AI Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {profile.summary}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
