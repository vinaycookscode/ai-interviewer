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
        <header className="h-16 bg-background/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 overflow-hidden no-scrollbar">
            {/* Minimal Header Glow */}
            <div className="absolute top-0 right-1/4 w-32 h-full bg-primary/5 blur-3xl pointer-events-none" />

            <Link href="/dashboard" className="flex items-center gap-3 group relative z-10 transition-transform active:scale-95">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="relative z-10 h-8 w-8 object-contain" />
                </div>
                <div className="hidden md:block">
                    <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic mb-0.5">
                        <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Get</span>
                        <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Back</span>
                        <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">To U</span>
                    </h1>
                    <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 leading-none uppercase">Apex Hiring Engine</p>
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
