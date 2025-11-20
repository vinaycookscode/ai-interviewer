"use client";

import { useState } from "react";
import { PermissionCheck } from "@/components/interview/permission-check";
import { InterviewSession } from "@/components/interview/interview-session";

interface InterviewClientPageProps {
    interview: any;
    questions: any[];
}

export function InterviewClientPage({ interview, questions }: InterviewClientPageProps) {
    const [hasPermissions, setHasPermissions] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const handlePermissionsGranted = (mediaStream: MediaStream) => {
        setStream(mediaStream);
        setHasPermissions(true);
    };

    if (!hasPermissions || !stream) {
        return <PermissionCheck onPermissionsGranted={handlePermissionsGranted} />;
    }

    return (
        <InterviewSession
            interviewId={interview.id}
            questions={questions}
            stream={stream}
        />
    );
}
