"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { Loader2, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        resumeUrl: string | null;
        resumeName: string | null;
        panUrl?: string | null;
        panName?: string | null;
        aadhaarUrl?: string | null;
        aadhaarName?: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(user.name || "");
    const [panFile, setPanFile] = useState<File | null>(null);
    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

    const [currentPan, setCurrentPan] = useState<{ url: string; name: string } | null>(
        user.panUrl ? { url: user.panUrl, name: user.panName || "PAN Card" } : null
    );
    const [currentAadhaar, setCurrentAadhaar] = useState<{ url: string; name: string } | null>(
        user.aadhaarUrl ? { url: user.aadhaarUrl, name: user.aadhaarName || "Aadhaar Card" } : null
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pan' | 'aadhaar') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'pan') setPanFile(e.target.files[0]);
            if (type === 'aadhaar') setAadhaarFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = (type: 'pan' | 'aadhaar') => {
        if (type === 'pan') setPanFile(null);
        if (type === 'aadhaar') setAadhaarFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            let panUrl = user.panUrl;
            let panName = user.panName;
            let aadhaarUrl = user.aadhaarUrl;
            let aadhaarName = user.aadhaarName;

            // Helper for uploading
            const uploadFile = async (file: File, type: string) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", type);
                const response = await fetch("/api/upload/profile", {
                    method: "POST",
                    body: formData,
                });
                if (!response.ok) throw new Error(`Failed to upload ${type}`);
                return await response.json();
            };

            try {
                if (panFile) {
                    const data = await uploadFile(panFile, "pan");
                    panUrl = data.url;
                    panName = data.name;
                }
                if (aadhaarFile) {
                    const data = await uploadFile(aadhaarFile, "aadhaar");
                    aadhaarUrl = data.url;
                    aadhaarName = data.name;
                }
            } catch (error) {
                toast.error("File upload failed");
                return;
            }

            // 2. Update profile
            const result = await updateProfile({
                name,
                panUrl: panUrl || undefined,
                panName: panName || undefined,
                aadhaarUrl: aadhaarUrl || undefined,
                aadhaarName: aadhaarName || undefined,
            });

            if (result.success) {
                toast.success("Profile updated successfully");
                router.refresh();
                setPanFile(null);
                setAadhaarFile(null);
                if (panUrl && panName) setCurrentPan({ url: panUrl, name: panName });
                if (aadhaarUrl && aadhaarName) setCurrentAadhaar({ url: aadhaarUrl, name: aadhaarName });
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

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>PAN Card</Label>
                        <Card className="border-dashed bg-muted/5 min-h-[140px] flex items-center justify-center">
                            <CardContent className="p-4 w-full">
                                {currentPan && !panFile ? (
                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate uppercase">{currentPan.name}</p>
                                            <a href={currentPan.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold">VIEW DOCUMENT</a>
                                        </div>
                                    </div>
                                ) : null}

                                {panFile ? (
                                    <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{panFile.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{(panFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveFile('pan')}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : !currentPan && (
                                    <div className="text-center py-2">
                                        <Input type="file" accept="image/*,.pdf" className="hidden" id="pan-upload" onChange={(e) => handleFileChange(e, 'pan')} disabled={isPending} />
                                        <Button type="button" variant="outline" size="sm" asChild>
                                            <label htmlFor="pan-upload" className="cursor-pointer text-xs">Upload PAN</label>
                                        </Button>
                                    </div>
                                )}
                                {currentPan && !panFile && (
                                    <div className="mt-3 text-center">
                                        <Input type="file" accept="image/*,.pdf" className="hidden" id="pan-upload" onChange={(e) => handleFileChange(e, 'pan')} disabled={isPending} />
                                        <Button type="button" variant="link" size="sm" asChild className="text-[10px] h-auto p-0 opacity-50 hover:opacity-100">
                                            <label htmlFor="pan-upload" className="cursor-pointer">Replace Document</label>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <Label>Aadhaar Card</Label>
                        <Card className="border-dashed bg-muted/5 min-h-[140px] flex items-center justify-center">
                            <CardContent className="p-4 w-full">
                                {currentAadhaar && !aadhaarFile ? (
                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border">
                                        <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate uppercase">{currentAadhaar.name}</p>
                                            <a href={currentAadhaar.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold">VIEW DOCUMENT</a>
                                        </div>
                                    </div>
                                ) : null}

                                {aadhaarFile ? (
                                    <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{aadhaarFile.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{(aadhaarFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveFile('aadhaar')}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : !currentAadhaar && (
                                    <div className="text-center py-2">
                                        <Input type="file" accept="image/*,.pdf" className="hidden" id="aadhaar-upload" onChange={(e) => handleFileChange(e, 'aadhaar')} disabled={isPending} />
                                        <Button type="button" variant="outline" size="sm" asChild>
                                            <label htmlFor="aadhaar-upload" className="cursor-pointer text-xs">Upload Aadhaar</label>
                                        </Button>
                                    </div>
                                )}
                                {currentAadhaar && !aadhaarFile && (
                                    <div className="mt-3 text-center">
                                        <Input type="file" accept="image/*,.pdf" className="hidden" id="aadhaar-upload" onChange={(e) => handleFileChange(e, 'aadhaar')} disabled={isPending} />
                                        <Button type="button" variant="link" size="sm" asChild className="text-[10px] h-auto p-0 opacity-50 hover:opacity-100">
                                            <label htmlFor="aadhaar-upload" className="cursor-pointer">Replace Document</label>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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
