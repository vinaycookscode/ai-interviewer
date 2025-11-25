"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        resumeUrl: string | null;
        resumeName: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(user.name || "");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [currentResume, setCurrentResume] = useState<{ url: string; name: string } | null>(
        user.resumeUrl ? { url: user.resumeUrl, name: user.resumeName || "Resume" } : null
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleRemoveResume = () => {
        setResumeFile(null);
        // If we want to allow removing the existing resume, we'd need logic for that.
        // For now, just clearing the new file selection.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            let resumeUrl = user.resumeUrl;
            let resumeName = user.resumeName;

            // 1. Upload new resume if selected
            if (resumeFile) {
                const formData = new FormData();
                formData.append("resume", resumeFile);

                try {
                    const response = await fetch("/api/upload/profile", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error("Failed to upload resume");
                    }

                    const data = await response.json();
                    resumeUrl = data.resumeUrl;
                    resumeName = data.resumeName;
                } catch (error) {
                    toast.error("Failed to upload resume");
                    return;
                }
            }

            // 2. Update profile
            const result = await updateProfile({
                name,
                resumeUrl: resumeUrl || undefined,
                resumeName: resumeName || undefined,
            });

            if (result.success) {
                toast.success("Profile updated successfully");
                router.refresh();
                setResumeFile(null);
                if (resumeUrl && resumeName) {
                    setCurrentResume({ url: resumeUrl, name: resumeName });
                }
            } else {
                toast.error(result.error || "Failed to update profile");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Resume</Label>
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
                            {currentResume && !resumeFile ? (
                                <div className="flex items-center gap-4 w-full p-2 border rounded-md bg-muted/50">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate">{currentResume.name}</p>
                                        <a
                                            href={currentResume.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            View Current Resume
                                        </a>
                                    </div>
                                </div>
                            ) : null}

                            {resumeFile ? (
                                <div className="flex items-center gap-4 w-full p-2 border rounded-md bg-primary/5">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRemoveResume}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center">
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">
                                        {currentResume ? "Upload new resume to replace" : "Upload your resume"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        PDF, DOCX up to 5MB
                                    </p>
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        id="resume-upload"
                                        onChange={handleFileChange}
                                        disabled={isPending}
                                    />
                                    <Button type="button" variant="outline" size="sm" asChild>
                                        <label htmlFor="resume-upload" className="cursor-pointer">
                                            Select File
                                        </label>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
