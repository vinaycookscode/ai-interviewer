import { getTranslations } from "next-intl/server";

/** Placeholder card while an auth screen loads; renders inside the auth layout. */
export default async function AuthLoading() {
    const t = await getTranslations("Auth");

    return (
        <div role="status" className="w-full max-w-[440px]">
            <span className="sr-only">{t("loading")}</span>
            <div aria-hidden="true" className="sg-glass animate-pulse rounded-[28px] p-6 sm:rounded-[32px] sm:p-9">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-14 rounded-2xl bg-sg-track" />
                    <div className="h-8 w-48 rounded-full bg-sg-track" />
                    <div className="h-4 w-56 max-w-full rounded-full bg-sg-track" />
                </div>
                <div className="mt-7 flex flex-col gap-5">
                    {[0, 1].map((i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-4 w-20 rounded-full bg-sg-track" />
                            <div className="h-12 rounded-2xl bg-sg-track" />
                        </div>
                    ))}
                    <div className="mt-1 h-12 rounded-full bg-sg-track" />
                </div>
            </div>
        </div>
    );
}
