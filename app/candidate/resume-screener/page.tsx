"use client";

import { useState, useTransition } from "react";
import { analyzeResume } from "@/actions/resume-screener";
import { ResumeAnalysisView } from "@/components/candidate/resume-analysis-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ResumeScreenerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState<any | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf") {
                toast.error("Please upload a PDF file");
                return;
            }
            setFile(selectedFile);
            setAnalysis(null); // Reset analysis when new file selected
        }
    };

    const handleAnalyze = () => {
        if (!file) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file);
            if (jobDescription.trim()) {
                formData.append("jobDescription", jobDescription);
            }

            const result = await analyzeResume(formData);

            if (result.error) {
                toast.error(result.error);
            } else if (result.success && result.analysis) {
                setAnalysis(result.analysis);
                toast.success("Resume analyzed successfully!");
            }
        });
    };

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">AI Resume Screener & Enhancer</h1>
                <p className="text-muted-foreground">
                    Upload your resume and optionally paste a job description to get a tailored analysis, match score, and cover letter.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resume Analysis</CardTitle>
                    <CardDescription>
                        Upload your resume (PDF) and verify against a Job Description.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="resume">Resume (PDF)</Label>
                        <Input
                            id="resume"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={isPending}
                        />
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50 w-full sm:w-auto">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-medium truncate flex-1">
                                {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label htmlFor="jd" className="flex items-center gap-2">
                            Job Description (Optional)
                            <span className="text-xs text-muted-foreground font-normal">(Paste to get Match Score & Cover Letter)</span>
                        </Label>
                        <Textarea
                            id="jd"
                            placeholder="Paste the job description here..."
                            className="min-h-[150px]"
                            value={jobDescription}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    <Button
                        onClick={handleAnalyze}
                        disabled={!file || isPending}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {jobDescription.trim() ? "Analyzing Match..." : "Analyzing Resume..."}
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                {jobDescription.trim() ? "Analyze & Match" : "Analyze Resume"}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {isPending && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-500">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">
                        {jobDescription.trim() ? "AI is comparing your resume against the JD..." : "AI is reading your resume..."}
                    </p>
                </div>
            )}

            {!isPending && analysis && (
                <ResumeAnalysisView analysis={analysis} />
            )}
        </div>
    );
}
