"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { UsersTable } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UsersPageClientProps {
    users: Array<{
        id: string;
        name: string | null;
        email: string;
        role: string;
        createdAt: Date;
        _count: { jobs: number; interviews: number };
    }>;
    totalPages: number;
    currentPage: number;
    page: number;
}

export default function UsersPageClient({
    users,
    totalPages,
    currentPage,
    page,
}: UsersPageClientProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const usersWithDate = users.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
    }));

    const filteredUsers = usersWithDate.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(term)) ||
            user.email.toLowerCase().includes(term) ||
            user.role.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage users and view their activity.
                    </p>
                </div>
                <div className="relative flex-1 max-w-sm">
                    <Input
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <UsersTable users={filteredUsers} />
            </div>

            <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} asChild>
                    <Link href={`/admin/users?page=${currentPage - 1}`}>Previous</Link>
                </Button>
                <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} asChild>
                    <Link href={`/admin/users?page=${currentPage + 1}`}>Next</Link>
                </Button>
            </div>
        </div>
    );
}
