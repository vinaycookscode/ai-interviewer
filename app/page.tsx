import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  Calendar,
  Building2,
  FileSearch,
  Users,
  UserCircle,
  DollarSign,
  Mic,
  Brain,
  Target,
  TrendingUp,
  CheckCircle2,
  Play
} from "lucide-react";
import { HomePricingSection } from "@/components/home/pricing-section";

export async function generateMetadata() {
  const t = await getTranslations("Home");
  return {
    title: t("hero.title") + " " + t("hero.titleAccent") + " | Get Back To U",
    description: t("hero.subtitle"),
  };
}

// Stats data (labels will be translated in the component)
const STATS_DATA = [
  { key: "practice", icon: Mic },
  { key: "success", icon: Target },
  { key: "companies", icon: Building2 },
  { key: "available", icon: Brain },
];

// Feature data (titles and descriptions will be translated in the component)
const FEATURES_DATA = [
  {
    key: "aiPractice",
    icon: Sparkles,
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "group-hover:shadow-violet-500/25",
  },
  {
    key: "placement",
    icon: Calendar,
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "group-hover:shadow-blue-500/25",
  },
  {
    key: "companyPrep",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "group-hover:shadow-emerald-500/25",
  },
  {
    key: "resumeScreener",
    icon: FileSearch,
    gradient: "from-orange-500 to-amber-500",
    bgGlow: "group-hover:shadow-orange-500/25",
  },
  {
    key: "studySquad",
    icon: Users,
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "group-hover:shadow-pink-500/25",
  },
  {
    key: "mentors",
    icon: UserCircle,
    gradient: "from-indigo-500 to-violet-500",
    bgGlow: "group-hover:shadow-indigo-500/25",
  },
  {
    key: "offerTracker",
    icon: DollarSign,
    gradient: "from-green-500 to-emerald-500",
    bgGlow: "group-hover:shadow-green-500/25",
  },
];

export default async function HomePage() {
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="liquid-glass liquid-shimmer liquid-specular border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Get Back To U Logo" width={40} height={40} className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Get Back To U
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.features")}</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
            <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.contact")}</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-500/25">
                {tCommon("getStarted")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav >

      {/* Hero Section */}
      < section className="relative py-24 md:py-32 lg:py-40" >
        < div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-emerald-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.15),transparent_70%)]" />

        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {t("hero.badge")}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                {t("hero.title")}
              </span>
              <br />
              <span className="text-foreground">{t("hero.titleAccent")}</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/40 transition-all">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-muted/50 backdrop-blur-sm">
                  <Play className="mr-2 h-5 w-5" />
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">{t("hero.trust.noCreditCard")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">{t("hero.trust.freeForever")}</span>
              </div>
              <div className="flex items-center gap-2 hidden sm:flex">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">{t("hero.trust.cancelAnytime")}</span>
              </div>
            </div>
          </div>
        </div>
      </section >

      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-teal-500/5 to-emerald-500/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS_DATA.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-gradient-to-br from-background to-muted/50 border border-border/50 backdrop-blur-sm"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 mb-4">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {t(`stats.${stat.key}.value`)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {t(`stats.${stat.key}.label`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">{t("features.badge")}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                {t("features.title")}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {FEATURES_DATA.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`group relative overflow-hidden border-2 border-transparent hover:border-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${feature.bgGlow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <CardContent className="pt-6 pb-6 space-y-4 relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-foreground transition-colors">
                      {t(`features.items.${feature.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(`features.items.${feature.key}.description`)}
                    </p>
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>{t("features.learnMore")}</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <HomePricingSection />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-teal-600/20 to-emerald-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.2),transparent_70%)]" />

        <div className="absolute top-10 right-20 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                {t("cta.title")}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-xl shadow-cyan-500/30">
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy, Terms, Contact Section */}
      <section id="legal" className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div id="privacy" className="scroll-mt-20">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {t("legal.privacy.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("legal.privacy.content")}
              </p>
            </div>

            <div id="terms" className="scroll-mt-20">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {t("legal.terms.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("legal.terms.content")}
              </p>
            </div>

            <div id="contact" className="scroll-mt-20">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
                {t("legal.contact.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("legal.contact.content")}
                <br />
                <a href="mailto:hello@getbacktou.com" className="text-cyan-400 hover:underline">
                  hello@getbacktou.com
                </a>
                <br />
                <a href="tel:+918600137191" className="text-cyan-400 hover:underline">
                  +91 8600137191
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Get Back To U Logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Get Back To U
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#privacy" className="hover:text-foreground transition-colors">{t("footer.privacy")}</a>
              <a href="#terms" className="hover:text-foreground transition-colors">{t("footer.terms")}</a>
              <a href="#contact" className="hover:text-foreground transition-colors">{t("footer.contact")}</a>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div >
  );
}
