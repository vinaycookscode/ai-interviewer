"use client";

import { useState, useEffect } from "react";
import { PermissionCheck } from "@/components/interview/permission-check";
import { InterviewSession } from "@/components/interview/interview-session";
import { LanguageSelector } from "@/components/interview/language-selector";
import { ConsentNotice } from "@/components/interview/consent-notice";

interface InterviewClientPageProps {
    interview: { id: string; language: string | null; job: { title: string } };
    /** Set when the integrity notice hasn't been agreed to yet (AIIN-176). */
    notice: { company: string | null; expires: string | null } | null;
    questions: { id: string; text: string; type?: "TEXT" | "CODE" }[];
    userDocuments: {
        resumeUrl?: string | null;
        panUrl?: string | null;
        aadhaarUrl?: string | null;
    };
}

export function InterviewClientPage({ interview, notice, questions, userDocuments }: InterviewClientPageProps) {
    const [language, setLanguage] = useState<string | null>(interview.language || null);
    const [agreed, setAgreed] = useState(notice === null);
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

    // Agreement comes before the camera is even asked for: no camera check runs before it
    if (!agreed && notice) {
        return (
            <ConsentNotice
                interviewId={interview.id}
                jobTitle={interview.job.title}
                company={notice.company}
                expires={notice.expires}
                language={language}
                onAgreed={() => setAgreed(true)}
            />
        );
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
