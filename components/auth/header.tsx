import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import Link from "next/link";

const font = Poppins({
    subsets: ["latin"],
    weight: ["600"],
});

interface HeaderProps {
    label: string;
}

export const Header = ({ label }: HeaderProps) => {
    return (
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
            <Link href="/" className="group">
                <h1 className={cn("text-3xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform", font.className)}>
                    AI Interviewer
                </h1>
            </Link>
            <p className="text-muted-foreground text-sm">{label}</p>
        </div>
    );
};
