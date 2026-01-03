import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Zap, Users, BarChart, Shield, Clock, Sparkles } from "lucide-react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Mock Interviews & Placement Prep",
  description: "Get hired faster with Get Back To U. Practice with our AI interviewer, receive instant feedback, and follow our 90-day placement program track.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Get Back To U Logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get Back To U
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div >
      </nav >

      {/* Hero Section */}
      < section className="relative overflow-hidden" >
        {/* Gradient Background */}
        < div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                ✨ AI-Powered Hiring Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-300%">
                Smart Interviews,
              </span>
              <br />
              <span className="text-foreground">Better Hires</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your hiring process with AI-powered interviews. Screen candidates efficiently,
              get instant insights, and make data-driven decisions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="space-y-1">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  10x
                </div>
                <div className="text-sm text-muted-foreground">Faster Screening</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  95%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Features Section */}
      < section className="py-24 bg-muted/30" >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to conduct professional AI-powered interviews
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced AI evaluates candidate responses in real-time, providing instant scoring and insights.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Smart Candidate Screening</h3>
                <p className="text-muted-foreground">
                  Automatically screen hundreds of candidates and identify top performers efficiently.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Detailed Analytics</h3>
                <p className="text-muted-foreground">
                  Get comprehensive reports with score distributions, performance metrics, and trends.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Flexible Scheduling</h3>
                <p className="text-muted-foreground">
                  Schedule interviews at any time. Candidates can take interviews when it suits them best.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Secure & Compliant</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security with document verification and data protection.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Custom Questions</h3>
                <p className="text-muted-foreground">
                  AI-generated questions tailored to your job requirements or create your own.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-24 relative overflow-hidden" >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join innovative companies using AI to find the best talent faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 shadow-xl">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="border-t py-8 bg-muted/30" >
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p>© 2025 Get Back To U. All rights reserved.</p>
          </div>
        </div>
      </footer >
    </div >
  );
}
