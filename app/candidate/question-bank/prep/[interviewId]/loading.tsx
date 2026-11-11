import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

/** Shown while the prep set is picked the first time, which takes Gemini a few seconds (AIIN-213). Not async, so a
 * "not found" from the page can replace it. */
export default function PrepSetLoading() {
    const t = useTranslations("QuestionBank.prep");
    return (
        <div className="sg-glass flex flex-col items-center gap-3 rounded-[24px] px-6 py-16 text-center sm:rounded-[28px]">
            <Loader2 className="size-8 animate-spin text-sg-lavender-ink" aria-hidden="true" />
            <p role="status" className="font-display sg-soft text-[22px] font-semibold leading-7">
                {t("loading")}
            </p>
        </div>
    );
}
