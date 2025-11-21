"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCandidateInterview } from "@/actions/candidate";
import { useTransition } from "react";
import { toast } from "sonner";

export function DeleteCandidateButton({ interviewId }: { interviewId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) {
            startTransition(async () => {
                const result = await deleteCandidateInterview(interviewId);
                if (result.success) {
                    toast.success("Candidate deleted successfully");
                } else {
                    toast.error(result.error || "Failed to delete candidate");
                }
            });
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
