"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { setGeminiModel, getAvailableGeminiModels } from "@/actions/gemini-config";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useVisibilityPolling } from "@/lib/use-visibility-polling";
import { POLLING_INTERVALS } from "@/lib/polling-config";

// Default fallback models
const DEFAULT_MODELS = [
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Experimental)" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Best Quality)" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Fast & Versatile)" },
];

interface GeminiModelSelectorProps {
    currentModel: string;
}

export function GeminiModelSelector({ currentModel }: GeminiModelSelectorProps) {
    const [model, setModel] = React.useState(currentModel);
    const [models, setModels] = React.useState<{ value: string; label: string; disabled?: boolean; availableAt?: number }[]>(DEFAULT_MODELS);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchModels = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const availableModels = await getAvailableGeminiModels();
            if (availableModels && availableModels.length > 0) {
                const formatted = availableModels.map((m: any) => ({
                    value: m.id,
                    label: m.name,
                    disabled: m.disabled,
                    availableAt: m.availableAt
                }));
                setModels(formatted);
            }
        } catch (error) {
            console.error("Failed to load dynamic models", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch on mount
    React.useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    // Visibility-aware polling - pauses when tab is hidden
    useVisibilityPolling(fetchModels, POLLING_INTERVALS.MODEL_STATUS);

    const handleModelChange = async (value: string) => {
        setModel(value);
        try {
            await setGeminiModel(value);
            const selectedLabel = models.find(m => m.value === value)?.label || value;
            toast.success(`Switched to ${selectedLabel}`);
        } catch (error) {
            toast.error("Failed to update model preference");
            console.error(error);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                value={model}
                onValueChange={handleModelChange}
                onOpenChange={(open) => {
                    if (open) fetchModels();
                }}
            >
                <SelectTrigger className="w-[220px] h-9 text-xs">
                    <Sparkles className={`mr-2 h-3.5 w-3.5 ${models.find(m => m.value === model)?.disabled ? 'text-gray-400' : 'text-orange-500'}`} />
                    <SelectValue>
                        {models.find(m => m.value === model)?.label || "Select Model"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {models.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-xs" disabled={m.disabled}>
                            <div className="flex items-center justify-between w-full gap-2">
                                <span className={m.disabled ? "text-muted-foreground" : ""}>{m.label}</span>
                                <div className="flex items-center gap-1">
                                    {m.value === model && !m.disabled && (
                                        <Badge variant="default" className="text-[10px] px-1 py-0">Active</Badge>
                                    )}
                                    {m.disabled && (
                                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                            {m.availableAt
                                                ? new Date(m.availableAt).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })
                                                : "Limited"}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
