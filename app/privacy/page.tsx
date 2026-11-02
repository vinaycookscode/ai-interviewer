import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { CONTACT_EMAIL, DATA_OPERATOR } from "@/lib/legal";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface Section {
    id: string;
    title: string;
    body?: string[];
    list?: string[];
    table?: { head: string[]; rows: string[][] };
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Privacy");
    return { title: t("metaTitle"), description: t("metaDescription") };
}

const h2 = "font-display sg-soft text-2xl font-semibold leading-[30px]";
const th = "border-b border-sg-rule px-3 py-2.5 text-left text-[13px] font-bold leading-[18px] text-sg-muted";
const td = "border-b border-sg-rule p-3 align-top leading-6";

function Table({ table }: { table: NonNullable<Section["table"]> }) {
    return (
        <div className="overflow-x-auto rounded-[18px] bg-sg-row">
            <table className="w-full min-w-[520px] border-collapse text-[15px]">
                <thead>
                    <tr>
                        {table.head.map((h) => (
                            <th key={h} scope="col" className={th}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((r) => (
                        <tr key={r[0]}>
                            {r.map((cell, i) =>
                                i === 0 ? (
                                    <th key={i} scope="row" className={cn(td, "text-left font-semibold")}>
                                        {cell}
                                    </th>
                                ) : (
                                    <td key={i} className={td}>
                                        {cell}
                                    </td>
                                )
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** The privacy policy (AIIN-222, approved Privacy artboards). Public; every claim matches what the code does. */
export default async function PrivacyPage() {
    const t = await getTranslations("Privacy");
    const sections = t.raw("sections") as Section[];
    const short = t.raw("short") as string[];
    const fill = (s: string) => s.replace("{operator}", DATA_OPERATOR).replace("{email}", CONTACT_EMAIL);

    return (
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <div className="relative mx-auto flex max-w-[1160px] flex-col gap-6 px-4 pb-10 pt-4 sm:px-8">
                <header className="sg-glass flex items-center justify-between gap-3 rounded-[28px] py-2 pl-3.5 pr-2">
                    <Link href="/" className={cn("flex items-center gap-2.5 rounded-full", focusRing)}>
                        <UMark />
                        <span className="font-display sg-soft whitespace-nowrap text-lg font-semibold">Get Back To U</span>
                    </Link>
                    <ThemeSwitch />
                </header>

                <main className="flex flex-wrap items-start gap-8 pt-2 sm:pt-6">
                    <nav aria-label={t("onThisPage")} className="sg-glass sticky top-4 hidden flex-[0_0_240px] rounded-[24px] p-3 lg:block">
                        <span className="block px-3 pb-2 pt-1.5 text-[13px] font-bold text-sg-muted">{t("onThisPage")}</span>
                        <ol className="flex flex-col gap-0.5">
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <a href={`#pv-${s.id}`} className={cn("block rounded-xl px-3 py-2 font-semibold text-sg-muted hover:bg-sg-chip hover:text-sg-text", focusRing)}>
                                        {s.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <article className="sg-glass sg-shadow-lg flex min-w-0 max-w-[820px] flex-[1_1_520px] flex-col gap-8 rounded-[24px] p-5 sm:rounded-[32px] sm:p-11">
                        <header className="flex flex-col gap-2.5">
                            <span className="text-[13px] font-bold leading-[18px] text-sg-muted">{t("updatedLabel", { date: t("updated") })}</span>
                            <h1 className="font-display sg-soft text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[52px]">{t("title")}</h1>
                            <p className="text-lg leading-7 text-sg-muted">{t("lead")}</p>
                        </header>

                        <section aria-labelledby="pv-short" className="flex flex-col gap-2.5 rounded-[20px] bg-sg-lavender-soft px-5 py-4.5">
                            <h2 id="pv-short" className="font-display sg-soft text-xl font-semibold leading-[26px]">
                                {t("inShort")}
                            </h2>
                            <ul className="flex list-disc flex-col gap-1.5 pl-5.5 leading-[26px]">
                                {short.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </section>

                        {sections.map((s) => (
                            <section key={s.id} aria-labelledby={`pv-${s.id}`} className="flex scroll-mt-6 flex-col gap-3.5">
                                <h2 id={`pv-${s.id}`} className={h2}>
                                    {s.title}
                                </h2>
                                {s.id !== "rights" && s.body?.map((b) => <p key={b} className="leading-[27px]">{fill(b)}</p>)}
                                {s.table && <Table table={s.table} />}
                                {s.list && (
                                    <ul className="flex list-disc flex-col gap-2 pl-5.5 leading-[27px]">
                                        {s.list.map((i) => (
                                            <li key={i}>{fill(i)}</li>
                                        ))}
                                    </ul>
                                )}
                                {s.id === "rights" && s.body?.map((b) => <p key={b} className="leading-[27px]">{fill(b)}</p>)}
                            </section>
                        ))}
                    </article>
                </main>
            </div>
        </div>
    );
}
