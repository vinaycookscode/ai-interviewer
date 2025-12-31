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

export const metadata: Metadata = {
  title: "Get Back To U",
  description: "AI-powered interview platform",
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
          <LimitProvider>
            <FeatureWatcher />
            <RateLimitBanner />
            {children}
            <Toaster />
            <AnalyticsTracker />
          </LimitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
