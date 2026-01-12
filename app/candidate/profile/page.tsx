import { ProfileHeaderAnimation } from "@/components/candidate/profile-animations";
import { auth } from "@/auth";
import { getUserProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/candidate/profile-form";
import { CareerWizard } from "@/components/candidate/career-wizard";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings2, ShieldCheck } from "lucide-react";

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
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="w-full max-w-5xl px-4">
                    <div className="text-center mb-12">
                        <ProfileHeaderAnimation
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-bold mb-6 backdrop-blur-md"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Action Required</span>
                        </ProfileHeaderAnimation>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Let's Build Your Path
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Complete your career profile to unlock personalized prep kits and 90-day program tasks.
                        </p>
                    </div>
                    <CareerWizard initialData={user} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pt-10 pb-10 no-scrollbar">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-bold tracking-tight mb-2">My Profile</h1>
                <p className="text-muted-foreground text-lg">
                    Manage your identity documents and personal information.
                </p>
            </div>

            <Tabs defaultValue="account" className="space-y-8">
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

                <TabsContent value="account" className="space-y-6">
                    <div className="rounded-xl border-2 bg-card text-card-foreground shadow-lg p-6 md:p-10">
                        <ProfileForm user={user} />
                    </div>
                </TabsContent>

                <TabsContent value="career" className="space-y-6">
                    <div className="rounded-2xl border bg-card text-card-foreground shadow-2xl overflow-hidden">
                        <div className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
                            <h3 className="text-3xl font-black mb-2 tracking-tight">Career Journey</h3>
                            <p className="text-muted-foreground text-lg">Want to pivot? Re-run the career discovery wizard.</p>
                        </div>
                        <div className="p-0">
                            <CareerWizard initialData={user} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
