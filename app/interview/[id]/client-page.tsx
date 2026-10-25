"use client";

import { useState, useEffect } from "react";
import { PermissionCheck } from "@/components/interview/permission-check";
import { InterviewSession } from "@/components/interview/interview-session";
import { LanguageSelector } from "@/components/interview/language-selector";

interface InterviewClientPageProps {
    interview: { id: string; language: string | null; job: { title: string } };
    questions: { id: string; text: string; type?: "TEXT" | "CODE" }[];
    userDocuments: {
        resumeUrl?: string | null;
        panUrl?: string | null;
        aadhaarUrl?: string | null;
    };
}

export function InterviewClientPage({ interview, questions, userDocuments }: InterviewClientPageProps) {
    const [language, setLanguage] = useState<string | null>(interview.language || null);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const handleLanguageSelected = (lang: string) => {
        setLanguage(lang);
    };

    const handlePermissionsGranted = (mediaStream: MediaStream) => {
        setStream(mediaStream);
        setHasPermissions(true);
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    if (!language) {
        return <LanguageSelector interviewId={interview.id} onLanguageSelected={handleLanguageSelected} />;
    }

    if (!hasPermissions || !stream) {
        return <PermissionCheck onPermissionsGranted={handlePermissionsGranted} />;
    }

    return (
        <InterviewSession
            interviewId={interview.id}
            questions={questions}
            stream={stream}
            language={language}
            onLanguageChange={setLanguage}
            jobTitle={interview.job.title}
            userDocuments={userDocuments}
        />
    );
}
