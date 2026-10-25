import Link from "next/link";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";

/** Every auth screen: the landing's header pill above one centred glass card. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
            <AmbientLight />

            <div className="relative mx-auto flex min-h-screen max-w-[1160px] flex-col px-4 pb-10 pt-4 sm:px-8 sm:pt-6">
                <header className="sg-bar flex items-center justify-between gap-3 rounded-full py-2 pl-3 pr-2 sm:pl-4">
                    <Link href="/" className={cn("flex items-center gap-2 rounded-full sm:gap-2.5", focusRing)}>
                        <UMark className="size-7 sm:size-8" />
                        <span className="whitespace-nowrap font-display sg-soft text-base font-semibold sm:text-xl">Get Back To U</span>
                    </Link>
                    <ThemeSwitch />
                </header>

                <main className="flex flex-1 items-center justify-center py-10 sm:py-14">{children}</main>
            </div>
        </div>
    );
}
