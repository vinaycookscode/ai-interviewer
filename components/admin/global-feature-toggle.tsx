"use client";

import { Switch } from "@/components/ui/switch";
import { toggleFeatureFlag } from "@/actions/feature-flags";
import { useState } from "react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";

interface GlobalFeatureToggleProps {
    featureKey: string;
    initialValue: boolean;
}

export function GlobalFeatureToggle({ featureKey, initialValue }: GlobalFeatureToggleProps) {
    const [isEnabled, setIsEnabled] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async (checked: boolean) => {
        setIsEnabled(checked); // Optimistic update
        setIsLoading(true);
        try {
            await toggleFeatureFlag(featureKey, checked);
            toast.success(`${featureKey} ${checked ? 'enabled' : 'disabled'}`);
            router.refresh(); // Force client-side update
        } catch (error) {
            setIsEnabled(!checked); // Revert on failure
            toast.error("Failed to update feature flag");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            aria-label={`Toggle ${featureKey}`}
        />
    );
}
