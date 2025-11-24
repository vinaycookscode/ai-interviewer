import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="space-y-1 text-center">
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <Skeleton className="h-4 w-8" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full mx-auto" />
                </CardContent>
            </Card>
        </div>
    );
}
