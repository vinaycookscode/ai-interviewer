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
    default: "Get Back To U - AI Interviewer & Placement Platform",
    template: "%s | Get Back To U",
  },
  description: "Master your interviews with Get Back To U. AI-powered mock interviews, resume analysis, and placement programs to help you land your dream job.",
  keywords: [
    "AI Interviewer",
    "Mock Interview",
    "Placement Preparation",
    "Resume Builder",
    "Job Interview Practice",
    "Get Back To U",
    "Career Success"
  ],
  authors: [{ name: "Get Back To U Team" }],
  creator: "Get Back To U",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Get Back To U - Your AI Career Coach",
    description: "Practice interviews, perfect your resume, and get hired faster with our extensive AI placement platform.",
    siteName: "Get Back To U",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Get Back To U Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Back To U - AI Interviewer",
    description: "Practice interviews, perfect your resume, and get hired faster.",
    images: ["/opengraph-image.png"],
    creator: "@getbacktou",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
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
