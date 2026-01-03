import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getCompanyKitBySlug } from "@/actions/company-prep";
import { CompanyDetailClient } from "./client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
    const { slug } = await params;

    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.COMPANY_PREP);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    // Check code editor feature flags
    const [
        languageSelectorEnabled,
        codePersistenceEnabled,
        aiCodeAnalysisEnabled
    ] = await Promise.all([
        checkFeature(FEATURES.CODE_EDITOR_LANGUAGE_SELECTOR),
        checkFeature(FEATURES.CODE_PERSISTENCE),
        checkFeature(FEATURES.AI_CODE_ANALYSIS)
    ]);

    const company = await getCompanyKitBySlug(slug);
    if (!company) {
        notFound();
    }

    return (
        <CompanyDetailClient
            company={company}
            featureFlags={{
                languageSelector: languageSelectorEnabled,
                codePersistence: codePersistenceEnabled,
                aiCodeAnalysis: aiCodeAnalysisEnabled
            }}
        />
    );
}
