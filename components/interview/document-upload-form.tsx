"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadFormProps {
    interviewId: string;
    token: string;
    jobTitle: string;
    requirements: {
        resume: boolean;
        aadhar: boolean;
        pan: boolean;
    };
    existingDocs: {
        resume: boolean;
        aadhar: boolean;
        pan: boolean;
    };
}

export function DocumentUploadForm({
    interviewId,
    token,
    jobTitle,
    requirements,
    existingDocs
}: DocumentUploadFormProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<{
        resume: File | null;
        aadhar: File | null;
        pan: File | null;
    }>({
        resume: null,
        aadhar: null,
        pan: null,
    });

    const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (requirements.resume && !existingDocs.resume && !files.resume) {
            toast.error("Please upload your Resume");
            return;
        }
        if (requirements.aadhar && !existingDocs.aadhar && !files.aadhar) {
            toast.error("Please upload your Aadhar Card");
            return;
        }
        if (requirements.pan && !existingDocs.pan && !files.pan) {
            toast.error("Please upload your PAN Card");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("interviewId", interviewId);

        if (files.resume) formData.append("resume", files.resume);
        if (files.aadhar) formData.append("aadhar", files.aadhar);
        if (files.pan) formData.append("pan", files.pan);

        try {
            const response = await fetch("/api/upload/documents", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload documents");
            }

            toast.success("Documents uploaded successfully!");
            router.refresh();
            router.push(`/interview/${interviewId}?token=${token}`); // Redirect back to interview with token
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Please upload the following documents to proceed with your interview for <strong>{jobTitle}</strong>.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {requirements.resume && (
                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume {existingDocs.resume && <span className="text-green-600 text-xs ml-2">(Uploaded)</span>}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="resume"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleFileChange("resume", e)}
                                    className="cursor-pointer"
                                />
                                {existingDocs.resume && <CheckCircle className="h-5 w-5 text-green-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 5MB)</p>
                        </div>
                    )}

                    {requirements.aadhar && (
                        <div className="space-y-2">
                            <Label htmlFor="aadhar">Aadhar Card {existingDocs.aadhar && <span className="text-green-600 text-xs ml-2">(Uploaded)</span>}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="aadhar"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange("aadhar", e)}
                                    className="cursor-pointer"
                                />
                                {existingDocs.aadhar && <CheckCircle className="h-5 w-5 text-green-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                        </div>
                    )}

                    {requirements.pan && (
                        <div className="space-y-2">
                            <Label htmlFor="pan">PAN Card {existingDocs.pan && <span className="text-green-600 text-xs ml-2">(Uploaded)</span>}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="pan"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange("pan", e)}
                                    className="cursor-pointer"
                                />
                                {existingDocs.pan && <CheckCircle className="h-5 w-5 text-green-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload & Continue
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
