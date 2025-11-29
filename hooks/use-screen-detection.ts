"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

// Define types for the Window Management API
interface ScreenDetails {
    screens: ScreenDetailed[];
    currentScreen: ScreenDetailed;
    addEventListener: (type: string, listener: (e: Event) => void) => void;
    removeEventListener: (type: string, listener: (e: Event) => void) => void;
}

interface ScreenDetailed extends Screen {
    isInternal: boolean;
    isPrimary: boolean;
    label: string;
}

declare global {
    interface Window {
        getScreenDetails?: () => Promise<ScreenDetails>;
    }
}

export function useScreenDetection(isActive: boolean = true) {
    const [screenCount, setScreenCount] = useState(1);
    const [isMultiScreen, setIsMultiScreen] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        if (!isActive || typeof window === "undefined") return;

        const checkScreens = async () => {
            // Fallback for browsers that don't support getScreenDetails
            // window.screen.isExtended is a newer property
            if ((window.screen as any).isExtended === false) {
                setScreenCount(1);
                setIsMultiScreen(false);
                return;
            }

            if (!window.getScreenDetails) {
                console.warn("Window Management API not supported");
                return;
            }

            try {
                // This will prompt the user for permission
                const screenDetails = await window.getScreenDetails();
                setPermissionGranted(true);

                const updateScreens = () => {
                    const count = screenDetails.screens.length;
                    setScreenCount(count);
                    setIsMultiScreen(count > 1);

                    if (count > 1) {
                        console.log("Multiple screens detected:", count);
                    }
                };

                updateScreens();
                screenDetails.addEventListener("screenschange", updateScreens);

                return () => {
                    screenDetails.removeEventListener("screenschange", updateScreens);
                };
            } catch (error) {
                console.error("Failed to get screen details:", error);
                // If permission denied, we can't detect.
                // We could assume 1 screen or try to infer from other means, but safer to assume 1.
            }
        };

        checkScreens();
    }, [isActive]);

    return {
        screenCount,
        isMultiScreen,
        permissionGranted
    };
}
