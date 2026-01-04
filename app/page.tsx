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

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Mock Interviews & Placement Prep | Get Back To U",
  description: "Get hired faster with Get Back To U. Practice with our AI interviewer, receive instant feedback, and follow our 90-day placement program track.",
};

// Enable ISR - regenerate page every hour
export const revalidate = 3600;

// Feature data with unique gradients
const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Practice Interviews",
    description: "Practice with our AI interviewer anytime. Get instant feedback and improve your interview skills.",
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "group-hover:shadow-violet-500/25",
  },
  {
    icon: Calendar,
    title: "90-Day Placement Program",
    description: "Structured 90-day roadmap to land your dream job with daily tasks and milestone tracking.",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "group-hover:shadow-blue-500/25",
  },
  {
    icon: Building2,
    title: "Company Prep",
    description: "Company-specific interview preparation with tailored questions and insights.",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "group-hover:shadow-emerald-500/25",
  },
  {
    icon: FileSearch,
    title: "Resume Screener",
    description: "AI-powered resume analysis, JD matching, and cover letter generation.",
    gradient: "from-orange-500 to-amber-500",
    bgGlow: "group-hover:shadow-orange-500/25",
  },
  {
    icon: Users,
    title: "Study Squad",
    description: "Join collaborative learning groups and prepare together with peers.",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "group-hover:shadow-pink-500/25",
  },
  {
    icon: UserCircle,
    title: "Find Mentors",
    description: "Connect with industry mentors who can guide your career journey.",
    gradient: "from-indigo-500 to-violet-500",
    bgGlow: "group-hover:shadow-indigo-500/25",
  },
  {
    icon: DollarSign,
    title: "Offer Tracker",
    description: "Manage and compare multiple job offers with our smart comparison tool.",
    gradient: "from-green-500 to-emerald-500",
    bgGlow: "group-hover:shadow-green-500/25",
  },
];

// Stats data
const STATS = [
  { value: "10,000+", label: "Practice Sessions", icon: Mic },
  { value: "95%", label: "Success Rate", icon: Target },
  { value: "500+", label: "Companies Covered", icon: Building2 },
  { value: "24/7", label: "AI Available", icon: Brain },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="border-b backdrop-blur-xl bg-background/70 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Get Back To U Logo" width={40} height={40} className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Get Back To U
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-500/25">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 lg:py-40">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-emerald-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.15),transparent_70%)]" />

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                #1 AI Interview Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Ace Your
              </span>
              <br />
              <span className="text-foreground">AI Interview</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the most realistic AI mock interviews, get instant feedback,
              and follow our 90-day placement program to land your dream job.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/40 transition-all">
                  Start AI Interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-muted/50 backdrop-blur-sm">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-8 pt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">Free forever plan</span>
              </div>
              <div className="flex items-center gap-2 hidden sm:flex">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-teal-500/5 to-emerald-500/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((stat, index) => {
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
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{index === 0 ? "AI Interviews" : stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Everything You Need</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to prepare, practice, and land your dream job
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`group relative overflow-hidden border-2 border-transparent hover:border-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${feature.bgGlow}`}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                  <CardContent className="pt-6 pb-6 space-y-4 relative">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold group-hover:text-foreground transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Arrow indicator */}
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Learn more</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-teal-600/20 to-emerald-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.2),transparent_70%)]" />

        {/* Floating Orbs */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Ready to{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Transform
              </span>
              {" "}Your Career?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of job seekers who have accelerated their career with our AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-xl shadow-cyan-500/30">
                  Get Started Free
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
            {/* Privacy */}
            <div id="privacy" className="scroll-mt-20">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Privacy Policy
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We collect only essential information to provide our services. Your data is encrypted, never sold,
                and you can delete your account anytime. AI processing is done securely with your consent.
              </p>
            </div>

            {/* Terms */}
            <div id="terms" className="scroll-mt-20">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Terms of Service
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By using Get Back To U, you agree to use our services responsibly. AI feedback is guidance only -
                we don&apos;t guarantee specific outcomes. Your content remains yours.
              </p>
            </div>

            {/* Contact */}
            <div id="contact" className="scroll-mt-20">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
                Contact Us
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Questions? Call us at{" "}
                <a href="tel:+918600137191" className="text-cyan-400 hover:underline">
                  +91 8600137191
                </a>
                <br />
                Support hours: Mon-Fri, 9AM-6PM IST
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
              <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Get Back To U. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
