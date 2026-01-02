import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { Building2, Search } from "lucide-react";
import Link from "next/link";

const COMPANIES = [
    { name: "TCS", slug: "tcs", color: "bg-blue-500" },
    { name: "Infosys", slug: "infosys", color: "bg-cyan-500" },
    { name: "Wipro", slug: "wipro", color: "bg-purple-500" },
    { name: "Cognizant", slug: "cognizant", color: "bg-indigo-500" },
    { name: "Amazon", slug: "amazon", color: "bg-orange-500" },
    { name: "Google", slug: "google", color: "bg-green-500" },
    { name: "Microsoft", slug: "microsoft", color: "bg-blue-600" },
    { name: "Accenture", slug: "accenture", color: "bg-violet-500" },
];

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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COMPANIES.map((company) => (
                    <Link
                        key={company.slug}
                        href={`/candidate/company-prep/${company.slug}`}
                        className="bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all group"
                    >
                        <div className={`w-12 h-12 ${company.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            Interview prep kit
                        </p>
                    </Link>
                ))}
            </div>

            {/* Coming Soon Note */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    More companies coming soon! Have a request? Let us know.
                </p>
            </div>
        </div>
    );
}
