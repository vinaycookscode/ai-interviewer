import { getUsers } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UsersPageClient from "@/components/admin/users-page-client";


export default async function UsersPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const page = Number(searchParams.page) || 1;
    // Server‑side fetch for pagination (no search filter)
    const { users: rawUsers, totalPages, currentPage } = await getUsers(page, 10, "");
    const users = rawUsers.map(user => ({
        ...user,
        createdAt: new Date(user.createdAt),
    }));

    return (
        <UsersPageClient
            users={users}
            totalPages={totalPages}
            currentPage={currentPage}
            page={page}
        />
    );
}
