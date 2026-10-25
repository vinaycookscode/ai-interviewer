import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { Mascot, UMark } from "@/components/soft-glass/mascot";
import { ScoreGauge } from "@/components/soft-glass/score-gauge";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { LandingMenu } from "@/components/soft-glass/landing-menu";
import { coralButton as coralBase, focusRing } from "@/components/soft-glass/classes";
import { LandingPricing } from "@/components/home/landing-pricing";

const CONTACT_EMAIL = "hello@getbacktou.com";
const CONTACT_PHONE = "+91 8600137191";

export async function generateMetadata() {
    const t = await getTranslations("Landing.meta");
    return { title: t("title"), description: t("description") };
}

interface TitledItem {
    title: string;
    body: string;
}

const coralButton = cn(coralBase, "h-14 px-7 text-[17px]");
const sectionTitle = "font-display sg-soft text-[32px] font-semibold leading-[38px] tracking-[-0.025em] sm:text-[44px] sm:leading-[50px]";

export default async function HomePage() {
    const t = await getTranslations("Landing");
    const tHome = await getTranslations("Home");

    const steps = t.raw("how.steps") as TitledItem[];
    const features = t.raw("features.items") as TitledItem[];
    const employerItems = t.raw("employers.items") as TitledItem[];
    const faqs = t.raw("faq.items") as { q: string; a: string }[];
    const stepBadges = ["bg-sg-coral text-sg-coral-ink", "bg-sg-lavender-soft text-sg-lavender-ink", "bg-sg-ink text-sg-ink-foreground"];
    const navLinks = [
        { href: "#how", label: t("nav.how") },
        { href: "#employers", label: t("nav.employers") },
        { href: "#pricing", label: t("nav.pricing") },
    ];

    return (
        // overflow-x-clip, not overflow-hidden: hidden makes a scroll container and breaks the sticky header.
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
            <AmbientLight />

            <div className="relative mx-auto flex max-w-[1160px] flex-col gap-16 px-4 pt-4 sm:gap-28 sm:px-8 sm:pt-6">
                {/* Sized to fit a 320px phone: below 360px "Start free" moves into the menu (the hero CTA sits right below). */}
                <header className="sg-bar sticky top-4 z-50 flex items-center justify-between gap-2 rounded-full py-2 pl-3 pr-2 sm:gap-3 sm:pl-4">
                    <Link href="/" className={cn("flex items-center gap-2 rounded-full sm:gap-2.5", focusRing)}>
                        <UMark className="size-7 sm:size-8" />
                        <span className="whitespace-nowrap font-display sg-soft text-base font-semibold sm:text-xl">Get Back To U</span>
                    </Link>
                    <nav aria-label={t("nav.label")} className="hidden items-center gap-1 lg:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={cn("whitespace-nowrap rounded-full px-3.5 py-2 font-semibold text-sg-muted transition-colors hover:text-sg-text", focusRing)}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-1">
                        <ThemeSwitch className="hidden sm:inline-flex" />
                        <Link href="/auth/login" className={cn("hidden whitespace-nowrap rounded-full px-4 py-2.5 font-semibold sm:inline-flex", focusRing)}>
                            {t("nav.signIn")}
                        </Link>
                        <Link
                            href="/auth/register"
                            className={cn(
                                "hidden h-10 items-center whitespace-nowrap rounded-full bg-sg-ink px-3.5 text-[15px] font-bold text-sg-ink-foreground transition-opacity hover:opacity-90 min-[360px]:inline-flex sm:px-[18px] sm:text-base",
                                focusRing
                            )}
                        >
                            {t("nav.startFree")}
                        </Link>
                        <LandingMenu
                            links={navLinks}
                            labels={{
                                nav: t("nav.label"),
                                open: t("nav.menuOpen"),
                                close: t("nav.menuClose"),
                                signIn: t("nav.signIn"),
                                startFree: t("nav.startFree"),
                                theme: t("nav.theme"),
                            }}
                            className="lg:hidden"
                        />
                    </div>
                </header>

                <main className="flex flex-col gap-16 sm:gap-28">
                    <section aria-labelledby="hero-title" className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="flex flex-col gap-6">
                            <h1
                                id="hero-title"
                                className="font-display sg-soft text-[38px] font-semibold leading-[42px] tracking-[-0.035em] text-balance min-[360px]:text-[44px] min-[360px]:leading-[48px] sm:text-[56px] sm:leading-[60px] lg:text-[62px] lg:leading-[66px]"
                            >
                                {t("hero.title")}
                            </h1>
                            <p className="max-w-[520px] text-lg leading-[30px] text-sg-muted sm:text-[19px]">{t("hero.subtitle")}</p>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Link href="/auth/register" className={coralButton}>
                                    {t("hero.primary")}
                                </Link>
                                <a href="#how" className={cn("sg-glass inline-flex h-14 items-center justify-center rounded-full px-6 font-bold", focusRing)}>
                                    {t("hero.secondary")}
                                </a>
                            </div>
                            <p className="text-sm text-sg-muted">{t("hero.note")}</p>
                        </div>

                        {/* Product preview built from the real interview UI pieces. */}
                        <div aria-hidden="true" className="sg-glass sg-shadow-lg mx-auto flex w-full max-w-[540px] flex-col gap-5 rounded-[32px] p-6 sm:p-7">
                            <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full bg-sg-lavender-soft px-3 py-1 text-[13px] font-bold text-sg-lavender-ink">
                                    {t("preview.progress")}
                                </span>
                                <span className="flex gap-1">
                                    <span className="h-1.5 w-2.5 rounded-full bg-sg-coral" />
                                    <span className="h-1.5 w-2.5 rounded-full bg-sg-coral" />
                                    <span className="h-1.5 w-[22px] rounded-full bg-sg-ink" />
                                    <span className="h-1.5 w-2.5 rounded-full bg-sg-track" />
                                    <span className="h-1.5 w-2.5 rounded-full bg-sg-track" />
                                </span>
                            </div>
                            <p className="font-display sg-soft text-[26px] font-semibold leading-[33px] tracking-[-0.015em]">
                                {t("preview.question")}
                            </p>
                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] font-bold leading-[18px] text-sg-muted">{t("preview.answerLabel")}</span>
                                <p className="rounded-[18px] bg-sg-row px-4 py-3.5 text-[15px] leading-[23px] text-sg-muted">
                                    {t("preview.transcript")}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3.5 rounded-[22px] bg-sg-lavender-soft p-[18px]">
                                <div className="flex items-center gap-3.5">
                                    <ScoreGauge value={9} showValue={false} className="w-16" arcClassName="stroke-sg-lavender-ink" />
                                    <div className="flex flex-col">
                                        <span className="flex items-baseline gap-1">
                                            <span className="font-display text-[28px] font-semibold leading-[30px]">9.0</span>
                                            <span className="text-sm font-semibold text-sg-muted">{t("preview.outOf")}</span>
                                        </span>
                                        <span className="text-[13px] font-bold leading-[18px] text-sg-lavender-ink">{t("preview.scoreNote")}</span>
                                    </div>
                                </div>
                                <div className="h-px bg-sg-rule" />
                                <div className="flex items-center gap-3">
                                    <Mascot className="size-10" />
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold leading-[18px] text-sg-muted">{t("preview.tipLabel")}</span>
                                        <span className="text-[15px] font-semibold leading-[22px]">{t("preview.tip")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="how" aria-labelledby="how-title" className="flex scroll-mt-24 flex-col gap-8">
                        <h2 id="how-title" className={cn(sectionTitle, "max-w-[640px]")}>
                            {t("how.title")}
                        </h2>
                        {/* Phones get compact rows (number beside the text); md+ gets three columns. */}
                        <ol className="grid gap-3 sm:gap-5 md:grid-cols-3">
                            {steps.map((step, i) => (
                                <li key={step.title} className="sg-glass flex gap-4 rounded-[24px] p-5 sm:p-7 md:flex-col md:gap-3 md:rounded-[28px]">
                                    <span
                                        className={cn(
                                            "flex size-11 shrink-0 items-center justify-center rounded-[14px] font-display text-[22px] font-bold",
                                            stepBadges[i]
                                        )}
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="flex flex-col gap-1 md:gap-3">
                                        <h3 className="text-lg font-bold md:text-xl">{step.title}</h3>
                                        <p className="text-sg-muted">{step.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section aria-label={t("features.label")} className="grid gap-3 sm:gap-5 md:grid-cols-2">
                        {features.map((feature) => (
                            <div key={feature.title} className="sg-glass flex flex-col gap-2 rounded-[24px] p-6 sm:gap-2.5 sm:rounded-[32px] sm:p-8">
                                <h3 className="font-display sg-soft text-[23px] font-semibold leading-[29px] sm:text-[28px] sm:leading-[34px]">{feature.title}</h3>
                                <p className="text-sg-muted">{feature.body}</p>
                            </div>
                        ))}
                    </section>

                    <section
                        id="employers"
                        aria-labelledby="employers-title"
                        className="grid scroll-mt-24 items-center gap-8 rounded-[28px] bg-sg-ink p-6 text-sg-ink-foreground sm:gap-10 sm:rounded-[36px] sm:p-12 lg:grid-cols-2"
                    >
                        <div className="flex flex-col gap-4">
                            <p className="font-bold opacity-80">{t("employers.eyebrow")}</p>
                            <h2 id="employers-title" className="font-display sg-soft text-[32px] font-semibold leading-[38px] tracking-[-0.025em] sm:text-[42px] sm:leading-[48px]">
                                {t("employers.title")}
                            </h2>
                            <p className="text-[17px] leading-[27px] opacity-80">{t("employers.body")}</p>
                            <a
                                href={`mailto:${CONTACT_EMAIL}`}
                                className={cn(
                                    "inline-flex h-[52px] items-center self-start rounded-full bg-sg-ink-foreground px-6 font-bold text-sg-ink transition-opacity hover:opacity-90",
                                    focusRing
                                )}
                            >
                                {t("employers.cta")}
                            </a>
                            <p className="text-sm opacity-80">{t("employers.note")}</p>
                        </div>
                        <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                            {employerItems.map((item) => (
                                <li key={item.title} className="flex flex-col gap-1 rounded-2xl bg-sg-ink-foreground/[0.08] p-4 sm:gap-1.5 sm:rounded-[20px] sm:p-[18px]">
                                    <span className="font-bold">{item.title}</span>
                                    <span className="text-[15px] opacity-80">{item.body}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <LandingPricing />

                    <section aria-labelledby="faq-title" className="grid gap-10 md:grid-cols-2">
                        <h2 id="faq-title" className={sectionTitle}>
                            {t("faq.title")}
                        </h2>
                        <dl className="flex flex-col gap-5">
                            {faqs.map((faq, i) => (
                                <div key={faq.q} className={cn("pb-5", i < faqs.length - 1 && "border-b border-sg-rule")}>
                                    <dt className="text-lg font-bold">{faq.q}</dt>
                                    <dd className="mt-1.5 text-sg-muted">{faq.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section aria-labelledby="closing-title" className="flex flex-col items-center gap-6 py-6 text-center">
                        <Mascot className="size-24" />
                        <h2
                            id="closing-title"
                            className="max-w-[700px] font-display sg-soft text-[40px] font-semibold leading-[44px] tracking-[-0.03em] text-balance sm:text-[52px] sm:leading-[56px]"
                        >
                            {t("closing.title")}
                        </h2>
                        <Link href="/auth/register" className={coralButton}>
                            {t("closing.cta")}
                        </Link>
                    </section>

                    <section aria-label={tHome("legal.contact.title")} className="grid gap-5 md:grid-cols-3">
                        <div id="privacy" className="sg-glass scroll-mt-24 rounded-[24px] p-6">
                            <h3 className="mb-2 font-bold">{tHome("legal.privacy.title")}</h3>
                            <p className="text-sm leading-relaxed text-sg-muted">{tHome("legal.privacy.content")}</p>
                        </div>
                        <div id="terms" className="sg-glass scroll-mt-24 rounded-[24px] p-6">
                            <h3 className="mb-2 font-bold">{tHome("legal.terms.title")}</h3>
                            <p className="text-sm leading-relaxed text-sg-muted">{tHome("legal.terms.content")}</p>
                        </div>
                        <div id="contact" className="sg-glass scroll-mt-24 rounded-[24px] p-6">
                            <h3 className="mb-2 font-bold">{tHome("legal.contact.title")}</h3>
                            <p className="text-sm leading-relaxed text-sg-muted">
                                {tHome("legal.contact.content", { email: CONTACT_EMAIL, phone: CONTACT_PHONE })}
                            </p>
                            <div className="mt-3 flex flex-col gap-1 text-sm font-semibold">
                                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
                                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="hover:underline">{CONTACT_PHONE}</a>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-sg-rule pb-9 pt-7 text-sm text-sg-muted">
                    <div className="flex items-center gap-2.5">
                        <UMark className="size-6" />
                        <span>{tHome("footer.rights")}</span>
                    </div>
                    <nav aria-label={t("footer.label")} className="flex flex-wrap gap-5">
                        <a href="#privacy" className="hover:text-sg-text">{tHome("footer.privacy")}</a>
                        <a href="#terms" className="hover:text-sg-text">{tHome("footer.terms")}</a>
                        <a href="#contact" className="hover:text-sg-text">{tHome("footer.contact")}</a>
                    </nav>
                </footer>
            </div>
        </div>
    );
}
