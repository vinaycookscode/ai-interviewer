// Small Soft Glass pieces shared by the employer screens and the feedback report.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, CircleDot, Clock, FileCheck2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { documentHref } from "@/lib/document-url";

// ---- Class strings -------------------------------------------------------------------------

/** Glass panel. */
export const panel = "sg-glass flex min-w-0 flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7";
/** Inset row inside a panel. */
export const row = "rounded-[18px] bg-sg-row px-4 py-3.5";
export const panelTitle = "font-display sg-soft text-[22px] leading-7 font-semibold";
export const sectionTitle = "font-display sg-soft text-[26px] leading-[33px] font-semibold tracking-[-0.015em]";
export const caption = "text-[13px] leading-[18px] font-medium text-sg-muted";
export const label = "text-[13px] leading-[18px] font-bold text-sg-muted";

/** Secondary button. Add a height (h-10, h-12) at the call site. */
export const inkButton =
    "inline-flex items-center justify-center gap-2 rounded-full bg-sg-ink px-5 font-bold whitespace-nowrap text-sg-ink-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 " +
    focusRing;
/** Quiet bordered button. Add a height at the call site. */
export const outlineButton =
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-sg-field-border bg-transparent px-4 font-semibold whitespace-nowrap text-sg-text transition-colors hover:bg-sg-chip disabled:pointer-events-none disabled:opacity-50 " +
    focusRing;
/** Glass button for a secondary action beside the coral one. Add a height at the call site. */
export const glassButton =
    "sg-glass inline-flex items-center justify-center gap-2 rounded-full px-5 font-bold whitespace-nowrap text-sg-text transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-60 " +
    focusRing;
/** Confirms a destructive action. */
export const dangerButton =
    "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sg-danger px-5 font-bold whitespace-nowrap text-sg-bg transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 " +
    focusRing;
export const iconButton =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sg-text transition-colors hover:bg-sg-chip disabled:pointer-events-none disabled:opacity-50 " +
    focusRing;
export const textLink = "rounded-md text-sm font-bold whitespace-nowrap text-sg-text underline-offset-4 hover:underline " + focusRing;

/** Soft field for native inputs, selects and textareas. */
export const field =
    "w-full rounded-2xl border border-sg-field-border bg-sg-row px-4 text-base leading-6 text-sg-text placeholder:text-sg-muted/70 focus-visible:border-sg-lavender focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sg-lavender/40 aria-invalid:border-sg-danger";
export const fieldLabel = "text-sm leading-5 font-semibold";

// ---- Formatting ----------------------------------------------------------------------------

/** "14 Oct", or "14 Oct 2025" outside the current year. */
export function formatShortDate(value: Date | string): string {
    const date = new Date(value);
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

/** The name to show for a candidate: their name, or their email when we don't have one. */
export function displayName(candidate: { name: string | null; email: string }): string {
    return candidate.name?.trim() || candidate.email;
}

// ---- Page heading --------------------------------------------------------------------------

interface PageHeadingProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    back?: { href: string; label: string };
    actions?: React.ReactNode;
}

/** The one h1 of a screen, with an optional back link, subtitle and actions. */
export function PageHeading({ title, subtitle, back, actions }: PageHeadingProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
                {back && (
                    <Link
                        href={back.href}
                        className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {back.label}
                    </Link>
                )}
                <h1 className="font-display sg-soft text-[length:clamp(32px,8vw,44px)] leading-[1.14] font-semibold tracking-[-0.025em] text-balance break-words">
                    {title}
                </h1>
                {subtitle && <div className="max-w-[640px] text-lg leading-7 text-sg-muted">{subtitle}</div>}
            </div>
            {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>
    );
}

// ---- Chips ---------------------------------------------------------------------------------

const chipBase = "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap";

export function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
    return <span className={cn(chipBase, "bg-sg-chip text-sg-text", className)}>{children}</span>;
}

export type InterviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

/** Interview status as icon + word. */
export function StatusChip({ status }: { status: InterviewStatus | string }) {
    const t = useTranslations("Employer.status");
    if (status === "COMPLETED") {
        return (
            <Chip className="bg-sg-lavender-soft text-sg-lavender-ink">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {t("COMPLETED")}
            </Chip>
        );
    }
    if (status === "IN_PROGRESS") {
        return (
            <Chip className="bg-sg-ink text-sg-ink-foreground">
                <CircleDot className="size-3.5" aria-hidden="true" />
                {t("IN_PROGRESS")}
            </Chip>
        );
    }
    return (
        <Chip>
            <Mail className="size-3.5" aria-hidden="true" />
            {t("PENDING")}
        </Chip>
    );
}

export interface DocumentRequirements {
    requireResume: boolean;
    requireAadhar: boolean;
    requirePAN: boolean;
}

export interface InterviewDocuments {
    resumeUrl: string | null;
    aadhaarUrl: string | null;
    panUrl: string | null;
}

/** The documents a job asks for, as plain chips (job lists). */
export function RequiredDocuments({ job }: { job: DocumentRequirements }) {
    const t = useTranslations("Employer.docs");
    const docs = [job.requireResume && t("resume"), job.requirePAN && t("pan"), job.requireAadhar && t("aadhaar")].filter(Boolean) as string[];
    if (docs.length === 0) return <span className="text-sm text-sg-muted">{t("noneAsked")}</span>;
    return (
        <span className="flex flex-wrap gap-1">
            {docs.map((doc) => (
                <Chip key={doc}>{doc}</Chip>
            ))}
        </span>
    );
}

/**
 * A candidate's documents: uploaded ones open the file; ones the job asks for but are still
 * missing show a clock and say "pending" to screen readers.
 */
export function DocumentChips({ job, interview }: { job: DocumentRequirements; interview: InterviewDocuments }) {
    const t = useTranslations("Employer.docs");
    const docs = [
        { key: "resume", label: t("resume"), url: interview.resumeUrl, required: job.requireResume },
        { key: "pan", label: t("pan"), url: interview.panUrl, required: job.requirePAN },
        { key: "aadhaar", label: t("aadhaar"), url: interview.aadhaarUrl, required: job.requireAadhar },
    ].filter((doc) => doc.url || doc.required);

    if (docs.length === 0) return <span className="text-sm text-sg-muted">{t("noneAsked")}</span>;

    return (
        <span className="flex flex-wrap gap-1">
            {docs.map((doc) =>
                doc.url ? (
                    <a
                        key={doc.key}
                        href={documentHref(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("open", { doc: doc.label })}
                        className={cn(chipBase, "bg-sg-lavender-soft text-sg-lavender-ink hover:underline", focusRing)}
                    >
                        <FileCheck2 className="size-3.5" aria-hidden="true" />
                        {doc.label}
                    </a>
                ) : (
                    <Chip key={doc.key}>
                        <Clock className="size-3.5" aria-hidden="true" />
                        {doc.label}
                        <span className="sr-only"> {t("pending")}</span>
                    </Chip>
                )
            )}
        </span>
    );
}

/** A small "number over label" figure. */
export function Figure({ value, label: text, className }: { value: React.ReactNode; label: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span className="font-display sg-soft text-[28px] leading-8 font-semibold">{value}</span>
            <span className={caption}>{text}</span>
        </div>
    );
}
