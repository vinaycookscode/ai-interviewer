import { useTranslations } from "next-intl";
import { label, panel, row, sectionTitle } from "@/components/jobs/employer-ui";

interface PersonalityProfile {
    communicationStyle: string;
    confidenceScore: number;
    technicalDepth: string;
    strengths: string[];
    weaknesses: string[];
    cultureFitScore: number;
    summary: string;
}

interface PersonalityCardProps {
    profile: PersonalityProfile | null;
    viewer?: "candidate" | "employer";
}

/** How the candidate came across. The candidate sees it too, without the culture-fit rating (AIIN-42). */
export function PersonalityCard({ profile, viewer = "employer" }: PersonalityCardProps) {
    const t = useTranslations("FeedbackReport.personality");
    if (!profile) return null;
    const own = viewer === "candidate";

    const traits = [
        { term: t("communication"), value: profile.communicationStyle },
        { term: t("technicalDepth"), value: profile.technicalDepth },
        { term: t("confidence"), value: t("outOfTen", { value: Number(profile.confidenceScore.toFixed(1)) }) },
        ...(own ? [] : [{ term: t("cultureFit"), value: t("outOfHundred", { value: Math.round(profile.cultureFitScore) }) }]),
    ];

    return (
        <section aria-labelledby="personality-title" className={`${panel} gap-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="personality-title" className={sectionTitle}>
                    {own ? t("titleOwn") : t("title")}
                </h2>
                <span className="font-medium text-sg-muted">{own ? t("fromAnswers") : t("teamOnly")}</span>
            </div>

            {own && <p className="text-sg-muted">{t("ownNote")}</p>}

            <dl className={own ? "grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3" : "grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-4"}>
                {traits.map((trait) => (
                    <div key={trait.term} className={`${row} min-w-0`}>
                        <dt className={label}>{trait.term}</dt>
                        <dd className="mt-1 text-lg font-bold break-words">{trait.value}</dd>
                    </div>
                ))}
            </dl>

            {/* Written about the candidate for the employer, so it's the employer's only */}
            {!own && profile.summary && <p className="text-[17px] leading-[27px]">{profile.summary}</p>}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <TraitList title={own ? t("worked") : t("strengths")} items={profile.strengths} />
                <TraitList title={own ? t("workOn") : t("growthAreas")} items={profile.weaknesses} />
            </div>
        </section>
    );
}

function TraitList({ title, items }: { title: string; items: string[] }) {
    if (items.length === 0) return null;
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <h3 className="font-bold">{title}</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-[18px] text-sg-muted">
                {items.map((item, i) => (
                    <li key={i} className="break-words">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
