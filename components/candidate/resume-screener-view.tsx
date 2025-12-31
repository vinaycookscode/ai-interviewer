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

export function ResumeScreenerView() {
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
        <div className="w-full p-6 h-[calc(100vh-20px)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Left Side: Upload & Inputs */}
                <div className="space-y-4 lg:overflow-y-auto lg:pr-4 h-full scrollbar-none">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">AI Resume Screener</h1>
                        <p className="text-sm text-muted-foreground">
                            Upload your resume and optionally paste a job description.
                        </p>
                    </div>

                    <Card className="border-2 border-dashed shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Upload Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="resume">Resume (PDF)</Label>
                                <div className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-center cursor-pointer relative">
                                    <Input
                                        id="resume"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        disabled={isPending}
                                        className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                                    />
                                    <div className="flex flex-col items-center gap-1">
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {file ? file.name : "Click to upload or drag and drop"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jd" className="flex items-center gap-2">
                                    Job Description (Optional)
                                    <span className="text-xs text-muted-foreground font-normal">(For Match Score)</span>
                                </Label>
                                <Textarea
                                    id="jd"
                                    placeholder="Paste the job description here..."
                                    className="min-h-[120px] resize-none"
                                    value={jobDescription}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={!file || isPending}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md h-10"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {jobDescription.trim() ? "Matching..." : "Analyzing..."}
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
                </div>

                {/* Right Side: Analysis Results */}
                <div className="lg:border-l lg:pl-8 h-full lg:overflow-y-auto scrollbar-none">
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="relative bg-background p-4 rounded-full shadow-lg border">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Analyzing your profile...</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    {jobDescription.trim()
                                        ? "Comparing your skills and experience against the job requirements."
                                        : "Extracting key insights, strengths, and potential improvements."}
                                </p>
                            </div>
                        </div>
                    ) : analysis ? (
                        <ResumeAnalysisView analysis={analysis} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                            <FileText className="h-16 w-16 opacity-20" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-foreground">No Analysis Yet</h3>
                                <p className="text-sm max-w-xs mx-auto">
                                    Upload a resume and click analyze to see detailed insights and AI-powered feedback here.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
