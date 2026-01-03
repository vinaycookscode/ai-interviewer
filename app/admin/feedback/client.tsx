"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
    MessageSquare,
    User,
    Mail,
    Clock,
    Tag,
    ChevronLeft,
    ChevronRight,
    Trash2,
    CheckCircle,
    XCircle,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateUserFeedbackStatus, deleteUserFeedback } from "@/actions/user-feedback";
import { toast } from "sonner";

interface Feedback {
    id: string;
    userId: string | null;
    userEmail: string | null;
    userName: string | null;
    content: string;
    page: string | null;
    category: string;
    status: string;
    adminNotes: string | null;
    createdAt: Date;
}

interface FeedbackListClientProps {
    feedback: Feedback[];
    totalPages: number;
    currentPage: number;
    currentStatus: string;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: "text-blue-500 bg-blue-500/10",
    REVIEWED: "text-yellow-500 bg-yellow-500/10",
    RESOLVED: "text-green-500 bg-green-500/10",
    DISMISSED: "text-gray-500 bg-gray-500/10",
};

const CATEGORY_COLORS: Record<string, string> = {
    GENERAL: "text-purple-500 bg-purple-500/10",
    BUG: "text-red-500 bg-red-500/10",
    FEATURE: "text-blue-500 bg-blue-500/10",
    IMPROVEMENT: "text-green-500 bg-green-500/10",
};

export function FeedbackListClient({
    feedback,
    totalPages,
    currentPage,
    currentStatus,
}: FeedbackListClientProps) {
    const t = useTranslations("Feedback");
    const tCommon = useTranslations("Common");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const STATUS_KEYS = ["ALL", "NEW", "REVIEWED", "RESOLVED", "DISMISSED"] as const;

    const updateStatus = async (id: string, status: string) => {
        const result = await updateUserFeedbackStatus(id, status);
        if (result.success) {
            toast.success(t("admin.statusUpdated"));
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("admin.confirmDelete"))) return;
        const result = await deleteUserFeedback(id);
        if (result.success) {
            toast.success(t("admin.deleted"));
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const setStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", status);
        params.set("page", "1");
        router.push(`/admin/feedback?${params.toString()}`);
    };

    const setPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/admin/feedback?${params.toString()}`);
    };

    const getStatusLabel = (status: string) => {
        const key = status.toLowerCase() as keyof typeof t;
        return t(`status.${key}`);
    };

    return (
        <div className="space-y-6">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {STATUS_KEYS.map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            currentStatus === status
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        {getStatusLabel(status)}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {feedback.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t("admin.noFeedback")}</p>
                    </div>
                ) : (
                    feedback.map((item) => (
                        <div
                            key={item.id}
                            className="bg-card border rounded-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div
                                className="flex items-start justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", CATEGORY_COLORS[item.category])}>
                                                {item.category}
                                            </span>
                                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", STATUS_COLORS[item.status])}>
                                                {item.status}
                                            </span>
                                        </div>
                                        {/* User Info - Prominent Display */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg">
                                                <User className="h-3.5 w-3.5 text-primary" />
                                                <span className="font-medium">{item.userName || tCommon("anonymous")}</span>
                                                {item.userEmail && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-muted-foreground text-xs">{item.userEmail}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm line-clamp-2">{item.content}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </span>
                                        {item.page && (
                                            <span className="flex items-center gap-1">
                                                <Tag className="h-3 w-3" />
                                                {item.page}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedId === item.id && (
                                <div className="border-t p-4 bg-muted/30 space-y-4">
                                    {/* User Details */}
                                    <div className="flex items-center gap-6 p-3 bg-background rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{item.userName || t("admin.anonymousUser")}</p>
                                                <p className="text-xs text-muted-foreground">{tCommon("name")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{item.userEmail || tCommon("noEmail")}</p>
                                                <p className="text-xs text-muted-foreground">{tCommon("email")}</p>
                                            </div>
                                        </div>
                                        {item.page && (
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-sm font-medium">{item.page}</p>
                                                    <p className="text-xs text-muted-foreground">{tCommon("page")}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium mb-2">{t("admin.fullFeedback")}</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {item.content}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => updateStatus(item.id, "REVIEWED")}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg text-sm hover:bg-yellow-500/20"
                                        >
                                            <Eye className="h-4 w-4" />
                                            {t("admin.markReviewed")}
                                        </button>
                                        <button
                                            onClick={() => updateStatus(item.id, "RESOLVED")}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm hover:bg-green-500/20"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            {t("admin.resolve")}
                                        </button>
                                        <button
                                            onClick={() => updateStatus(item.id, "DISMISSED")}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/10 text-gray-500 rounded-lg text-sm hover:bg-gray-500/20"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            {t("admin.dismiss")}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm hover:bg-red-500/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {tCommon("delete")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
