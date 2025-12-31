import { checkFeature } from "@/actions/feature-flags";
import { ReactNode } from "react";

interface FeatureGateProps {
    children: ReactNode;
    feature: string;
    fallback?: ReactNode;
}

export async function FeatureGate({ children, feature, fallback = null }: FeatureGateProps) {
    const isEnabled = await checkFeature(feature);

    if (!isEnabled) {
        return fallback;
    }

    return <>{children}</>;
}
