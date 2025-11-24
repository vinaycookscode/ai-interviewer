import { getUsers } from "@/actions/admin";
import { UserActions } from "@/components/admin/user-actions";
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
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function UsersPage({
    searchParams,
}: {
    searchParams: { page?: string; search?: string };
}) {
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || "";
    const { users, totalPages, currentPage } = await getUsers(page, 10, search);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage users and view their activity.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <form>
                        <Input
                            name="search"
                            placeholder="Search users..."
                            className="pl-9"
                            defaultValue={search}
                        />
                    </form>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
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
                                <TableCell className="text-right">
                                    <UserActions userId={user.id} userName={user.name || "User"} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    asChild
                >
                    <Link href={`/admin/users?page=${currentPage - 1}&search=${search}`}>
                        Previous
                    </Link>
                </Button>
                <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    asChild
                >
                    <Link href={`/admin/users?page=${currentPage + 1}&search=${search}`}>
                        Next
                    </Link>
                </Button>
            </div>
        </div>
    );
}
