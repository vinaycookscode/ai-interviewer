import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-2xl bg-sg-chip motion-reduce:animate-none", className)} />;
}

/** Placeholder for the employer screens while their data loads. */
export default function DashboardLoading() {
    const t = useTranslations("Employer");
    return (
        <div role="status" className="flex flex-col gap-6 sm:gap-9">
            <span className="sr-only">{t("loading")}</span>
            <div className="flex flex-col gap-3">
                <Bone className="h-11 w-56 max-w-full" />
                <Bone className="h-6 w-96 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Bone key={i} className="h-[92px] rounded-[24px]" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Bone className="h-[300px] rounded-[28px]" />
                <Bone className="h-[300px] rounded-[28px]" />
            </div>
        </div>
    );
}
