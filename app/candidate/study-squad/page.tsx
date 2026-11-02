import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getUserSquads, getPublicSquads } from "@/actions/study-squad";
import { StudySquadClient } from "./client";

export default async function StudySquadPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    // Hidden until it's ready (AIIN-75): a direct link finds nothing, like any page that isn't there
    if (!(await checkFeature(FEATURES.STUDY_SQUAD))) notFound();

    const [userSquads, publicSquads] = await Promise.all([
        getUserSquads(session.user.id),
        getPublicSquads()
    ]);

    return (
        <StudySquadClient
            userSquads={userSquads}
            publicSquads={publicSquads}
        />
    );
}
