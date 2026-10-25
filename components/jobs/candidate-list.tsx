import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DeleteCandidateButton } from "@/components/dashboard/delete-candidate-button";
import { CopyLinkButton } from "@/components/jobs/copy-link-button";
import {
    DocumentChips,
    StatusChip,
    displayName,
    formatShortDate,
    textLink,
    type DocumentRequirements,
    type InterviewStatus,
} from "@/components/jobs/employer-ui";

export interface CandidateRow {
    id: string;
    status: InterviewStatus;
    score: number | null;
    token: string | null;
    resumeUrl: string | null;
    aadhaarUrl: string | null;
    panUrl: string | null;
    createdAt: Date;
    candidate: { name: string | null; email: string };
    job: DocumentRequirements & { title: string };
}

interface CandidateListProps {
    interviews: CandidateRow[];
    /** Show the job column (the all-candidates list); the job page leaves it out. */
    showJob?: boolean;
}

const th = "px-3 py-2.5 text-left text-[13px] font-bold whitespace-nowrap text-sg-muted";

/** Candidates as a table from 640px, and as cards on phones. */
export function CandidateList({ interviews, showJob = false }: CandidateListProps) {
    const t = useTranslations("Employer.candidates");

    return (
        <>
            <div className="-mx-2 hidden overflow-x-auto sm:block">
                <table className={cn("w-full border-collapse text-[15px]", showJob ? "min-w-[820px]" : "min-w-[700px]")}>
                    <thead>
                        <tr>
                            <th scope="col" className={th}>{t("colCandidate")}</th>
                            {showJob && <th scope="col" className={th}>{t("colJob")}</th>}
                            <th scope="col" className={th}>{t("colStatus")}</th>
                            <th scope="col" className={cn(th, "text-right")}>{t("colScore")}</th>
                            <th scope="col" className={th}>{t("colDocuments")}</th>
                            <th scope="col" className={th}>{t("colInvited")}</th>
                            <th scope="col" className="px-3 py-2.5">
                                <span className="sr-only">{t("colActions")}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {interviews.map((interview) => {
                            const name = displayName(interview.candidate);
                            return (
                                <tr key={interview.id} className="border-t border-sg-rule">
                                    <th scope="row" className="max-w-[260px] p-3 text-left font-semibold">
                                        <span className="flex flex-col">
                                            <span className="break-words">{name}</span>
                                            {name !== interview.candidate.email && (
                                                <span className="text-[13px] font-medium break-all text-sg-muted">{interview.candidate.email}</span>
                                            )}
                                        </span>
                                    </th>
                                    {showJob && <td className="max-w-[220px] p-3 break-words">{interview.job.title}</td>}
                                    <td className="p-3">
                                        <StatusChip status={interview.status} />
                                    </td>
                                    <td className="p-3 text-right">
                                        <Score value={interview.score} />
                                    </td>
                                    <td className="p-3">
                                        <DocumentChips job={interview.job} interview={interview} />
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-sg-muted">{formatShortDate(interview.createdAt)}</td>
                                    <td className="p-3">
                                        <span className="flex items-center justify-end gap-1">
                                            <RowAction interview={interview} name={name} />
                                            <DeleteCandidateButton interviewId={interview.id} candidateName={name} />
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ul className="flex flex-col gap-2 sm:hidden">
                {interviews.map((interview) => {
                    const name = displayName(interview.candidate);
                    return (
                        <li key={interview.id} className="flex flex-col gap-2.5 rounded-[18px] bg-sg-row px-4 py-3.5">
                            <div className="flex items-start justify-between gap-2.5">
                                <span className="flex min-w-0 flex-col">
                                    <span className="font-bold break-words">{name}</span>
                                    <span className="text-sm break-words text-sg-muted">
                                        {showJob ? interview.job.title : formatShortDate(interview.createdAt)}
                                    </span>
                                </span>
                                <span className="font-display sg-soft text-[22px] font-semibold">
                                    <Score value={interview.score} plain />
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <StatusChip status={interview.status} />
                                <DocumentChips job={interview.job} interview={interview} />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <RowAction interview={interview} name={name} card />
                                <DeleteCandidateButton interviewId={interview.id} candidateName={name} />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

function Score({ value, plain = false }: { value: number | null; plain?: boolean }) {
    const t = useTranslations("Employer.candidates");
    if (value === null) {
        return (
            <span className="text-sg-muted">
                <span aria-hidden="true">—</span>
                <span className="sr-only">{t("noScore")}</span>
            </span>
        );
    }
    return (
        <span className={plain ? undefined : "font-bold"}>
            {value.toFixed(1)}
            <span className="sr-only"> {t("outOfTen")}</span>
        </span>
    );
}

/** "View feedback" once finished; until then, the candidate's own link to copy. */
function RowAction({ interview, name, card = false }: { interview: CandidateRow; name: string; card?: boolean }) {
    const t = useTranslations("Employer.candidates");
    if (interview.status === "COMPLETED") {
        return (
            <Link
                href={`/interview/${interview.id}/feedback`}
                aria-label={t("viewFeedbackAria", { name })}
                className={cn(textLink, card ? "self-start" : "px-2")}
            >
                {t("viewFeedback")}
            </Link>
        );
    }
    if (interview.token) {
        return <CopyLinkButton interviewId={interview.id} token={interview.token} candidateName={name} variant={card ? "card" : "row"} />;
    }
    return <span />;
}
