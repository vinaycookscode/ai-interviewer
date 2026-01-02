import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getAllCompanyKits } from "@/actions/company-prep";
import { Building2, Search, Briefcase, Users, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.COMPANY_PREP);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    const companies = await getAllCompanyKits();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Company Prep Kits</h1>
                <p className="text-muted-foreground">
                    Targeted preparation resources for top recruiters
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search companies..."
                    className="w-full pl-10 pr-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Company Grid */}
            {companies.length === 0 ? (
                <div className="bg-card border rounded-xl p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-cyan-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Companies Yet</h3>
                    <p className="text-muted-foreground">
                        Company prep kits are being prepared. Check back soon!
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => {
                        const colorClass = COMPANY_COLORS[company.slug] || "bg-gray-500";
                        const rounds = (company.rounds as any[]) || [];
                        const salaryRange = company.salaryRange as any;

                        return (
                            <Link
                                key={company.id}
                                href={`/candidate/company-prep/${company.slug}`}
                                className="bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all group"
                            >
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
                    })}
                </div>
            )}

            {/* Coming Soon Note */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    More companies coming soon! Have a request? Let us know.
                </p>
            </div>
        </div>
    );
}
