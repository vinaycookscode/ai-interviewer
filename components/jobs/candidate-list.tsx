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

import { DeleteCandidateButton } from "@/components/dashboard/delete-candidate-button";
import { EmptyState } from "@/components/ui/empty-state";

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
    resumeUrl: string | null;
    aadhaarUrl: string | null;
    panUrl: string | null;
    candidate: Candidate;
    createdAt: Date;
}

interface CandidateListProps {
    interviews: Interview[];
}

export function CandidateList({ interviews }: CandidateListProps) {
    const copyLink = (interviewId: string, token: string) => {
        const link = `${window.location.origin}/interview/${interviewId}?token=${token}`;
        navigator.clipboard.writeText(link);
        toast.success("Interview link copied to clipboard");
    };

    if (interviews.length === 0) {
        return (
            <EmptyState
                title="No candidates yet"
                description="Share the interview link to start receiving applications."
                icon={FileText}
            />
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
                        <TableHead>Documents</TableHead>
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
                                <div className="flex gap-1 flex-wrap">
                                    {interview.resumeUrl && (
                                        <a
                                            href={interview.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                        >
                                            Resume
                                        </a>
                                    )}
                                    {interview.aadhaarUrl && (
                                        <a
                                            href={interview.aadhaarUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200"
                                        >
                                            Aadhaar
                                        </a>
                                    )}
                                    {interview.panUrl && (
                                        <a
                                            href={interview.panUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200"
                                        >
                                            PAN
                                        </a>
                                    )}
                                    {!interview.resumeUrl && !interview.aadhaarUrl && !interview.panUrl && (
                                        <span className="text-muted-foreground text-sm italic">No docs</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {new Date(interview.createdAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric'
                                })}
                            </TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                                {interview.status === "PENDING" && interview.token && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyLink(interview.id, interview.token!)}
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
                                <DeleteCandidateButton interviewId={interview.id} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
