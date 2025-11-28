"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { logProctoringEvent } from "@/actions/proctoring";

export function useProctoring(interviewId: string) {
    const warningCount = useRef(0);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                warningCount.current += 1;
                toast.warning("Warning: Tab switching is monitored.", {
                    description: "Please stay on this tab to avoid disqualification.",
                    duration: 5000,
                });

                await logProctoringEvent(interviewId, "TAB_SWITCH", `Hidden: ${document.hidden}`);
            }
        };

        const handleBlur = async () => {
            // Only trigger if the document is not hidden (blur happens before visibility change usually)
            // But we want to catch clicking outside window even if visible (e.g. dual monitor)
            // However, blur also fires when switching tabs.
            // If we switch tabs, visibilitychange will also fire.
            // We might get double logs.
            // Let's rely on visibilitychange for tab switching, and blur for window focus loss.

            // If document is hidden, it's a tab switch, handled by visibilitychange.
            if (document.hidden) return;

            warningCount.current += 1;
            toast.warning("Warning: Window focus lost.", {
                description: "Please keep the interview window in focus.",
                duration: 5000,
            });

            await logProctoringEvent(interviewId, "WINDOW_BLUR");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [interviewId]);

    return { warningCount: warningCount.current };
}
