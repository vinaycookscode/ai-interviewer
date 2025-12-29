"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleUserFeature } from "@/actions/features";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FeatureToggleSwitchProps {
    userId: string;
    featureKey: string;
    initialValue: boolean;
}

export function FeatureToggleSwitch({ userId, featureKey, initialValue }: FeatureToggleSwitchProps) {
    const [isEnabled, setIsEnabled] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (checked: boolean) => {
        setIsEnabled(checked); // Optimistic update
        setIsLoading(true);

        try {
            const result = await toggleUserFeature(userId, featureKey, checked);
            if (result && result.error) {
                throw new Error(result.error);
            }
            toast.success("Feature updated");
        } catch (error) {
            setIsEnabled(!checked); // Revert
            toast.error("Failed to update feature");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={isLoading} />
        </div>
    );
}
