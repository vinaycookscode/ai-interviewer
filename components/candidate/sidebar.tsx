"use client";

import { LayoutDashboard, Sparkles, User, FileText, TrendingUp } from "lucide-react";
import { AppSidebar, NavItem } from "@/components/layout/app-sidebar";
import { FEATURES } from "@/lib/features";

interface SidebarProps {
    featureFlags?: Record<string, boolean>;
}

const CANDIDATE_NAV_ITEMS: NavItem[] = [
    {
        icon: LayoutDashboard,
        labelKey: "myInterviews",
        href: "/candidate/dashboard",
    },
    {
        icon: TrendingUp,
        labelKey: "analytics",
        href: "/candidate/dashboard/analytics",
        featureKey: FEATURES.ANALYTICS,
        colorClass: "text-green-500",
    },
    {
        icon: Sparkles,
        labelKey: "aiPractice",
        href: "/candidate/practice",
        featureKey: FEATURES.PRACTICE_INTERVIEWS,
        colorClass: "text-purple-500",
    },
    {
        icon: User,
        labelKey: "profile",
        href: "/candidate/profile",
    },
    {
        icon: FileText,
        labelKey: "resumeScreener",
        href: "/candidate/resume-screener",
        featureKey: FEATURES.RESUME_SCREENER,
        colorClass: "text-blue-500",
    },
];

export function CandidateSidebar({ featureFlags }: SidebarProps) {
    return (
        <AppSidebar
            items={CANDIDATE_NAV_ITEMS}
            featureFlags={featureFlags}
        />
    );
}
