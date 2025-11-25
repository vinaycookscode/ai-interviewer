"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Wand2, Loader2, ArrowRight } from "lucide-react";
import { rewriteResume } from "@/actions/resume-screener";
import { ResumePdfGenerator } from "./resume-pdf-generator";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AnalysisResult {
    atsScore: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    formattingIssues: string[];
    improvementTips: string[];
    resumeText?: string; // We need the original text to rewrite it
}

interface ResumeAnalysisViewProps {
    analysis: AnalysisResult;
}

export function ResumeAnalysisView({ analysis }: ResumeAnalysisViewProps) {
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewrittenResume, setRewrittenResume] = useState<{ content: string; score: number } | null>(null);
    const [customInstructions, setCustomInstructions] = useState("");

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    const handleRewrite = async () => {
        if (!analysis.resumeText) {
            toast.error("Original resume text is missing. Please upload again.");
            return;
        }

        setIsRewriting(true);
        try {
            const result = await rewriteResume(analysis.resumeText, analysis, customInstructions);
            if (result.error) {
                toast.error(result.error);
            } else {
                setRewrittenResume({
                    content: result.rewrittenContent,
                    score: result.predictedATSScore
                });
                toast.success("Resume rewritten successfully!");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsRewriting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score Card */}
            <Card>
                <CardHeader>
                    <CardTitle>ATS Compatibility Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-muted">
                        <div className={`absolute inset-0 rounded-full border-8 border-transparent border-t-${getScoreBg(analysis.atsScore).replace("bg-", "")} opacity-20`}></div>
                        <div className="text-center">
                            <span className={`text-5xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                                {analysis.atsScore}
                            </span>
                            <span className="text-sm text-muted-foreground block mt-1">/ 100</span>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-muted-foreground max-w-md">
                        {analysis.summary}
                    </p>
                </CardContent>
            </Card>

            {/* Rewrite Action - HIDDEN FOR NOW */}
            {/*
            {!rewrittenResume && (
                <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-600">
                            <Wand2 className="h-5 w-5" />
                            AI Resume Rewrite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Want to improve your resume? Our AI can rewrite it for you, fixing issues and applying best practices. You can also give specific instructions.
                        </p>
                        <Textarea
                            placeholder="Optional: Add custom instructions (e.g., 'Focus on my leadership experience', 'Make it more concise', 'Target a Senior Developer role')..."
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            className="bg-background"
                        />
                        <Button
                            size="lg"
                            onClick={handleRewrite}
                            disabled={isRewriting}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transition-all hover:scale-[1.02]"
                        >
                            {isRewriting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    AI is rewriting your resume...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-5 w-5" />
                                    Fix My Resume with AI
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
            */}

            {/* Rewritten Resume Result */}
            {rewrittenResume && (
                <Card className="border-purple-500/50 bg-purple-500/5 overflow-hidden">
                    <CardHeader className="bg-purple-500/10 border-b border-purple-500/20">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wand2 className="h-5 w-5 text-purple-600" />
                                Improved Resume Ready!
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Predicted Score:</span>
                                <span className="font-bold text-green-600 text-lg">{rewrittenResume.score}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Your resume has been rewritten to address the identified issues, improve formatting, and highlight your strengths.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <ResumePdfGenerator content={rewrittenResume.content} />
                            <Button variant="outline" onClick={() => setRewrittenResume(null)}>
                                Close Preview
                            </Button>
                        </div>
                        <div className="mt-4 p-4 bg-background rounded-md border text-sm max-h-96 overflow-y-auto font-sans prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{rewrittenResume.content}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Strengths */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Key Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.strengths.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.weaknesses.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Formatting Issues */}
            {analysis.formattingIssues.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            Formatting Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.formattingIssues.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Improvement Tips */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Lightbulb className="h-5 w-5" />
                        Actionable Tips
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {analysis.improvementTips.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                    {i + 1}
                                </div>
                                <span className="pt-0.5">{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
