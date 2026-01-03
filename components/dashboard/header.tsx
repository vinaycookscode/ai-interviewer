import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@/components/auth/user-button";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GeminiModelSelector } from "@/components/gemini-model-selector";
import { getGeminiModel } from "@/actions/gemini-config";

import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";

interface DashboardHeaderProps {
    user: any;
    userRole?: string;
}

export async function DashboardHeader({ user, userRole }: DashboardHeaderProps) {
    const [currentModel, canSelectModel] = await Promise.all([
        getGeminiModel(),
        checkFeature(FEATURES.MODEL_SELECTION)
    ]);

    return (
        <header className="h-16 bg-card border-b shadow-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
            <Link href="/dashboard" className="flex items-center gap-2"> {/* Wrapped the logo area with Link */}
                <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
                <div className="hidden md:block">
                    <h1 className="text-xl font-bold">
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Get Back To U</span> {/* Applied gradient to span */}
                    </h1>
                    <p className="text-muted-foreground text-[10px] leading-none">Intelligent Hiring Platform</p>
                </div>
            </Link>

            <div className="flex items-center gap-4">
                {canSelectModel && (
                    <div className="hidden md:block">
                        <GeminiModelSelector currentModel={currentModel} />
                    </div>
                )}

                {user && (
                    <div className="flex flex-col items-end mr-2 hidden md:flex">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase()}</span>
                    </div>
                )}
                <ModeToggle />
                <UserButton />
            </div>
        </header>
    );
}
