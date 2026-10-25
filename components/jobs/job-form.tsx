"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Check, Code2, Loader2, Mic, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { coralButton } from "@/components/soft-glass/classes";
import { createJob, updateJob } from "@/actions/job";
import { generateQuestions } from "@/actions/questions";
import { INTERVIEW_LANGUAGES } from "@/lib/constants";
import { useLimit } from "@/components/providers/limit-provider";
import { TranslationButton } from "@/components/jobs/translation-button";
import { Chip, caption, field, fieldLabel, iconButton, inkButton, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";

const formSchema = z.object({
    title: z.string().min(2),
    description: z.string().min(10),
    requireResume: z.boolean(),
    requireAadhar: z.boolean(),
    requirePAN: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;
type QuestionType = "TEXT" | "CODE";

interface DraftQuestion {
    /** Stable React key. */
    key: string;
    /** Saved question id, or the temporary id the edit flow has always sent for new ones. */
    id?: string;
    text: string;
    type: QuestionType;
}

export interface JobFormInitialData extends FormValues {
    questions: { id: string; text: string; type: QuestionType }[];
}

type JobFormProps = { mode: "create" } | { mode: "edit"; jobId: string; initialData: JobFormInitialData };

let keySeed = 0;
const nextKey = () => `q-${Date.now()}-${keySeed++}`;

/** Create or edit a job: details, documents to collect, and the interview questions. */
export function JobForm(props: JobFormProps) {
    const t = useTranslations("Employer.form");
    const router = useRouter();
    const { setRateLimited } = useLimit();
    const editing = props.mode === "edit";
    const initial = editing ? props.initialData : null;

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLanguage, setGenerationLanguage] = useState("auto");
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [questions, setQuestions] = useState<DraftQuestion[]>(
        initial?.questions.map((q) => ({ key: q.id, id: q.id, text: q.text, type: q.type || "TEXT" })) ?? []
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initial?.title ?? "",
            description: initial?.description ?? "",
            requireResume: initial?.requireResume ?? false,
            requireAadhar: initial?.requireAadhar ?? false,
            requirePAN: initial?.requirePAN ?? false,
        },
    });
    const { errors } = form.formState;

    async function handleGenerateQuestions() {
        const description = form.getValues("description");
        if (!description || description.length < 10) {
            toast.error(t("needDescription"));
            return;
        }

        setIsGenerating(true);
        try {
            const lang = generationLanguage === "auto" ? undefined : generationLanguage;
            const result = await generateQuestions(description, lang);
            if (result.success && result.questions) {
                const stamp = Date.now();
                // Appends to the list; nothing already written is replaced.
                setQuestions((prev) => [
                    ...prev,
                    ...result.questions.map((text, i) => ({
                        key: nextKey(),
                        id: editing ? `ai-${stamp}-${i}` : undefined,
                        text,
                        type: "TEXT" as const,
                    })),
                ]);
                toast.success(t("generated"));
            } else if (result.isRateLimit) {
                setRateLimited(true);
            } else if (result.error?.includes("API key")) {
                toast.error(result.error, { action: { label: t("settings"), onClick: () => (window.location.href = "/settings") } });
            } else {
                toast.error(result.error || t("generateFailed"));
            }
        } catch {
            toast.error(t("generateFailed"));
        } finally {
            setIsGenerating(false);
        }
    }

    function updateQuestion(key: string, changes: Partial<Pick<DraftQuestion, "text" | "type">>) {
        setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...changes } : q)));
    }

    function removeQuestion(key: string) {
        setQuestions((prev) => prev.filter((q) => q.key !== key));
        if (editingKey === key) setEditingKey(null);
    }

    function addQuestion() {
        const key = nextKey();
        setQuestions((prev) => [...prev, { key, id: editing ? `temp-${Date.now()}` : undefined, text: "", type: "TEXT" }]);
        setEditingKey(key);
    }

    async function onSubmit(values: FormValues) {
        setIsSaving(true);
        try {
            if (props.mode === "edit") {
                await updateJob(props.jobId, { ...values, questions: questions.map(({ id, text, type }) => ({ id, text, type })) });
                toast.success(t("saved"));
                router.push(`/dashboard/jobs/${props.jobId}`);
            } else {
                await createJob({ ...values, questions: questions.map(({ text, type }) => ({ text, type })) });
                router.push("/dashboard");
            }
            router.refresh();
        } catch (error) {
            console.error("Failed to save job", error);
            toast.error(t("saveFailed"));
        } finally {
            setIsSaving(false);
        }
    }

    const documents = [
        { name: "requireResume" as const, label: t("docResume"), hint: t("docResumeHint") },
        { name: "requirePAN" as const, label: t("docPan"), hint: t("docIdHint") },
        { name: "requireAadhar" as const, label: t("docAadhaar"), hint: t("docIdHint") },
    ];

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex w-full max-w-[820px] flex-col gap-5">
            <section aria-labelledby="jf-job" className={panel}>
                <h2 id="jf-job" className={panelTitle}>
                    {t("jobTitle")}
                </h2>
                <div className="flex min-w-0 flex-col gap-2">
                    <label htmlFor="jf-title" className={fieldLabel}>
                        {t("title")}
                    </label>
                    <input
                        id="jf-title"
                        type="text"
                        placeholder={t("titlePlaceholder")}
                        aria-invalid={!!errors.title}
                        aria-describedby={errors.title ? "jf-title-error" : undefined}
                        className={cn(field, "h-12")}
                        {...form.register("title")}
                    />
                    {errors.title && <FieldError id="jf-title-error">{t("errorTitle")}</FieldError>}
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor="jf-desc" className={fieldLabel}>
                            {t("description")}
                        </label>
                        <TranslationButton
                            onTranslate={async (lang) => {
                                const currentText = form.getValues("description");
                                if (!currentText) return;
                                const { translateText } = await import("@/actions/translation");
                                const result = await translateText(currentText, lang);
                                if (result.success && result.translatedText) {
                                    form.setValue("description", result.translatedText);
                                    toast.success(t("translated"));
                                } else {
                                    toast.error(result.error || t("translateFailed"));
                                }
                            }}
                        />
                    </div>
                    <textarea
                        id="jf-desc"
                        rows={7}
                        placeholder={t("descriptionPlaceholder")}
                        aria-invalid={!!errors.description}
                        aria-describedby={errors.description ? "jf-desc-error" : undefined}
                        className={cn(field, "min-h-[180px] resize-y py-3")}
                        {...form.register("description")}
                    />
                    {errors.description && <FieldError id="jf-desc-error">{t("errorDescription")}</FieldError>}
                </div>
            </section>

            <section aria-labelledby="jf-docs" className={panel}>
                <h2 id="jf-docs" className={panelTitle}>
                    {t("docsTitle")}
                </h2>
                <p className="text-[15px] leading-[23px] text-sg-muted">{t("docsBody")}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {documents.map((doc) => (
                        <label
                            key={doc.name}
                            htmlFor={`jf-${doc.name}`}
                            className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sg-row px-3.5 py-3 focus-within:ring-[3px] focus-within:ring-sg-lavender/50"
                        >
                            <input
                                id={`jf-${doc.name}`}
                                type="checkbox"
                                className="mt-0.5 size-5 shrink-0 accent-[var(--sg-ink)] focus-visible:outline-none"
                                {...form.register(doc.name)}
                            />
                            <span className="flex flex-col">
                                <span className="font-semibold">{doc.label}</span>
                                <span className={caption}>{doc.hint}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </section>

            <section aria-labelledby="jf-questions" className={panel}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="jf-questions" className={panelTitle}>
                        {t("questionsTitle")}
                    </h2>
                    <span className={caption}>
                        {questions.length > 0 ? t("questionCount", { count: questions.length, minutes: questions.length * 2 }) : t("aim")}
                    </span>
                </div>

                <div className="flex flex-wrap items-end gap-2.5 rounded-[20px] bg-sg-lavender-soft p-4">
                    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                        <span className="font-bold text-sg-lavender-ink">{t("letU")}</span>
                        <span className="text-[15px]">{t("letUBody")}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <label htmlFor="jf-lang" className="text-[13px] font-bold">
                            {t("language")}
                        </label>
                        <select
                            id="jf-lang"
                            value={generationLanguage}
                            onChange={(e) => setGenerationLanguage(e.target.value)}
                            className={cn(field, "h-10 w-auto max-w-full rounded-full px-3.5")}
                        >
                            <option value="auto">{t("sameAsDescription")}</option>
                            {INTERVIEW_LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="button" onClick={handleGenerateQuestions} disabled={isGenerating} className={cn(inkButton, "h-10 px-4 text-sm font-semibold")}>
                        {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                        {isGenerating ? t("writing") : questions.length > 0 ? t("writeMore") : t("write")}
                    </button>
                </div>

                {questions.length > 0 && (
                    <ol className="flex flex-col gap-2">
                        {questions.map((question, index) => {
                            const isEditing = editingKey === question.key;
                            const n = index + 1;
                            return (
                                <li key={question.key} className="flex items-start gap-3 rounded-[18px] bg-sg-row px-3 py-3.5 sm:px-4">
                                    <span
                                        aria-hidden="true"
                                        className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-sg-chip text-[13px] font-bold"
                                    >
                                        {n}
                                    </span>
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        {isEditing ? (
                                            <>
                                                <label htmlFor={`jf-q-${question.key}`} className="sr-only">
                                                    {t("questionLabel", { n })}
                                                </label>
                                                <textarea
                                                    id={`jf-q-${question.key}`}
                                                    autoFocus
                                                    rows={2}
                                                    value={question.text}
                                                    placeholder={t("questionPlaceholder")}
                                                    onChange={(e) => updateQuestion(question.key, { text: e.target.value })}
                                                    className={cn(field, "resize-y py-2.5 text-[15px] leading-[23px]")}
                                                />
                                                <label htmlFor={`jf-qt-${question.key}`} className="sr-only">
                                                    {t("answerType", { n })}
                                                </label>
                                                <select
                                                    id={`jf-qt-${question.key}`}
                                                    value={question.type}
                                                    onChange={(e) => updateQuestion(question.key, { type: e.target.value as QuestionType })}
                                                    className={cn(field, "h-10 w-auto self-start rounded-full px-3.5 text-sm")}
                                                >
                                                    <option value="TEXT">{t("typeText")}</option>
                                                    <option value="CODE">{t("typeCode")}</option>
                                                </select>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[15px] leading-[23px] break-words">
                                                    {question.text || <span className="text-sg-muted">{t("emptyQuestion")}</span>}
                                                </span>
                                                <Chip className="self-start">
                                                    {question.type === "CODE" ? (
                                                        <Code2 className="size-3.5" aria-hidden="true" />
                                                    ) : (
                                                        <Mic className="size-3.5" aria-hidden="true" />
                                                    )}
                                                    {question.type === "CODE" ? t("typeCode") : t("typeText")}
                                                </Chip>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-0.5">
                                        <button
                                            type="button"
                                            aria-label={isEditing ? t("doneEditing", { n }) : t("editQuestion", { n })}
                                            onClick={() => setEditingKey(isEditing ? null : question.key)}
                                            className={iconButton}
                                        >
                                            {isEditing ? <Check className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={t("deleteQuestion", { n })}
                                            onClick={() => removeQuestion(question.key)}
                                            className={cn(iconButton, "text-sg-danger")}
                                        >
                                            <Trash2 className="size-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}

                {isGenerating && (
                    <div role="status" className="flex flex-col gap-2">
                        <span className="sr-only">{t("writing")}</span>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-16 animate-pulse rounded-[18px] bg-sg-chip motion-reduce:animate-none" />
                        ))}
                    </div>
                )}

                {questions.length === 0 && !isGenerating && (
                    <p className="rounded-[18px] border-2 border-dashed border-sg-field-border p-[18px] text-center text-sg-muted">{t("noQuestions")}</p>
                )}

                <button type="button" onClick={addQuestion} className={cn(outlineButton, "h-10 self-start text-sm")}>
                    <Plus className="size-4" aria-hidden="true" />
                    {t("addQuestion")}
                </button>
            </section>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <Link href={props.mode === "edit" ? `/dashboard/jobs/${props.jobId}` : "/dashboard/jobs"} className={cn(outlineButton, "h-[52px] px-[22px] text-base")}>
                    {t("cancel")}
                </Link>
                <button type="submit" disabled={isSaving} className={cn(coralButton, "h-[52px] px-7")}>
                    {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {editing ? t("save") : t("create")}
                </button>
            </div>
        </form>
    );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <span id={id} role="alert" className="text-[13px] font-semibold text-sg-danger">
            {children}
        </span>
    );
}
