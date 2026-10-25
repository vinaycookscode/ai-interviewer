"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, FileText, IdCard, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { coralButton } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

type DocKey = "resume" | "aadhar" | "pan";

interface DocumentUploadFormProps {
    interviewId: string;
    token: string;
    requirements: Record<DocKey, boolean>;
    existingDocs: Record<DocKey, boolean>;
    /** The server's limit (MAX_UPLOAD_BYTES), so the form can say so before uploading. */
    maxBytes: number;
}

const DOCS: { key: DocKey; label: string; accept: string; types: string; hint: string; icon: typeof FileText }[] = [
    { key: "resume", label: "Resume", accept: ".pdf,.doc,.docx", types: "PDF, DOC or DOCX", hint: "a smaller PDF", icon: FileText },
    { key: "pan", label: "PAN card", accept: ".pdf,.jpg,.jpeg,.png", types: "PDF, JPG or PNG", hint: "a phone photo or a smaller PDF", icon: IdCard },
    { key: "aadhar", label: "Aadhaar card", accept: ".pdf,.jpg,.jpeg,.png", types: "PDF, JPG or PNG", hint: "a phone photo or a smaller PDF", icon: IdCard },
];

function formatSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function DocumentUploadForm({ interviewId, token, requirements, existingDocs, maxBytes }: DocumentUploadFormProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<Record<DocKey, File | null>>({ resume: null, aadhar: null, pan: null });
    const [errors, setErrors] = useState<Partial<Record<DocKey, string>>>({});

    const pickFile = (type: DocKey, file: File | undefined, hint: string) => {
        if (!file) return;
        // The server rejects these anyway; saying so here saves a failed upload.
        if (file.size > maxBytes) {
            setErrors((prev) => ({
                ...prev,
                [type]: `That file is ${formatSize(file.size)}. Files can be up to ${formatSize(maxBytes)}: try ${hint}.`,
            }));
            return;
        }
        setErrors((prev) => ({ ...prev, [type]: undefined }));
        setFiles((prev) => ({ ...prev, [type]: file }));
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
        } catch (error) {
            toast.error(error instanceof Error ? error.message : String(error));
        } finally {
            setIsUploading(false);
        }
    };

    const requested = DOCS.filter((doc) => requirements[doc.key]);

    return (
        <form onSubmit={handleSubmit} aria-label="Documents" className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5" noValidate>
            <ul className="flex flex-col gap-3.5">
                {requested.map((doc) => {
                    const Icon = doc.icon;
                    const file = files[doc.key];
                    const uploaded = existingDocs[doc.key];
                    const error = errors[doc.key];
                    const inputId = `doc-${doc.key}`;
                    const errorId = `${inputId}-error`;
                    const done = !!file || uploaded;

                    const input = (
                        <input
                            id={inputId}
                            type="file"
                            accept={doc.accept}
                            className="sr-only"
                            disabled={isUploading}
                            aria-describedby={error ? errorId : undefined}
                            aria-invalid={!!error || undefined}
                            onChange={(e) => {
                                pickFile(doc.key, e.target.files?.[0], doc.hint);
                                e.target.value = "";
                            }}
                        />
                    );
                    const replaceButton = (label: string) => (
                        <label
                            className={cn(
                                "inline-flex h-10 cursor-pointer items-center rounded-full border border-sg-field-border px-3.5 text-sm font-semibold transition-colors hover:bg-sg-chip",
                                "has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-sg-lavender/50",
                                isUploading && "pointer-events-none opacity-60"
                            )}
                        >
                            {label}
                            <span className="sr-only"> {doc.label}</span>
                            {input}
                        </label>
                    );

                    return (
                        <li key={doc.key} className="sg-glass flex flex-col gap-3.5 rounded-[22px] p-[18px]">
                            <div className="flex items-center gap-3">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "flex size-11 shrink-0 items-center justify-center rounded-[14px]",
                                        done ? "bg-sg-lavender-soft text-sg-lavender-ink" : "bg-sg-chip text-sg-text"
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="font-bold">{doc.label}</span>
                                    <span className="text-[13px] font-medium leading-[18px] text-sg-muted">Required · {doc.types}</span>
                                </div>
                            </div>

                            {file && isUploading ? (
                                <div role="status" className="flex flex-col gap-2 rounded-2xl bg-sg-row px-3.5 py-3">
                                    <div className="flex justify-between gap-2 font-semibold">
                                        <span className="min-w-0 truncate">{file.name}</span>
                                        <span className="shrink-0 text-sg-muted">Uploading…</span>
                                    </div>
                                    <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-sg-track">
                                        <div className="h-full w-1/2 animate-pulse rounded-full bg-sg-lavender-ink" />
                                    </div>
                                </div>
                            ) : file ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sg-row px-3.5 py-3">
                                    <span className="inline-flex min-w-0 items-center gap-2 font-semibold">
                                        <CheckCircle2 className="size-4 shrink-0 text-sg-success" aria-hidden="true" />
                                        <span className="min-w-0 truncate">{file.name}</span>
                                        <span className="shrink-0 font-medium text-sg-muted">· {formatSize(file.size)}</span>
                                    </span>
                                    {replaceButton("Change")}
                                </div>
                            ) : uploaded ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sg-row px-3.5 py-3">
                                    <span className="inline-flex items-center gap-2 font-semibold">
                                        <CheckCircle2 className="size-4 shrink-0 text-sg-success" aria-hidden="true" />
                                        Uploaded
                                    </span>
                                    {replaceButton("Replace")}
                                </div>
                            ) : (
                                <label
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (!isUploading) pickFile(doc.key, e.dataTransfer.files?.[0], doc.hint);
                                    }}
                                    className={cn(
                                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-[18px] border-2 border-dashed border-sg-field-border px-4 py-5 text-center transition-colors hover:bg-sg-chip",
                                        "has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-sg-lavender/50"
                                    )}
                                >
                                    <Upload className="size-5" aria-hidden="true" />
                                    <span className="font-bold">
                                        Choose a file, or drop it here<span className="sr-only">: {doc.label}</span>
                                    </span>
                                    <span className="text-[13px] font-medium leading-[18px] text-sg-muted">
                                        {doc.types} · up to {formatSize(maxBytes)}
                                    </span>
                                    {input}
                                </label>
                            )}

                            {error && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2.5 rounded-2xl bg-sg-danger/10 px-4 py-3 text-sm font-semibold leading-5 text-sg-danger"
                                >
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <p id={errorId}>{error}</p>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
                <button type="submit" disabled={isUploading} className={cn(coralButton, "h-14 w-full px-[26px] text-[17px] sm:w-auto")}>
                    {isUploading ? (
                        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    ) : null}
                    {isUploading ? "Uploading…" : "Continue to interview"}
                    {!isUploading && <ArrowRight className="size-5" aria-hidden="true" />}
                </button>
                <span className="text-sg-muted">Opens once your required documents are in.</span>
            </div>
        </form>
    );
}
