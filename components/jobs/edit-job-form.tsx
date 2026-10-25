"use client";

import { JobForm, type JobFormInitialData } from "@/components/jobs/job-form";

interface EditJobFormProps {
    jobId: string;
    initialData: JobFormInitialData;
}

export function EditJobForm({ jobId, initialData }: EditJobFormProps) {
    return <JobForm mode="edit" jobId={jobId} initialData={initialData} />;
}
