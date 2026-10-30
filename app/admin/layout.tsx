import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGeminiModel } from "@/actions/gemini-config";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { AdminShell } from "@/components/admin/admin-shell";
import { GeminiModelSelector } from "@/components/gemini-model-selector";

/** The admin console, in Soft Glass (AIIN-138). Admins only; every admin action checks again on the server. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");
    if (session.user.role !== "ADMIN") redirect("/dashboard");

    const [currentModel, canSelectModel] = await Promise.all([getGeminiModel(), checkFeature(FEATURES.MODEL_SELECTION)]);

    return (
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <AdminShell modelPicker={canSelectModel ? <GeminiModelSelector currentModel={currentModel} /> : null}>{children}</AdminShell>
        </div>
    );
}
