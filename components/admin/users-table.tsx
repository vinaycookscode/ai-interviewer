"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { UserActions } from "./user-actions";

type User = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: Date;
    _count: {
        jobs: number;
        interviews: number;
    };
};

type SortKey = "name" | "email" | "role" | "createdAt" | "jobs" | "interviews";
type SortDirection = "asc" | "desc" | null;

interface UsersTableProps {
    users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Cycle through: asc -> desc -> null
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortDirection(null);
                setSortKey(null);
            }
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;

        let aValue: any;
        let bValue: any;

        switch (sortKey) {
            case "name":
                aValue = a.name?.toLowerCase() || "";
                bValue = b.name?.toLowerCase() || "";
                break;
            case "email":
                aValue = a.email.toLowerCase();
                bValue = b.email.toLowerCase();
                break;
            case "role":
                aValue = a.role;
                bValue = b.role;
                break;
            case "createdAt":
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
            case "jobs":
                aValue = a._count.jobs;
                bValue = b._count.jobs;
                break;
            case "interviews":
                aValue = a._count.interviews;
                bValue = b._count.interviews;
                break;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortKey !== columnKey) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortDirection === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("name")}
                        >
                            User
                            <SortIcon columnKey="name" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("role")}
                        >
                            Role
                            <SortIcon columnKey="role" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("createdAt")}
                        >
                            Joined
                            <SortIcon columnKey="createdAt" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">Stats</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">{user.name || "No Name"}</span>
                                <span className="text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={
                                    user.role === "ADMIN"
                                        ? "destructive"
                                        : user.role === "EMPLOYER"
                                            ? "default"
                                            : "secondary"
                                }
                            >
                                {user.role}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                <span>Jobs: {user._count.jobs}</span>
                                <span>Interviews: {user._count.interviews}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <UserActions userId={user.id} userName={user.name || "User"} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
