import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const block = "animate-pulse rounded-full bg-sg-track motion-reduce:animate-none";
const card = "sg-glass flex flex-col gap-4 rounded-3xl p-5 sm:rounded-[28px] sm:p-7";

/** Today, while it loads: the same layout as the page, in track-coloured blocks. Renders inside the app shell. */
export default async function CandidateDashboardLoading() {
    const t = await getTranslations("Today");
    return (
        <div role="status" aria-busy="true" className="flex flex-col gap-6 sm:gap-9">
            <span className="sr-only">{t("loading")}</span>

            <div aria-hidden="true" className="flex flex-wrap items-end gap-x-6 gap-y-4">
                <div className={cn(block, "size-20 rounded-[28px] sm:size-[104px]")} />
                <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
                    <div className={cn(block, "h-12 w-full max-w-[420px] rounded-[20px]")} />
                    <div className={cn(block, "h-10 w-3/4 max-w-[360px] sm:h-12")} />
                </div>
            </div>

            <div aria-hidden="true" className={cn(card, "sg-shadow-lg grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))]")}>
                <div className="flex flex-col gap-[18px]">
                    <div className={cn(block, "h-5 w-40")} />
                    <div className={cn(block, "h-8 w-56 max-w-full")} />
                    <div className="flex flex-wrap gap-2">
                        <div className={cn(block, "h-8 w-28")} />
                        <div className={cn(block, "h-8 w-28")} />
                        <div className={cn(block, "h-8 w-32")} />
                    </div>
                    <div className={cn(block, "h-[52px] w-full rounded-2xl")} />
                    <div className={cn(block, "h-[52px] w-full rounded-2xl")} />
                </div>
                <div className={cn(block, "min-h-[240px] w-full rounded-[22px]")} />
            </div>

            <div aria-hidden="true" className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
                {[0, 1, 2].map((i) => (
                    <div key={i} className={card}>
                        <div className={cn(block, "h-7 w-40")} />
                        <div className={cn(block, "h-24 w-full rounded-2xl")} />
                        <div className={cn(block, "h-12 w-full rounded-2xl")} />
                    </div>
                ))}
            </div>
        </div>
    );
}
