"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Candidate {
    id: string;
    email: string;
    createdAt: Date;
}

interface Interview {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    score: number | null;
    token: string | null;
    candidate: Candidate;
    createdAt: Date;
}

interface CandidateListProps {
    interviews: Interview[];
}

export function CandidateList({ interviews }: CandidateListProps) {
    const copyLink = (token: string) => {
        const link = `${window.location.origin}/interview/${token}`;
        navigator.clipboard.writeText(link);
        toast.success("Interview link copied to clipboard");
    };

    if (interviews.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No candidates invited yet.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Invited On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {interviews.map((interview) => (
                        <TableRow key={interview.id}>
                            <TableCell className="font-medium">
                                {interview.candidate.email}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        interview.status === "COMPLETED"
                                            ? "default"
                                            : interview.status === "IN_PROGRESS"
                                                ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {interview.status.replace("_", " ")}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {interview.score ? (
                                    <Badge
                                        variant="outline"
                                        className={
                                            interview.score >= 8
                                                ? "text-green-600 border-green-200 bg-green-50"
                                                : interview.score >= 5
                                                    ? "text-yellow-600 border-yellow-200 bg-yellow-50"
                                                    : "text-red-600 border-red-200 bg-red-50"
                                        }
                                    >
                                        {interview.score.toFixed(1)}/10
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {new Date(interview.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {interview.status === "PENDING" && interview.token && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyLink(interview.token!)}
                                        title="Copy Interview Link"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                                {interview.status === "COMPLETED" && (
                                    <Link href={`/interview/${interview.id}/feedback`}>
                                        <Button variant="ghost" size="sm" title="View Feedback">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </Button>
                                    </Link>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
