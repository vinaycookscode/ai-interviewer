"use client";

import Script from "next/script";
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
    const [scriptsLoaded, setScriptsLoaded] = useState({ faceMesh: false });

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
        if (!isActive || !videoElement || !scriptsLoaded.faceMesh) return;

        const initMediaPipe = () => {
            if (!window.FaceMesh) return;

            try {
                // console.log("GazeTracker: Initializing MediaPipe FaceMesh");
                const faceMesh = new window.FaceMesh({
                    locateFile: (file: string) => {
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
                        // console.log("GazeTracker: No face detected");
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

                    // Calculate horizontal gaze
                    const getHorizontalRatio = (inner: any, outer: any, iris: any) => {
                        const eyeWidth = Math.abs(outer.x - inner.x);
                        const irisDist = Math.abs(iris.x - inner.x);
                        return irisDist / eyeWidth;
                    };

                    // Calculate vertical gaze
                    const getVerticalRatio = (top: any, bottom: any, iris: any) => {
                        const eyeHeight = Math.abs(bottom.y - top.y);
                        const irisDist = Math.abs(iris.y - top.y);
                        return irisDist / eyeHeight;
                    };

                    const leftRatio = getHorizontalRatio(leftEyeInner, leftEyeOuter, leftIris);
                    const rightRatio = getHorizontalRatio(rightEyeInner, rightEyeOuter, rightIris);
                    const avgHorizontalRatio = (leftRatio + rightRatio) / 2;

                    const leftVerticalRatio = getVerticalRatio(leftEyeTop, leftEyeBottom, leftIris);
                    const rightVerticalRatio = getVerticalRatio(rightEyeTop, rightEyeBottom, rightIris);
                    const avgVerticalRatio = (leftVerticalRatio + rightVerticalRatio) / 2;

                    // console.log(`GazeTracker: H=${avgHorizontalRatio.toFixed(2)}, V=${avgVerticalRatio.toFixed(2)}`);

                    let direction: "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN" = "CENTER";

                    // Tuned Thresholds
                    if (avgHorizontalRatio > 0.6) {
                        direction = "RIGHT";
                    } else if (avgHorizontalRatio < 0.4) {
                        direction = "LEFT";
                    } else if (avgVerticalRatio < 0.3) { // Iris closer to top
                        direction = "UP";
                    } else if (avgVerticalRatio > 0.7) { // Iris closer to bottom
                        direction = "DOWN";
                    } else {
                        direction = "CENTER";
                    }

                    setGazeDirection(direction);

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
                            await faceMeshRef.current.send({ image: videoElement });
                        } catch (error) {
                            console.warn("FaceMesh send error:", error);
                        }
                    }

                    // Throttle to ~10 FPS to save performance
                    // setTimeout(() => {
                    //     requestRef.current = requestAnimationFrame(processFrame);
                    // }, 100);
                    // Actually, requestAnimationFrame is fine, FaceMesh is heavy so it might naturally throttle
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
                    faceMeshRef.current.close();
                } catch (e) {
                    console.warn("Error closing FaceMesh:", e);
                }
                faceMeshRef.current = null;
            }
        };
    }, [isActive, videoElement, onWarning, scriptsLoaded]);

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js"
                onLoad={() => setScriptsLoaded(prev => ({ ...prev, faceMesh: true }))}
                strategy="lazyOnload"
            />
        </>
    );
}
