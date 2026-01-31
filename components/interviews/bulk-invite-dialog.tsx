"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { bulkInviteCandidates, CandidateData, BulkInviteResult } from "@/actions/bulk-invite";
import { Loader2, Upload, Users, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, ArrowLeft, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Utility function to validate email format
function validateEmail(email: string): boolean {
    // Stricter email validation:
    // - No consecutive dots
    // - Must have valid local part and domain
    // - Domain must have at least one dot with valid TLD
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    // Additional check: no consecutive dots anywhere
    if (email.includes('..')) {
        return false;
    }

    return emailRegex.test(email);
}

interface ParsedCandidate {
    name: string;
    email: string;
    isValid: boolean;
    error?: string;
}

// Parse CSV content - returns all candidates with validation status
function parseCSV(content: string): { candidates: ParsedCandidate[]; headerErrors: string[] } {
    const lines = content.trim().split("\n");
    const candidates: ParsedCandidate[] = [];
    const headerErrors: string[] = [];

    if (lines.length < 2) {
        headerErrors.push("CSV must have a header row and at least one data row");
        return { candidates, headerErrors };
    }

    // Parse header
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const nameIndex = header.findIndex((h) => h === "name" || h === "candidate name" || h === "full name");
    const emailIndex = header.findIndex((h) => h === "email" || h === "email address" || h === "candidate email");

    if (nameIndex === -1) {
        headerErrors.push("CSV must have a 'name' column");
        return { candidates, headerErrors };
    }
    if (emailIndex === -1) {
        headerErrors.push("CSV must have an 'email' column");
        return { candidates, headerErrors };
    }

    // Parse data rows - include all rows with validation status
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const name = values[nameIndex] || "";
        const email = values[emailIndex] || "";

        if (!name) {
            candidates.push({ name: name || "(empty)", email: email || "(empty)", isValid: false, error: "Missing name" });
            continue;
        }
        if (!email) {
            candidates.push({ name, email: "(empty)", isValid: false, error: "Missing email" });
            continue;
        }
        if (!validateEmail(email)) {
            candidates.push({ name, email, isValid: false, error: "Invalid email format" });
            continue;
        }

        candidates.push({ name, email, isValid: true });
    }

    return { candidates, headerErrors };
}

type Step = "upload" | "preview" | "schedule" | "sending" | "results";

export function BulkInviteDialog({ jobId }: { jobId: string }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("upload");
    const [allCandidates, setAllCandidates] = useState<ParsedCandidate[]>([]);
    const [headerErrors, setHeaderErrors] = useState<string[]>([]);
    const [scheduledTime, setScheduledTime] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<BulkInviteResult | null>(null);

    // Computed values
    const validCandidates = allCandidates.filter(c => c.isValid);
    const invalidCandidates = allCandidates.filter(c => !c.isValid);
    const hasInvalidCandidates = invalidCandidates.length > 0;
    const sortedCandidates = [...invalidCandidates, ...validCandidates]; // Invalid first

    // Get minimum datetime (now + 1 hour)
    const getMinDateTime = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return now.toISOString().slice(0, 16);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const { candidates: parsedCandidates, headerErrors: errors } = parseCSV(content);
            setAllCandidates(parsedCandidates);
            setHeaderErrors(errors);
            setStep("preview");
        };
        reader.readAsText(file);
    };

    const handleSendInvites = async () => {
        if (!scheduledTime || hasInvalidCandidates) return;

        setIsProcessing(true);
        setStep("sending");
        setProgress(10);

        try {
            // Simulate progress for UX
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 90));
            }, 200);

            // Convert to CandidateData format
            const candidatesToSend: CandidateData[] = validCandidates.map(c => ({ name: c.name, email: c.email }));

            const result = await bulkInviteCandidates({
                jobId,
                candidates: candidatesToSend,
                scheduledTime: new Date(scheduledTime).toISOString(),
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            });

            clearInterval(progressInterval);
            setProgress(100);
            setResult(result);
            setStep("results");
            router.refresh();
        } catch (error) {
            console.error("Bulk invite failed:", error);
            setResult({
                success: false,
                total: validCandidates.length,
                successful: 0,
                failed: validCandidates.length,
                duplicates: 0,
                results: [],
            });
            setStep("results");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetDialog = () => {
        setStep("upload");
        setAllCandidates([]);
        setHeaderErrors([]);
        setScheduledTime("");
        setExpiresAt("");
        setProgress(0);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetDialog();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Bulk Invite
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                {/* Step 1: Upload */}
                {step === "upload" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Bulk Invite Candidates</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file with candidate names and emails.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Required columns: name, email
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm font-medium mb-2">CSV Format Example:</p>
                                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                                    {`name,email
John Doe,john@example.com
Jane Smith,jane@example.com`}
                                </pre>
                            </div>
                        </div>
                    </>
                )}

                {/* Step 2: Preview */}
                {step === "preview" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Review Candidates</DialogTitle>
                            <DialogDescription>
                                {validCandidates.length} valid, {invalidCandidates.length} invalid of {allCandidates.length} total
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {headerErrors.length > 0 && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    <p className="text-sm font-medium text-destructive mb-2">
                                        <AlertCircle className="inline h-4 w-4 mr-1" />
                                        CSV Format Error
                                    </p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {headerErrors.map((error: string, i: number) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {hasInvalidCandidates && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    <p className="text-sm font-medium text-destructive">
                                        <XCircle className="inline h-4 w-4 mr-1" />
                                        {invalidCandidates.length} row(s) have invalid data. Please fix your CSV and re-upload.
                                    </p>
                                </div>
                            )}

                            {allCandidates.length > 0 && (
                                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead className="w-24">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedCandidates.slice(0, 20).map((candidate: ParsedCandidate, index: number) => (
                                                <TableRow key={index} className={candidate.isValid ? "" : "bg-red-50 dark:bg-red-950/30"}>
                                                    <TableCell className="text-muted-foreground">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className={candidate.isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                        {candidate.name}
                                                    </TableCell>
                                                    <TableCell className={candidate.isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                        {candidate.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        {candidate.isValid ? (
                                                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                                <CheckCircle className="h-3 w-3" /> Valid
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-red-600 dark:text-red-400" title={candidate.error}>
                                                                {candidate.error}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {allCandidates.length > 20 && (
                                        <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground">
                                            ...and {allCandidates.length - 20} more candidates
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={resetDialog}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => setStep("schedule")}
                                    disabled={validCandidates.length === 0 || hasInvalidCandidates}
                                >
                                    {hasInvalidCandidates
                                        ? `Fix ${invalidCandidates.length} Invalid Row(s) First`
                                        : `Continue with ${validCandidates.length} Candidates`
                                    }
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Step 3: Schedule */}
                {step === "schedule" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Schedule Interviews</DialogTitle>
                            <DialogDescription>
                                Set the interview time for all {validCandidates.length} candidates.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduledTime">Scheduled Interview Time *</Label>
                                <Input
                                    id="scheduledTime"
                                    type="datetime-local"
                                    min={getMinDateTime()}
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    All candidates will be able to start their interview from this time.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                                <Input
                                    id="expiresAt"
                                    type="datetime-local"
                                    min={scheduledTime || getMinDateTime()}
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Default: 48 hours after scheduled time
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep("preview")}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSendInvites}
                                    disabled={!scheduledTime || isProcessing}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Send {validCandidates.length} Invitations
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Step 4: Sending */}
                {step === "sending" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Sending Invitations...</DialogTitle>
                            <DialogDescription>
                                Please wait while we process {validCandidates.length} invitations.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-8">
                            <div className="flex justify-center">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-center text-sm text-muted-foreground">
                                Processing... {Math.round(progress)}%
                            </p>
                        </div>
                    </>
                )}

                {/* Step 5: Results */}
                {step === "results" && result && (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                {result.successful > 0 ? "Invitations Sent!" : "Process Complete"}
                            </DialogTitle>
                            <DialogDescription>
                                {result.successful} of {result.total} invitations sent successfully.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                    <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                    <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                                    <p className="text-xs text-muted-foreground">Successful</p>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                                    <AlertCircle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                                    <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                                    <p className="text-xs text-muted-foreground">Duplicates</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                                    <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                                    <p className="text-xs text-muted-foreground">Failed</p>
                                </div>
                            </div>

                            {result.results.filter((r) => r.status !== "success").length > 0 && (
                                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Reason</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.results
                                                .filter((r) => r.status !== "success")
                                                .map((r, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="text-sm">{r.email}</TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full ${r.status === "duplicate"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : "bg-red-100 text-red-700"
                                                                    }`}
                                                            >
                                                                {r.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {r.error}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            <Button className="w-full" onClick={() => handleOpenChange(false)}>
                                Done
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
