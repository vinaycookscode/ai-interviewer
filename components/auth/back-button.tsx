import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface BackButtonProps {
    href: string;
    label: string;
}

export const BackButton = ({ href, label }: BackButtonProps) => {
    const searchParams = useSearchParams();

    // Append current search params to the link to preserve context (like plan selection)
    const preservedHref = `${href}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    return (
        <Button variant="link" className="font-normal w-full" size="sm" asChild>
            <Link href={preservedHref}>{label}</Link>
        </Button>
    );
};

