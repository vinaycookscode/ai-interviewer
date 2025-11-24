import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CandidateDashboardLoading() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Interviews List */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-48 mb-2" />
                                    <Skeleton className="h-4 w-64 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-9 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
