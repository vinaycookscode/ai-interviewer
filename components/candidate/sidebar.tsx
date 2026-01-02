"use client";

import {
    LayoutDashboard,
    Sparkles,
    User,
    FileText,
    TrendingUp,
    GraduationCap,
    Building2,
    Users,
    UserCheck,
    BriefcaseBusiness
} from "lucide-react";
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
        icon: FileText,
        labelKey: "resumeScreener",
        href: "/candidate/resume-screener",
        featureKey: FEATURES.RESUME_SCREENER,
        colorClass: "text-blue-500",
    },
    // Placement Platform Section
    {
        isDivider: true,
    },
    {
        icon: GraduationCap,
        labelKey: "placementProgram",
        href: "/candidate/placement-program",
        featureKey: FEATURES.PLACEMENT_PROGRAM,
        colorClass: "text-orange-500",
    },
    {
        icon: Building2,
        labelKey: "companyPrep",
        href: "/candidate/company-prep",
        featureKey: FEATURES.COMPANY_PREP,
        colorClass: "text-cyan-500",
    },
    {
        icon: Users,
        labelKey: "studySquad",
        href: "/candidate/study-squad",
        featureKey: FEATURES.STUDY_SQUAD,
        colorClass: "text-pink-500",
    },
    {
        icon: UserCheck,
        labelKey: "mentors",
        href: "/candidate/mentors",
        featureKey: FEATURES.MENTOR_MATCHING,
        colorClass: "text-amber-500",
    },
    {
        icon: BriefcaseBusiness,
        labelKey: "offers",
        href: "/candidate/offers",
        featureKey: FEATURES.OFFER_COMPARATOR,
        colorClass: "text-emerald-500",
    },
    // Profile at bottom
    {
        isDivider: true,
    },
    {
        icon: User,
        labelKey: "profile",
        href: "/candidate/profile",
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

