"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
import Link from "next/link";
import { DeleteCandidateButton } from "@/components/dashboard/delete-candidate-button";

type Interview = {
    id: string;
    candidate: {
        email: string;
    };
    jobTitle: string;
    status: string;
    score: number | null;
    resumeUrl: string | null;
    aadhaarUrl: string | null;
    panUrl: string | null;
    createdAt: Date;
};

type SortKey = "email" | "jobTitle" | "status" | "score" | "createdAt";
type SortDirection = "asc" | "desc" | null;

interface CandidatesTableProps {
    interviews: Interview[];
}

export function CandidatesTable({ interviews }: CandidatesTableProps) {
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

    const sortedInterviews = [...interviews].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;

        let aValue: any;
        let bValue: any;

        switch (sortKey) {
            case "email":
                aValue = a.candidate.email.toLowerCase();
                bValue = b.candidate.email.toLowerCase();
                break;
            case "jobTitle":
                aValue = a.jobTitle.toLowerCase();
                bValue = b.jobTitle.toLowerCase();
                break;
            case "status":
                aValue = a.status;
                bValue = b.status;
                break;
            case "score":
                aValue = a.score || 0;
                bValue = b.score || 0;
                break;
            case "createdAt":
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
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
                            onClick={() => handleSort("email")}
                        >
                            Candidate
                            <SortIcon columnKey="email" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("jobTitle")}
                        >
                            Job Position
                            <SortIcon columnKey="jobTitle" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("status")}
                        >
                            Status
                            <SortIcon columnKey="status" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("score")}
                        >
                            Score
                            <SortIcon columnKey="score" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">Documents</TableHead>
                    <TableHead className="text-center">
                        <button
                            className="flex items-center justify-center w-full hover:text-primary transition-colors"
                            onClick={() => handleSort("createdAt")}
                        >
                            Date
                            <SortIcon columnKey="createdAt" />
                        </button>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedInterviews.map((interview) => (
                    <TableRow key={interview.id}>
                        <TableCell className="font-medium">
                            {interview.candidate.email}
                        </TableCell>
                        <TableCell>{interview.jobTitle}</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={
                                    interview.status === "COMPLETED"
                                        ? interview.score && interview.score >= 8
                                            ? "text-green-600 border-green-200 bg-green-50"
                                            : interview.score && interview.score >= 5
                                                ? "text-yellow-600 border-yellow-200 bg-yellow-50"
                                                : "text-red-600 border-red-200 bg-red-50"
                                        : interview.status === "IN_PROGRESS"
                                            ? "text-blue-600 border-blue-200 bg-blue-50"
                                            : "text-muted-foreground border-border bg-muted/50"
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
                                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
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
                                    <span className="text-muted-foreground text-xs italic">Pending</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            {new Date(interview.createdAt).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                            })}
                        </TableCell>
                        <TableCell className="text-center flex justify-end gap-2">
                            {interview.status === "COMPLETED" && (
                                <Link href={`/interview/${interview.id}/feedback`}>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>View Feedback</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Link>
                            )}
                            <DeleteCandidateButton interviewId={interview.id} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
