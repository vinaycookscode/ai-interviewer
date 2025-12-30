"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Wand2, Loader2, ArrowRight, FileText, Copy, Check } from "lucide-react";
import { rewriteResume, generateCoverLetter } from "@/actions/resume-screener";
import { ResumePdfGenerator } from "./resume-pdf-generator";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AnalysisResult {
    atsScore: number;
    matchScore?: number | null; // New field
    summary: string;
    strengths: string[];
    weaknesses: string[];
    formattingIssues: string[];
    improvementTips: string[];
    missingKeywords?: string[]; // New field
    resumeText?: string;
    jobDescription?: string; // New field
}

interface ResumeAnalysisViewProps {
    analysis: AnalysisResult;
}

export function ResumeAnalysisView({ analysis }: ResumeAnalysisViewProps) {
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewrittenResume, setRewrittenResume] = useState<{ content: string; score: number } | null>(null);
    const [customInstructions, setCustomInstructions] = useState("");

    // Cover Letter State
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
    const [coverLetter, setCoverLetter] = useState<string | null>(null);
    const [hasCopiedCL, setHasCopiedCL] = useState(false);

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

    const handleGenerateCoverLetter = async () => {
        if (!analysis.resumeText || !analysis.jobDescription) {
            toast.error("Missing Resume or Job Description.");
            return;
        }

        setIsGeneratingCoverLetter(true);
        try {
            const result = await generateCoverLetter(analysis.resumeText, analysis.jobDescription);
            if (result.error) {
                toast.error(result.error);
            } else if (result.coverLetter) {
                setCoverLetter(result.coverLetter);
                toast.success("Cover Letter Generated!");
            }
        } catch (error) {
            toast.error("Failed to generate cover letter.");
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    const copyCoverLetter = () => {
        if (coverLetter) {
            navigator.clipboard.writeText(coverLetter);
            setHasCopiedCL(true);
            setTimeout(() => setHasCopiedCL(false), 2000);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* ATS Score */}
                <Card>
                    <CardHeader>
                        <CardTitle>{analysis.matchScore ? "Target Job Match Score" : "General ATS Score"}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-muted">
                            <div className={`absolute inset-0 rounded-full border-8 border-transparent border-t-${getScoreBg(analysis.matchScore || analysis.atsScore).replace("bg-", "")} opacity-20`}></div>
                            <div className="text-center">
                                <span className={`text-5xl font-bold ${getScoreColor(analysis.matchScore || analysis.atsScore)}`}>
                                    {analysis.matchScore || analysis.atsScore}
                                </span>
                                <span className="text-sm text-muted-foreground block mt-1">/ 100</span>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-muted-foreground max-w-md">
                            {analysis.summary}
                        </p>
                    </CardContent>
                </Card>

                {/* Missing Keywords (if JD provided) */}
                {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                Missing Keywords
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                These important keywords found in the Job Description are missing from your resume:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {analysis.missingKeywords.map((keyword, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium dark:bg-red-900/50 dark:text-red-200">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Cover Letter Generator Section */}
            {analysis.jobDescription && !coverLetter && (
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        onClick={handleGenerateCoverLetter}
                        disabled={isGeneratingCoverLetter}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isGeneratingCoverLetter ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Writing Cover Letter...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate Tailored Cover Letter
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Display Generated Cover Letter */}
            {coverLetter && (
                <Card className="border-indigo-500/20 bg-indigo-500/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-indigo-600">
                            <FileText className="h-5 w-5" />
                            Tailored Cover Letter
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={copyCoverLetter}>
                            {hasCopiedCL ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            {hasCopiedCL ? "Copied" : "Copy Text"}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-background rounded-md border text-sm max-h-96 overflow-y-auto font-sans prose dark:prose-invert max-w-none shadow-inner">
                            <ReactMarkdown>{coverLetter}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}

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
