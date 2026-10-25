import { CandidateList, type CandidateRow } from "@/components/jobs/candidate-list";

/** Every candidate across the employer's jobs, with the job column. */
export function CandidatesTable({ interviews }: { interviews: CandidateRow[] }) {
    return <CandidateList interviews={interviews} showJob />;
}
