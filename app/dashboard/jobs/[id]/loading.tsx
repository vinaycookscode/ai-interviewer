import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-2xl bg-sg-chip motion-reduce:animate-none", className)} />;
}

/** Placeholder for a job while it loads. */
export default function JobDetailsLoading() {
    const t = useTranslations("Employer");
    return (
        <div role="status" className="flex flex-col gap-6 sm:gap-9">
            <span className="sr-only">{t("loading")}</span>
            <div className="flex flex-col gap-3">
                <Bone className="h-5 w-16" />
                <Bone className="h-11 w-72 max-w-full" />
                <div className="flex flex-wrap gap-2">
                    <Bone className="h-8 w-28 rounded-full" />
                    <Bone className="h-8 w-44 rounded-full" />
                </div>
            </div>
            <div className="flex flex-wrap items-start gap-6">
                <Bone className="h-[360px] min-w-0 flex-[999_1_640px] rounded-[28px]" />
                <Bone className="h-[260px] min-w-[min(260px,100%)] flex-[1_1_300px] rounded-[28px]" />
            </div>
        </div>
    );
}
