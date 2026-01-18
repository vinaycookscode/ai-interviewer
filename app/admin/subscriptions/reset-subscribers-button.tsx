"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { resetNonPayingSubscribers } from "@/actions/admin-subscription";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ResetSubscribersButton() {
    const [isPending, setIsPending] = useState(false);
    const [result, setResult] = useState<{ resetCount: number; message: string } | null>(null);

    const handleReset = async () => {
        setIsPending(true);
        setResult(null);
        try {
            const data = await resetNonPayingSubscribers();
            if (data.success) {
                setResult({
                    resetCount: data.resetCount || 0,
                    message: data.message || "Reset completed successfully"
                });
                toast.success(data.message);
            } else {
                toast.error(data.error || "Failed to reset subscribers");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Reset Non-Paying Pro Users
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will scan all subscribers and downgrade any user on a PRO or PREMIUM plan
                            who doesn't have a valid payment record or active Razorpay subscription.
                            Existing paying customers will NOT be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Continue Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {result && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="text-sm font-semibold text-green-700">Scan Complete</p>
                        <p className="text-xs text-green-600/80">{result.message}</p>
                    </div>
                </div>
            )}

            {isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Scanning subscribers...
                </div>
            )}
        </div>
    );
}
