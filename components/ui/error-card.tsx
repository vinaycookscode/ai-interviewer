"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorCardProps {
    title?: string;
    description?: string;
    retry?: () => void;
    homeLink?: boolean;
}

export function ErrorCard({
    title = "Something went wrong",
    description = "An unexpected error occurred. Please try again.",
    retry,
    homeLink = true
}: ErrorCardProps) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-destructive/20">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl font-bold">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>{description}</p>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    {retry && (
                        <Button onClick={retry} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    )}
                    {homeLink && (
                        <Button asChild className="gap-2">
                            <Link href="/dashboard">
                                <Home className="h-4 w-4" />
                                Go Home
                            </Link>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
