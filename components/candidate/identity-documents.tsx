"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IdCard, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import { inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface StoredDocument {
    /** Served through the authorised file route */
    href: string | null;
    name: string | null;
}

type Kind = "pan" | "aadhaar";

/** PAN and Aadhaar: view, or pick a file to upload and save it straight away. */
export function IdentityDocuments({ pan, aadhaar }: { pan: StoredDocument | null; aadhaar: StoredDocument | null }) {
    const t = useTranslations("Profile");
    const router = useRouter();
    const [busy, setBusy] = useState<Kind | null>(null);
    const inputs = { pan: useRef<HTMLInputElement>(null), aadhaar: useRef<HTMLInputElement>(null) };

    const upload = async (kind: Kind, file: File) => {
        setBusy(kind);
        try {
            const body = new FormData();
            body.append("file", file);
            body.append("type", kind);
            const response = await fetch("/api/upload/profile", { method: "POST", body });
            if (!response.ok) throw new Error("upload failed");
            const data: { url: string; name: string } = await response.json();
            const result = await updateProfile(kind === "pan" ? { panUrl: data.url, panName: data.name } : { aadhaarUrl: data.url, aadhaarName: data.name });
            if (!result.success) throw new Error("save failed");
            toast.success(t("uploadedToast", { doc: t(kind) }));
            router.refresh();
        } catch {
            toast.error(t("uploadFailed"));
        } finally {
            setBusy(null);
            if (inputs[kind].current) inputs[kind].current.value = "";
        }
    };

    return (
        <ul className="flex flex-col gap-2.5">
            {(["pan", "aadhaar"] as const).map((kind) => {
                const doc = kind === "pan" ? pan : aadhaar;
                const docName = t(kind);
                return (
                    <li key={kind} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3.5">
                        <span
                            aria-hidden="true"
                            className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px]", doc ? "bg-sg-lavender-soft text-sg-lavender-ink" : "bg-sg-chip")}
                        >
                            <IdCard className="size-5" />
                        </span>
                        <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                            <span className="font-bold">{docName}</span>
                            <span className="truncate text-[13px] leading-[18px] font-medium text-sg-muted">{doc ? doc.name ?? t("uploaded") : t("notAdded")}</span>
                        </span>
                        <input
                            ref={inputs[kind]}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden="true"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) upload(kind, file);
                            }}
                        />
                        <span className="flex gap-2">
                            {doc?.href && (
                                <a href={doc.href} target="_blank" rel="noreferrer" aria-label={t("viewLabel", { doc: docName })} className={cn(outlineButton, "h-9 text-sm")}>
                                    {t("view")}
                                </a>
                            )}
                            <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => inputs[kind].current?.click()}
                                aria-label={doc ? t("replaceLabel", { doc: docName }) : undefined}
                                className={doc ? cn(outlineButton, "h-9 text-sm") : cn(inkButton, "h-9 px-4 text-sm")}
                            >
                                {busy === kind ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : !doc && <Upload className="size-4" aria-hidden="true" />}
                                {busy === kind ? t("uploading") : doc ? t("replace") : t("upload")}
                            </button>
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
