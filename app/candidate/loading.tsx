import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const bone = "sg-skeleton block";
const card = "sg-glass flex flex-col gap-3.5 rounded-[28px] p-7";

/** Any candidate page while it loads: a heading and three cards, inside the app shell (AIIN-137). Today has its own. */
export default async function CandidateLoading() {
    const t = await getTranslations("System");
    return (
        <div role="status" aria-busy="true" className="flex flex-col gap-7 sm:gap-10">
            <span className="sr-only">{t("loading")}</span>
            <div aria-hidden="true" className="flex flex-col gap-3">
                <span className={cn(bone, "h-10 w-[min(320px,70%)] rounded-xl")} />
                <span className={cn(bone, "h-[18px] w-[min(420px,90%)] rounded-full")} />
            </div>
            <div aria-hidden="true" className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
                <div className={card}>
                    <span className={cn(bone, "h-[22px] w-3/5 rounded-xl")} />
                    <span className={cn(bone, "h-3.5 w-full rounded-full")} />
                    <span className={cn(bone, "h-3.5 w-[85%] rounded-full")} />
                    <span className={cn(bone, "mt-2 h-12 w-[140px] rounded-full")} />
                </div>
                <div className={card}>
                    <span className={cn(bone, "h-[22px] w-1/2 rounded-xl")} />
                    <span className={cn(bone, "h-16 w-full rounded-[18px]")} />
                    <span className={cn(bone, "h-16 w-full rounded-[18px]")} />
                </div>
                <div className={cn(card, "items-center")}>
                    <span className={cn(bone, "h-[88px] w-40 rounded-full")} />
                    <span className={cn(bone, "h-[18px] w-2/5 rounded-full")} />
                </div>
            </div>
        </div>
    );
}
