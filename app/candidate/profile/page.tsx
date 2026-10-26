import { ProfileHeaderAnimation } from "@/components/candidate/profile-animations";
import { auth } from "@/auth";
import { getUserProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/candidate/profile-form";
import { CareerWizard } from "@/components/candidate/career-wizard";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function ProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    const user = await getUserProfile();

    if (!user) {
        redirect("/auth/login");
    }

    const userProfile = user as any;
    const isOnboardingComplete = userProfile.candidateProfile?.onboardingComplete;

    if (!isOnboardingComplete) {
        return (
            <div className="mx-auto w-full max-w-3xl space-y-section">
                <div className="space-y-3 text-center">
                    <ProfileHeaderAnimation className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-1 text-caption font-medium text-brand">
                        <Sparkles className="size-3.5" />
                        <span>Action required</span>
                    </ProfileHeaderAnimation>
                    <h1 className="text-page-title">Let&apos;s build your path</h1>
                    <p className="mx-auto max-w-xl text-body text-muted-foreground">
                        Complete your career profile to unlock personalized prep kits and 90-day program tasks.
                    </p>
                </div>
                <div className="rounded-card border bg-card text-card-foreground shadow-sm">
                    <CareerWizard initialData={user} />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl space-y-section">
            <PageHeader
                title="My Profile"
                subtitle="Manage your identity documents and personal information."
            />

            <Tabs defaultValue="account" className="space-y-stack">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Account Settings
                    </TabsTrigger>
                    <TabsTrigger value="career" className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Career Path
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <div className="rounded-card border bg-card p-card text-card-foreground shadow-sm">
                        <ProfileForm user={user} />
                    </div>
                </TabsContent>

                <TabsContent value="career">
                    <div className="overflow-hidden rounded-card border bg-card text-card-foreground shadow-sm">
                        <div className="space-y-1 border-b p-card">
                            <h2 className="text-section-title">Career journey</h2>
                            <p className="text-body text-muted-foreground">Want to pivot? Re-run the career discovery wizard.</p>
                        </div>
                        <CareerWizard initialData={user} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
