"use client";

import { useEffect, useRef, useState } from "react";

interface GazeTrackerProps {
    videoElement: HTMLVideoElement | null;
    onWarning: (message: string, type: string) => void;
    isActive: boolean;
}

export function GazeTracker({ videoElement, onWarning, isActive }: GazeTrackerProps) {
    const [gazeDirection, setGazeDirection] = useState<"CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN">("CENTER");
    const lookAwayStartTime = useRef<number | null>(null);
    const warningTriggered = useRef<boolean>(false);
    const faceMeshRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);

    useEffect(() => {
        if (!isActive || !videoElement) return;

        let faceMesh: any = null;
        let camera: any = null;

        const loadMediaPipe = async () => {
            try {
                const { FaceMesh } = await import("@mediapipe/face_mesh");
                const { Camera } = await import("@mediapipe/camera_utils");

                faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    },
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults((results: any) => {
                    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
                        return;
                    }

                    const landmarks = results.multiFaceLandmarks[0];

                    // Left Eye
                    const leftEyeInner = landmarks[362];
                    const leftEyeOuter = landmarks[263];
                    const leftIris = landmarks[468];

                    // Right Eye
                    const rightEyeInner = landmarks[133];
                    const rightEyeOuter = landmarks[33];
                    const rightIris = landmarks[473];

                    // Calculate horizontal gaze
                    const getHorizontalRatio = (inner: any, outer: any, iris: any) => {
                        const eyeWidth = Math.abs(outer.x - inner.x);
                        const irisDist = Math.abs(iris.x - inner.x);
                        return irisDist / eyeWidth;
                    };

                    const leftRatio = getHorizontalRatio(leftEyeInner, leftEyeOuter, leftIris);
                    const rightRatio = getHorizontalRatio(rightEyeInner, rightEyeOuter, rightIris);
                    const avgRatio = (leftRatio + rightRatio) / 2;

                    let direction: "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN" = "CENTER";

                    if (avgRatio > 0.75) {
                        direction = "RIGHT"; // User looking left
                    } else if (avgRatio < 0.25) {
                        direction = "LEFT"; // User looking right
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
                                onWarning("Looking away detected (>5s)", "GAZE_DETECTED");
                                warningTriggered.current = true;
                            }
                        }
                    } else {
                        lookAwayStartTime.current = null;
                        warningTriggered.current = false;
                    }
                });

                faceMeshRef.current = faceMesh;

                camera = new Camera(videoElement, {
                    onFrame: async () => {
                        if (faceMeshRef.current) {
                            await faceMeshRef.current.send({ image: videoElement });
                        }
                    },
                    width: 640,
                    height: 480,
                });
                camera.start();
                cameraRef.current = camera;

            } catch (error) {
                console.error("Failed to load MediaPipe:", error);
            }
        };

        loadMediaPipe();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, [isActive, videoElement, onWarning]);

    return null;
}
