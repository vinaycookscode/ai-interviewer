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
    BriefcaseBusiness,
    Layers,
} from "lucide-react";
import { AppSidebar, NavItem } from "@/components/layout/app-sidebar";
import { FEATURES } from "@/lib/features";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getUserProfile } from "@/actions/profile";
import { calculateProfileCompletion, ProfileData } from "@/lib/profile-utils";
import { ProfileCompletionCircle } from "./sidebar-profile";

interface SidebarProps {
    featureFlags?: Record<string, boolean>;
}

const CANDIDATE_NAV_ITEMS: NavItem[] = [
    {
        isDivider: true,
        labelKey: "coreNavigation",
    },
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
    {
        icon: Layers,
        labelKey: "flashcards",
        href: "/candidate/flashcards",
        colorClass: "text-teal-500",
    },
    // Placement Platform Section
    {
        isDivider: true,
        labelKey: "careerTools",
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
];

export function CandidateSidebar({ featureFlags }: SidebarProps) {
    const [completion, setCompletion] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        const fetchProfile = async () => {
            const user = await getUserProfile();
            if (user) {
                const percentage = calculateProfileCompletion(user as ProfileData);
                setCompletion(percentage);
            }
        };
        fetchProfile();
    }, [pathname]); // Refresh on navigation in case they updated profile

    const profileFooter = (
        <ProfileCompletionCircle
            completionPercentage={completion}
            href="/candidate/profile"
            isActive={pathname.startsWith("/candidate/profile")}
        />
    );

    return (
        <AppSidebar
            items={CANDIDATE_NAV_ITEMS}
            featureFlags={featureFlags}
            footer={profileFooter}
        />
    );
}

