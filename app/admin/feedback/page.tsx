import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getUserFeedbackList } from "@/actions/user-feedback";
import { FeedbackListClient } from "./client";

interface PageProps {
    searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
    const session = await auth();
    const t = await getTranslations("Feedback.admin");

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/auth/login");
    }

    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const status = params.status || "ALL";

    const { feedback, totalPages, total } = await getUserFeedbackList(page, 20, status);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">
                    {t("subtitle")} ({total} {t("total")})
                </p>
            </div>

            <FeedbackListClient
                feedback={feedback}
                totalPages={totalPages}
                currentPage={page}
                currentStatus={status}
            />
        </div>
    );
}
