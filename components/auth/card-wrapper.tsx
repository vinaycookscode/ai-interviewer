import { Mascot } from "@/components/soft-glass/mascot";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    /** The way to the other auth screen, e.g. "New here?" + "Create an account". */
    footer?: { prompt?: string; label: string; href: string };
}

/** The card every auth screen sits in: U, the heading, the form, then the link to the other screen. */
export const CardWrapper = ({ children, title, description, footer }: CardWrapperProps) => {
    return (
        <section className="sg-glass sg-shadow-lg w-full max-w-[440px] rounded-[28px] p-6 sm:rounded-[32px] sm:p-9">
            <div className="flex flex-col items-center gap-3 text-center">
                <Mascot className="size-14" />
                <h1 className="font-display sg-soft text-balance text-[30px] font-semibold leading-[36px] tracking-[-0.02em] sm:text-[34px] sm:leading-[40px]">
                    {title}
                </h1>
                {description && <p className="text-sg-muted">{description}</p>}
            </div>
            <div className="mt-7">{children}</div>
            {footer && <BackButton {...footer} />}
        </section>
    );
};
