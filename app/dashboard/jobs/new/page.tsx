import { CreateJobForm } from "@/components/jobs/create-job-form";

export default function NewJobPage() {
    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Post a New Job</h1>
                <p className="text-gray-500 mt-2">
                    Create a job posting to start interviewing candidates with AI.
                </p>
            </div>
            <CreateJobForm />
        </div>
    );
}
