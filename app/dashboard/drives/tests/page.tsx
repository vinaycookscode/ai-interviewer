import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, CheckCircle2, GraduationCap, List, Lock } from "lucide-react";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { listTests } from "@/lib/aptitude-loaders";
import { PageHeading } from "@/components/jobs/employer-ui";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { focusRing } from "@/components/soft-glass/classes";
import { DrivesTabs } from "@/components/drives/drives-tabs";
import { CopyTestButton, NewTestButton } from "@/components/aptitude/test-buttons";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("AptitudeTests");
    return { title: t("title") };
}

/** Aptitude tests: ready-made ones and the employer's own (AIIN-226), from the approved "Aptitude tests" artboards. */
export default async function AptitudeTestsPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("AptitudeTests");
    const tests = await listTests(userId);
    const mine = tests.filter((x) => !x.readyMade);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading title={t("title")} subtitle={t("subtitle")} actions={<NewTestButton />} />
            <DrivesTabs current="tests" label={t("tabs")} drives={t("drivesTab")} tests={t("testsTab")} />
            {mine.length === 0 && (
                <EmptyState icon={<GraduationCap className="size-7" aria-hidden="true" />} title={t("noneTitle")}>
                    {t("noneBody")}
                </EmptyState>
            )}
            <ul className="flex flex-col gap-2.5">
                {tests.map((x) => (
                    <li key={x.id} className="sg-glass flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[22px] px-5 py-4">
                        <span className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                            {x.readyMade ? (
                                <strong className="text-[17px] break-words">{x.name}</strong>
                            ) : (
                                <Link href={`/dashboard/drives/tests/${x.id}`} className={cn("self-start rounded-md text-[17px] font-bold break-words", focusRing)}>
                                    {x.name}
                                </Link>
                            )}
                            <span className="text-sm text-sg-muted">
                                {x.readyMade ? t("readyMade", { sections: x.sections.join(", ").toLowerCase() }) : t("yours", { count: x.sections.length })}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[13px]">
                                <List className="size-3.5" aria-hidden="true" />
                                {t("meta", { questions: x.questions, asks: x.asks, minutes: x.minutes })}
                            </span>
                        </span>
                        <span className="text-sm text-sg-muted">{t("usedIn", { count: x.usedIn })}</span>
                        {x.locked ? (
                            <Chip icon={Lock} label={t("locked")} />
                        ) : x.ready ? (
                            <Chip icon={CheckCircle2} label={t("ready")} tone="text-sg-success" />
                        ) : (
                            <Chip icon={AlertTriangle} label={t("needsMore", { count: x.missing })} />
                        )}
                        {x.readyMade && <CopyTestButton id={x.id} />}
                    </li>
                ))}
            </ul>
            <p className="text-[13px] text-sg-muted">{t("readyMadeNote")}</p>
        </div>
    );
}

function Chip({ icon: Icon, label, tone = "text-sg-text" }: { icon: typeof Lock; label: string; tone?: string }) {
    return (
        <span className={cn("inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold whitespace-nowrap", tone)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}
