import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getUserSquads, getPublicSquads } from "@/actions/study-squad";
import { StudySquadClient } from "./client";

export default async function StudySquadPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.STUDY_SQUAD);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

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
