"use client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface Subscriber {
    id: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    plan: string;
    tier: string;
    billingPeriod: string;
    status?: string;
    daysRemaining: number;
    currentPeriodEnd: Date;
    amount?: number;
    totalPaid?: number;
    createdAt: Date;
}

interface SubscribersTableProps {
    subscribers: Subscriber[];
    showDaysRemaining?: boolean;
    showStatus?: boolean;
}

export function SubscribersTable({ subscribers, showDaysRemaining, showStatus }: SubscribersTableProps) {
    const t = useTranslations("Admin.subscriptions.table");
    const tCommon = useTranslations("Common");

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case "PRO":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Pro</Badge>;
            case "PREMIUM":
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Premium</Badge>;
            default:
                return <Badge variant="outline">{tCommon("unlimited")}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />{t("statusActive")}</Badge>;
            case "CANCELLED":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t("statusCancelled")}</Badge>;
            case "EXPIRED":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{t("statusExpired")}</Badge>;
            case "PAST_DUE":
                return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20"><AlertCircle className="h-3 w-3 mr-1" />{t("statusPastDue")}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getDaysRemainingColor = (days: number) => {
        if (days <= 3) return "text-red-500";
        if (days <= 7) return "text-yellow-500";
        return "text-green-500";
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("user")}</TableHead>
                        <TableHead>{t("plan")}</TableHead>
                        <TableHead>{t("billing")}</TableHead>
                        {showStatus && <TableHead>{t("status")}</TableHead>}
                        {showDaysRemaining && <TableHead>{t("daysLeft")}</TableHead>}
                        <TableHead>{t("amount")}</TableHead>
                        <TableHead>{t("subscribed")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscribers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={showStatus ? 7 : 6} className="text-center py-8 text-muted-foreground">
                                {t("noSubscribers")}
                            </TableCell>
                        </TableRow>
                    ) : (
                        subscribers.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={sub.user.image || undefined} />
                                            <AvatarFallback>
                                                {sub.user.name?.charAt(0) || sub.user.email?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{sub.user.name || tCommon("unknown")}</p>
                                            <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{getTierBadge(sub.tier)}</TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">
                                        {sub.billingPeriod === "YEARLY" ? t("yearly") : t("monthly")}
                                    </span>
                                </TableCell>
                                {showStatus && <TableCell>{getStatusBadge(sub.status || "ACTIVE")}</TableCell>}
                                {showDaysRemaining && (
                                    <TableCell>
                                        <div className={`flex items-center gap-1 ${getDaysRemainingColor(sub.daysRemaining)}`}>
                                            <Clock className="h-3 w-3" />
                                            <span className="font-medium">{sub.daysRemaining}</span>
                                            <span className="text-xs">{tCommon("days")}</span>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <span className="font-medium">₹{sub.amount || sub.totalPaid || 0}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
