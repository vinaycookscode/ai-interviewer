import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { LimitProvider } from "@/components/providers/limit-provider";
import { RateLimitBanner } from "@/components/ui/rate-limit-banner";
import { FeatureWatcher } from "@/components/feature-watcher";
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/en.json'; // Direct import for performance & simplicity
import JsonLd from "@/components/seo/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://getbacktou.com"),
  title: {
    default: "AI Mock Interviews & Placement Prep | Get Back To U",
    template: "%s | Get Back To U",
  },
  description: "Practice AI-powered mock interviews, study with flashcards, and prepare for job placements. Get personalized feedback, resume analysis, and interview coaching to land your dream job faster.",
  keywords: [
    // Primary Keywords
    "AI Interview",
    "AI Interviewer",
    "Mock Interview",
    "Interview Practice",
    "Job Interview Preparation",
    // Study & Learning
    "Study for Interview",
    "Interview Flashcards",
    "DSA Practice",
    "System Design Interview",
    "Behavioral Interview",
    "Technical Interview Prep",
    // Career & Placement
    "Placement Preparation",
    "Campus Placement",
    "Job Placement Program",
    "Career Coaching",
    "Interview Coaching",
    // Features
    "Resume Screener",
    "Resume Builder",
    "Resume Analysis",
    "ATS Resume Check",
    "Cover Letter Generator",
    // Company Specific
    "FAANG Interview Prep",
    "Google Interview Practice",
    "Amazon Interview Prep",
    "Microsoft Interview",
    "Tech Interview",
    // General
    "Get Back To U",
    "Career Success",
    "Job Search Help",
    "Interview Tips",
    "Land Your Dream Job"
  ],
  authors: [{ name: "Get Back To U Team" }],
  creator: "Get Back To U",
  publisher: "Get Back To U",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "AI Mock Interviews & Career Prep | Get Back To U",
    description: "Practice AI-powered interviews, study with flashcards, get resume feedback, and prepare for placements. Land your dream job with personalized coaching.",
    siteName: "Get Back To U",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Get Back To U - AI Interview Practice Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Mock Interviews & Placement Prep | Get Back To U",
    description: "Practice AI interviews, study flashcards, get resume feedback. Land your dream job faster.",
    images: ["/opengraph-image.png"],
    creator: "@getbacktou",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  category: "Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages} locale="en">
            <LimitProvider>
              <FeatureWatcher />
              <RateLimitBanner />
              {children}
              <Toaster />
              <AnalyticsTracker />
              <JsonLd />
            </LimitProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
