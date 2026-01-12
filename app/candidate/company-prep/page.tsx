import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getAllCompanyKits } from "@/actions/company-prep";
import { getUserProfile } from "@/actions/profile";
import { Building2, Search, Briefcase, Users, Clock, Sparkles, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COMPANY_COLORS: Record<string, string> = {
    tcs: "bg-blue-500",
    infosys: "bg-cyan-500",
    wipro: "bg-purple-500",
    cognizant: "bg-indigo-500",
    amazon: "bg-orange-500",
    google: "bg-green-500",
    microsoft: "bg-blue-600",
    accenture: "bg-violet-500",
};

export default async function CompanyPrepPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.COMPANY_PREP);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    const [companies, userProfile] = await Promise.all([
        getAllCompanyKits(),
        getUserProfile()
    ]);

    const userRole = userProfile?.candidateProfile?.primaryRole;
    const userSkills = userProfile?.candidateProfile?.skills || [];

    // Separate recommended vs others
    const recommended = companies.filter(company => {
        if (!userRole) return false;
        const companyRoles = (company as any).roles || [];
        return companyRoles.includes(userRole);
    });

    const others = companies.filter(company => {
        if (!userRole) return true;
        const companyRoles = (company as any).roles || [];
        return !companyRoles.includes(userRole);
    });

    const renderCompanyCard = (company: any, isRecommended: boolean = false) => {
        const colorClass = COMPANY_COLORS[company.slug] || "bg-gray-500";
        const rounds = (company.rounds as any[]) || [];
        const salaryRange = company.salaryRange as any;

        return (
            <Link
                key={company.id}
                href={`/candidate/company-prep/${company.slug}`}
                className={cn(
                    "bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden",
                    isRecommended && "border-primary/30 bg-primary/5 shadow-primary/5 shadow-xl"
                )}
            >
                {isRecommended && (
                    <div className="absolute top-0 right-0 p-2">
                        <Badge className="bg-primary text-white text-[10px] uppercase font-bold py-0.5 px-2">
                            Recommended
                        </Badge>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                        colorClass
                    )}>
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold">{company.company}</h3>
                        <span className={cn(
                            "inline-block text-xs px-2 py-0.5 rounded mt-1",
                            company.difficulty === "HARD"
                                ? "bg-red-500/10 text-red-500"
                                : company.difficulty === "MEDIUM"
                                    ? "bg-yellow-500/10 text-yellow-500"
                                    : "bg-green-500/10 text-green-500"
                        )}>
                            {company.difficulty}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {company.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {rounds.length} rounds
                    </span>
                    <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {company._count.questions} questions
                    </span>
                </div>

                {/* Salary Range */}
                {salaryRange && (
                    <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Salary Range (Freshers)</p>
                        <p className="font-semibold text-green-500">
                            ₹{(salaryRange.min / 100000).toFixed(1)}L - ₹{(salaryRange.max / 100000).toFixed(1)}L
                        </p>
                    </div>
                )}
            </Link>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3">Company Prep Kits</h1>
                    <p className="text-muted-foreground text-lg text-balance opacity-80">
                        Targeted preparation resources tailored to your career path
                    </p>
                </div>
                {userRole && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold">
                        <Filter className="w-4 h-4" />
                        Showing Best for: {userRole}
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="relative group max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder={`Search companies... ${userRole ? `e.g. ${userRole} roles` : ''}`}
                    className="w-full pl-12 pr-4 py-4 bg-card border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg shadow-sm"
                />
            </div>

            {/* Recommended Section (Only if profile exists) */}
            {recommended.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Recommended for {userRole}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommended.map(c => renderCompanyCard(c, true))}
                    </div>
                </section>
            )}

            {/* All Companies / Others Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {recommended.length > 0 ? "Discover More Companies" : "All Company Kits"}
                    </h2>
                    <span className="text-sm text-muted-foreground">{companies.length} Kits Available</span>
                </div>

                {companies.length === 0 ? (
                    <div className="bg-card border-2 border-dashed rounded-3xl p-16 text-center">
                        <div className="mx-auto w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                            <Building2 className="h-10 w-10 text-primary opacity-40" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Expanding our Kits...</h3>
                        <p className="text-muted-foreground text-lg">
                            Company prep kits are being prepared. Check back soon!
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {others.map(c => renderCompanyCard(c, false))}
                    </div>
                )}
            </section>

            {/* Coming Soon Note */}
            <div className="bg-gradient-to-r from-blue-500/5 via-primary/5 to-purple-500/5 border border-white/10 rounded-2xl p-8 text-center mt-12">
                <h4 className="font-bold text-lg mb-2">Don't see your dream company?</h4>
                <p className="text-muted-foreground mb-4">
                    We're adding new kits weekly. Help us prioritize your target company.
                </p>
                <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
                    Request a Kit
                </Button>
            </div>
        </div>
    );
}
