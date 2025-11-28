import { getCandidateGrowthData } from "@/actions/analytics";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Growth Dashboard | AI Interviewer",
    description: "Track your interview performance and get AI-driven insights.",
};

export default async function AnalyticsPage() {
    const result = await getCandidateGrowthData();
    const data = result.success && result.data ? result.data : [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Growth Dashboard</h2>
            </div>
            <AnalyticsDashboard initialData={data} />
        </div>
    );
}
