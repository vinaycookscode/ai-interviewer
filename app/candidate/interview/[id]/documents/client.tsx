"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadClientProps {
    interviewId: string;
    jobTitle: string;
    requireResume: boolean;
    requireAadhar: boolean;
    requirePAN: boolean;
    existingDocs: {
        resumeUrl: string | null;
        aadharUrl: string | null;
        panUrl: string | null;
    };
}

export function DocumentUploadClient({
    interviewId,
    jobTitle,
    requireResume,
    requireAadhar,
    requirePAN,
    existingDocs,
}: DocumentUploadClientProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<{
        resume: File | null;
        aadhar: File | null;
        pan: File | null;
    }>({
        resume: null,
        aadhar: null,
        pan: null,
    });

    const handleFileChange = (type: "resume" | "aadhar" | "pan", file: File | null) => {
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            // Validate file type
            const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
            if (!validTypes.includes(file.type)) {
                toast.error("Only PDF, JPG, and PNG files are allowed");
                return;
            }
        }
        setFiles((prev) => ({ ...prev, [type]: file }));
    };

    const handleUpload = async () => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("interviewId", interviewId);

            if (files.resume) formData.append("resume", files.resume);
            if (files.aadhar) formData.append("aadhar", files.aadhar);
            if (files.pan) formData.append("pan", files.pan);

            const response = await fetch("/api/upload/documents", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            toast.success("Documents uploaded successfully!");
            router.push("/candidate/dashboard");
            router.refresh();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload documents");
        } finally {
            setUploading(false);
        }
    };

    const allRequiredUploaded =
        (!requireResume || existingDocs.resumeUrl || files.resume) &&
        (!requireAadhar || existingDocs.aadharUrl || files.aadhar) &&
        (!requirePAN || existingDocs.panUrl || files.pan);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Required Documents</CardTitle>
                        <CardDescription>
                            Upload the required documents for your interview: {jobTitle}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!requireResume && !requireAadhar && !requirePAN ? (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Documents Required</h3>
                                <p className="text-muted-foreground mb-6">
                                    This interview does not require document uploads. You can proceed directly to the interview.
                                </p>
                                <Button onClick={() => router.push("/candidate/dashboard")}>
                                    Return to Dashboard
                                </Button>
                            </div>
                        ) : (
                            <>
                                {requireResume && (
                                    <div className="space-y-2">
                                        <Label htmlFor="resume" className="flex items-center gap-2">
                                            Resume *
                                            {existingDocs.resumeUrl && (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            )}
                                        </Label>
                                        <Input
                                            id="resume"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                console.log("Resume file input changed", e.target.files);
                                                handleFileChange("resume", e.target.files?.[0] || null);
                                            }}
                                            onClick={(e) => {
                                                console.log("Resume file input clicked", { uploading, disabled: uploading });
                                            }}
                                            disabled={false}
                                        />
                                        {existingDocs.resumeUrl && (
                                            <p className="text-sm text-muted-foreground">
                                                Already uploaded. Upload a new file to replace.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {requireAadhar && (
                                    <div className="space-y-2">
                                        <Label htmlFor="aadhar" className="flex items-center gap-2">
                                            Aadhar Card *
                                            {existingDocs.aadharUrl && (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            )}
                                        </Label>
                                        <Input
                                            id="aadhar"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange("aadhar", e.target.files?.[0] || null)}
                                            disabled={false}
                                        />
                                        {existingDocs.aadharUrl && (
                                            <p className="text-sm text-muted-foreground">
                                                Already uploaded. Upload a new file to replace.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {requirePAN && (
                                    <div className="space-y-2">
                                        <Label htmlFor="pan" className="flex items-center gap-2">
                                            PAN Card *
                                            {existingDocs.panUrl && (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            )}
                                        </Label>
                                        <Input
                                            id="pan"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange("pan", e.target.files?.[0] || null)}
                                            disabled={false}
                                        />
                                        {existingDocs.panUrl && (
                                            <p className="text-sm text-muted-foreground">
                                                Already uploaded. Upload a new file to replace.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="text-sm text-muted-foreground">
                                            <p className="font-medium mb-1">File Requirements:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Accepted formats: PDF, JPG, PNG</li>
                                                <li>Maximum file size: 5MB</li>
                                                <li>Documents are requested but optional - you can start the interview without uploading</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/candidate/dashboard")}
                                        disabled={uploading}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="flex-1"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload Documents
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
