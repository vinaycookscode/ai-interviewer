"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageSquarePlus, X, Send, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitUserFeedback } from "@/actions/user-feedback";
import { toast } from "sonner";

export function FeedbackButton() {
    const t = useTranslations("Feedback");
    const tCommon = useTranslations("Common");
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const pathname = usePathname();

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            toast.error(t("errorRequired"));
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitUserFeedback(feedback, pathname, category);
            if (result.success) {
                setSubmitted(true);
                toast.success(t("successSubmit"));
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitted(false);
                    setFeedback("");
                    setCategory("GENERAL");
                }, 2000);
            } else {
                toast.error(result.error || t("errorSubmit"));
            }
        } catch {
            toast.error(t("errorGeneric"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 left-6 md:left-auto md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300",
                    "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600",
                    "hover:shadow-xl hover:scale-105",
                    isOpen && "scale-0 opacity-0"
                )}
            >
                <MessageSquarePlus className="h-5 w-5" />
                <span className="font-medium">{t("button")}</span>
            </button>

            {/* Feedback Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="fixed bottom-6 left-6 md:left-auto md:right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                            <div className="flex items-center gap-2">
                                <MessageSquarePlus className="h-5 w-5 text-purple-500" />
                                <h3 className="font-semibold">{t("title")}</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                                    <h4 className="font-semibold text-lg">{t("successTitle")}</h4>
                                    <p className="text-muted-foreground text-sm">
                                        {t("successMessage")}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Category */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            {t("categoryLabel")}
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-3 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        >
                                            <option value="GENERAL">{t("categories.general")}</option>
                                            <option value="BUG">{t("categories.bug")}</option>
                                            <option value="FEATURE">{t("categories.feature")}</option>
                                            <option value="IMPROVEMENT">{t("categories.improvement")}</option>
                                        </select>
                                    </div>

                                    {/* Feedback Text */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            {t("feedbackLabel")}
                                        </label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder={t("placeholder")}
                                            className="w-full h-32 px-3 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !feedback.trim()}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t("submitting")}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                {t("submit")}
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        {t("reviewNote")}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
