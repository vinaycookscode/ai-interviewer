import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUsers } from "@/actions/admin";
import { AdminHeading } from "@/components/admin/admin-ui";
import { UsersTable } from "@/components/admin/users-table";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.users");
    return { title: t("metaTitle") };
}

const ROLES = ["CANDIDATE", "EMPLOYER", "ADMIN"] as const;
const PAGE_SIZE = 20;
const joined = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Everyone with an account, searched and filtered on the server (AIIN-138). */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; role?: string }> }) {
    const t = await getTranslations("Admin.users");
    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const role = ROLES.find((r) => r === params.role);
    const { users, total, totalPages, currentPage } = await getUsers(Math.max(1, Number(params.page) || 1), PAGE_SIZE, q, role);

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <UsersTable
                users={users.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    joined: joined.format(u.createdAt),
                    activity: u.role === "EMPLOYER" ? t("jobs", { count: u._count.jobs }) : u.role === "CANDIDATE" ? t("interviews", { count: u._count.interviews }) : "—",
                }))}
                total={total}
                page={currentPage}
                pages={totalPages}
                q={q}
                role={role ?? null}
            />
        </>
    );
}
