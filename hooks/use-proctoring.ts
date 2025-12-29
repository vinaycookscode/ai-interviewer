"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logProctoringEvent } from "@/actions/proctoring";

export function useProctoring(interviewId: string) {
    const [warnings, setWarnings] = useState<{ message: string; timestamp: number }[]>([]);
    const [isFullScreen, setIsFullScreen] = useState(true);

    const addWarning = async (message: string, type: string, details?: string) => {
        const newWarning = { message, timestamp: Date.now() };
        setWarnings(prev => [...prev, newWarning]);

        // Log to server
        await logProctoringEvent(interviewId, type, details);
    };

    const enterFullScreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.error("Failed to enter full screen:", e);
            toast.error("Could not enter full screen. Please try again.");
        }
    };

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                toast.warning("Warning: Tab switching is monitored.", {
                    description: "Please stay on this tab to avoid disqualification.",
                    duration: 5000,
                });
                await addWarning("Tab switched / Window hidden", "TAB_SWITCH", `Hidden: ${document.hidden}`);
            }
        };

        const handleBlur = async () => {
            if (document.hidden) return;

            toast.warning("Warning: Window focus lost.", {
                description: "Please keep the interview window in focus.",
                duration: 5000,
            });
            await addWarning("Window focus lost", "WINDOW_BLUR");
        };

        const handleFullScreenChange = async () => {
            const isFull = !!document.fullscreenElement;
            setIsFullScreen(isFull);

            if (!isFull) {
                toast.warning("Warning: Full-screen mode exited.", {
                    description: "Please return to full-screen mode immediately.",
                    duration: 5000,
                });
                await addWarning("Exited full-screen mode", "FULLSCREEN_EXIT");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("fullscreenchange", handleFullScreenChange);

        // Initial check
        if (!document.fullscreenElement) {
            setIsFullScreen(false);
        }

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
        // We exclude addWarning from deps to avoid infinite loop as it changes on every render (it is not wrapped in useCallback yet)
        // But better to wrap addWarning in useCallback above or just ignore the lint here if we trust it doesn't change meaningfully or we don't want re-subscribing.
        // Actually, addWarning is defined inside the component but depends on setWarnings.
        // Let's rely on eslint-disable for this specific line if we can't easily memoize addWarning without wrapping everything.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId]);

    return {
        warnings,
        warningCount: warnings.length,
        isFullScreen,
        enterFullScreen,
        addWarning
    };
}
