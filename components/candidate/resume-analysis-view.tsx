"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Wand2, Loader2, FileText, Copy, Check } from "lucide-react";
import { rewriteResume, generateCoverLetter } from "@/actions/resume-screener";
import { ResumeDownloader } from "./resume-downloader";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("ResumeAnalysis");
    const tCommon = useTranslations("Common");
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

    const handleRewrite = async () => {
        if (!analysis.resumeText) {
            toast.error(t("toast.missingResume"));
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
                toast.success(t("toast.success"));
            }
        } catch (error) {
            toast.error(t("toast.error"));
        } finally {
            setIsRewriting(false);
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (!analysis.resumeText || !analysis.jobDescription) {
            toast.error(t("toast.missingResume"));
            return;
        }

        setIsGeneratingCoverLetter(true);
        try {
            const result = await generateCoverLetter(analysis.resumeText, analysis.jobDescription);
            if (result.error) {
                toast.error(result.error);
            } else if (result.coverLetter) {
                setCoverLetter(result.coverLetter);
                toast.success(t("toast.clSuccess"));
            }
        } catch (error) {
            toast.error(t("toast.clError"));
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    const copyCoverLetter = () => {
        if (coverLetter) {
            navigator.clipboard.writeText(coverLetter);
            setHasCopiedCL(true);
            setTimeout(() => setHasCopiedCL(false), 2000);
            toast.success(t("toast.copied"));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {analysis.matchScore ? t("metrics.jdMatchScore") : t("metrics.atsScore")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${getScoreColor(analysis.matchScore || analysis.atsScore)}`}>
                                {analysis.matchScore || analysis.atsScore}
                            </span>
                            <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                        {analysis.matchScore && (
                            <p className="text-xs text-muted-foreground mt-1">{t("metrics.basedOnJd")}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("metrics.keyFindings")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{t("metrics.strengthsCount", { count: analysis.strengths.length })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{t("metrics.weaknessesCount", { count: analysis.weaknesses.length })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("metrics.executiveSummary")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
                            {analysis.summary}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
                    <TabsTrigger value="analysis">{t("tabs.analysis")}</TabsTrigger>
                    <TabsTrigger value="cover-letter">{t("tabs.coverLetter")}</TabsTrigger>
                    <TabsTrigger value="rewrite">{t("tabs.rewrite")}</TabsTrigger>
                </TabsList>

                {/* Tab 1: Detailed Analysis */}
                <TabsContent value="analysis" className="space-y-4 mt-4">
                    {/* Missing Keywords Alert */}
                    {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader className="py-3">
                                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    {t("missingKeywords")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-3">
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingKeywords.map((keyword, i) => (
                                        <Badge key={i} variant="outline" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    {t("strengths")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.strengths.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    {t("weaknesses")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.weaknesses.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    {t("formatting.title")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analysis.formattingIssues.length > 0 ? (
                                    <ul className="space-y-2">
                                        {analysis.formattingIssues.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <Check className="h-4 w-4" /> {t("formatting.noIssues")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-blue-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-blue-600 dark:text-blue-400">
                                    <Lightbulb className="h-5 w-5" />
                                    {t("tips")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.improvementTips.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                                {i + 1}
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Cover Letter */}
                <TabsContent value="cover-letter" className="mt-4">
                    <Card className="min-h-[400px]">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{t("coverLetter.title")}</span>
                                {coverLetter && (
                                    <Button variant="outline" size="sm" onClick={copyCoverLetter}>
                                        {hasCopiedCL ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                        {hasCopiedCL ? t("coverLetter.copied") : t("coverLetter.copy")}
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!analysis.jobDescription ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="p-4 rounded-full bg-yellow-500/10">
                                        <AlertCircle className="h-12 w-12 text-yellow-500" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-medium">{t("coverLetter.jdRequired")}</h3>
                                        <p className="text-sm text-muted-foreground max-sm mx-auto">
                                            {t("coverLetter.jdRequiredDesc")}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t("coverLetter.jdRequiredNote")}
                                    </p>
                                </div>
                            ) : !coverLetter ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <FileText className="h-16 w-16 text-muted-foreground/20" />
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-medium">{t("coverLetter.readyTitle")}</h3>
                                        <p className="text-sm text-muted-foreground max-sm mx-auto">
                                            {t("coverLetter.readyDesc")}
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        onClick={handleGenerateCoverLetter}
                                        disabled={isGeneratingCoverLetter}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {isGeneratingCoverLetter ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("coverLetter.writing")}
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                {t("coverLetter.generate")}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-6 bg-muted/30 rounded-lg border text-sm leading-relaxed font-sans whitespace-pre-wrap">
                                    <ReactMarkdown>{coverLetter}</ReactMarkdown>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Resume Rewrite */}
                <TabsContent value="rewrite" className="mt-4">
                    <div className="space-y-4">
                        {!rewrittenResume ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("rewrite.title")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        {t("rewrite.description")}
                                    </p>
                                    <Textarea
                                        placeholder={t("rewrite.customPlaceholder")}
                                        value={customInstructions}
                                        onChange={(e) => setCustomInstructions(e.target.value)}
                                        className="bg-background min-h-[100px]"
                                    />
                                    <Button
                                        size="lg"
                                        onClick={handleRewrite}
                                        disabled={isRewriting}
                                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                    >
                                        {isRewriting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("rewrite.rewriting")}
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                {t("rewrite.submit")}
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-green-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-green-600 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5" />
                                            {t("rewrite.complete")}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">{t("rewrite.predictedScore", { score: rewrittenResume.score })}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <ResumeDownloader content={rewrittenResume.content} />
                                        <Button variant="ghost" onClick={() => setRewrittenResume(null)}>{t("rewrite.back")}</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-6 bg-background rounded-md border text-sm max-h-[600px] overflow-y-auto font-sans prose dark:prose-invert max-w-none">
                                        <ReactMarkdown>{rewrittenResume.content}</ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
