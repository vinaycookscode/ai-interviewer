"use client";


import { useEffect, useRef, useState } from "react";

interface GazeTrackerProps {
    videoElement: HTMLVideoElement | null;
    onWarning: (message: string, type: string) => void;
    isActive: boolean;
}

declare global {
    interface Window {
        FaceMesh: any;
        Camera: any;
    }
}

export function GazeTracker({ videoElement, onWarning, isActive }: GazeTrackerProps) {
    const [gazeDirection, setGazeDirection] = useState<"CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN">("CENTER");
    const lookAwayStartTime = useRef<number | null>(null);
    const warningTriggered = useRef<boolean>(false);
    const faceMeshRef = useRef<any>(null);
    const requestRef = useRef<number | null>(null);
    const isMounted = useRef(true);
    const [scriptLoaded, setScriptLoaded] = useState(false);


    const [debugInfo, setDebugInfo] = useState<string>("");

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isActive || !videoElement || !scriptLoaded) return;

        const initMediaPipe = async () => {
            if (!window.FaceMesh) {
                console.error("GazeTracker: window.FaceMesh not found despite script load");
                return;
            }

            try {
                console.log("GazeTracker: Initializing MediaPipe FaceMesh via Local Script");
                const faceMesh = new window.FaceMesh({
                    locateFile: (file: string) => {
                        // Use JSDelivr for assets to ensure correct MIME types and headers.
                        // The local script (0.4.1633) is guaranteed to be compatible with this pinned version.
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                    },
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults((results: any) => {
                    if (!isMounted.current) return;

                    // 1. Check if face is detected
                    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
                        setDebugInfo("No Face Detected");
                        if (!lookAwayStartTime.current) {
                            lookAwayStartTime.current = Date.now();
                        } else {
                            const duration = Date.now() - lookAwayStartTime.current;
                            if (duration > 5000 && !warningTriggered.current) {
                                console.log("GazeTracker: Warning - Face missing");
                                onWarning("Face not visible", "FACE_MISSING");
                                warningTriggered.current = true;
                            }
                        }
                        return;
                    }

                    const landmarks = results.multiFaceLandmarks[0];

                    // Left Eye
                    const leftEyeInner = landmarks[362];
                    const leftEyeOuter = landmarks[263];
                    const leftIris = landmarks[468];
                    const leftEyeTop = landmarks[386];
                    const leftEyeBottom = landmarks[374];

                    // Right Eye
                    const rightEyeInner = landmarks[133];
                    const rightEyeOuter = landmarks[33];
                    const rightIris = landmarks[473];
                    const rightEyeTop = landmarks[159];
                    const rightEyeBottom = landmarks[145];

                    // Calculate horizontal gaze (0 = Looking Right/Image Left, 1 = Looking Left/Image Right)
                    const getHorizontalRatio = (leftPoint: any, rightPoint: any, iris: any) => {
                        const width = Math.abs(rightPoint.x - leftPoint.x);
                        const dist = iris.x - leftPoint.x;
                        return Math.min(Math.max(dist / width, 0), 1);
                    };

                    // Right Eye (Image Left): Outer(33) is Left, Inner(133) is Right
                    const rightRatio = getHorizontalRatio(rightEyeOuter, rightEyeInner, rightIris);

                    // Left Eye (Image Right): Inner(362) is Left, Outer(263) is Right
                    const leftRatio = getHorizontalRatio(leftEyeInner, leftEyeOuter, leftIris);

                    const avgHorizontalRatio = (leftRatio + rightRatio) / 2;

                    // Calculate vertical gaze
                    const getVerticalRatio = (top: any, bottom: any, iris: any) => {
                        const eyeHeight = Math.abs(bottom.y - top.y);
                        const irisDist = Math.abs(iris.y - top.y);
                        return Math.min(Math.max(irisDist / eyeHeight, 0), 1);
                    };

                    const leftVerticalRatio = getVerticalRatio(leftEyeTop, leftEyeBottom, leftIris);
                    const rightVerticalRatio = getVerticalRatio(rightEyeTop, rightEyeBottom, rightIris);
                    const avgVerticalRatio = (leftVerticalRatio + rightVerticalRatio) / 2;

                    let direction: "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN" = "CENTER";

                    // Tuned Thresholds (0 = User Right, 1 = User Left)
                    // Center is approx 0.5
                    if (avgHorizontalRatio > 0.6) { // Looking towards Image Right (User Left)
                        direction = "LEFT";
                    } else if (avgHorizontalRatio < 0.4) { // Looking towards Image Left (User Right)
                        direction = "RIGHT";
                    } else if (avgVerticalRatio < 0.3) { // Iris closer to top
                        direction = "UP";
                    } else if (avgVerticalRatio > 0.7) { // Iris closer to bottom
                        direction = "DOWN";
                    } else {
                        direction = "CENTER";
                    }

                    setGazeDirection(direction);
                    setDebugInfo(`H: ${avgHorizontalRatio.toFixed(2)} | V: ${avgVerticalRatio.toFixed(2)} | Dir: ${direction}`);

                    if (direction !== "CENTER") {
                        if (!lookAwayStartTime.current) {
                            lookAwayStartTime.current = Date.now();
                        } else {
                            const duration = Date.now() - lookAwayStartTime.current;


                            if (duration > 5000 && !warningTriggered.current) {
                                console.log(`GazeTracker: Warning - Looking away (${direction})`);
                                onWarning(`Looking away detected (${direction})`, "GAZE_DETECTED");
                                warningTriggered.current = true;
                            }
                        }
                    } else {
                        lookAwayStartTime.current = null;
                        warningTriggered.current = false;
                    }
                });

                faceMeshRef.current = faceMesh;

                // Manual frame processing loop
                const processFrame = async () => {
                    if (!isMounted.current) return;

                    if (videoElement && videoElement.readyState >= 2 && !videoElement.paused && !videoElement.ended) {
                        try {
                            // console.log("GazeTracker: Sending frame");
                            await faceMeshRef.current.send({ image: videoElement });
                        } catch (error) {
                            // Suppress
                        }
                    }

                    requestRef.current = requestAnimationFrame(processFrame);
                };

                requestRef.current = requestAnimationFrame(processFrame);

            } catch (error) {
                console.error("Failed to initialize MediaPipe:", error);
            }
        };

        initMediaPipe();

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (faceMeshRef.current) {
                try {
                    // Do NOT close FaceMesh, as it might terminate the shared WASM backend
                    // and cause subsequent re-initializations to fail with "undefined" asset errors.
                    // faceMeshRef.current.close();
                    faceMeshRef.current = null;
                } catch (e) {
                    // ignore
                }
            }
        };
    }, [isActive, videoElement, onWarning, scriptLoaded]);

    useEffect(() => {
        if (scriptLoaded) return;

        // Use local self-hosted script
        const scriptUrl = "/mediapipe/face_mesh/face_mesh.js";

        // Check if already in DOM
        if (document.querySelector(`script[src="${scriptUrl}"]`)) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;

        script.onload = () => {
            console.log("GazeTracker: Script loaded successfully (local)");
            setScriptLoaded(true);
        };

        script.onerror = (e) => {
            console.error("GazeTracker: Script load failed", e);
            setDebugInfo("Error: FaceMesh script failed to load (local)");
        };

        document.body.appendChild(script);

        return () => {
            // document.body.removeChild(script);
        };
    }, [scriptLoaded]);

    return null;
}
