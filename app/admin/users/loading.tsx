import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function UsersLoading() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-full max-w-sm" />
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <TableHead key={i}>
                                        <Skeleton className="h-4 w-20" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <TableRow key={i}>
                                    {[1, 2, 3, 4, 5, 6].map((j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
