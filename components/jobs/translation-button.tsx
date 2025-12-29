"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TranslationButtonProps {
    onTranslate: (language: string) => Promise<void>;
}

export function TranslationButton({ onTranslate }: TranslationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleTranslate = async (lang: string) => {
        setIsLoading(true);
        try {
            await onTranslate(lang);
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    {isLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Languages className="mr-2 h-3.5 w-3.5" />}
                    Translate
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="end">
                <div className="space-y-2">
                    <h4 className="font-medium text-xs leading-none mb-2 text-muted-foreground">Translate to...</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {['Hindi', 'Marathi', 'Tamil', 'Kannada', 'English', 'Spanish'].map(lang => (
                            <Button
                                key={lang}
                                variant="ghost"
                                size="sm"
                                className="justify-start h-7 text-xs"
                                onClick={() => handleTranslate(lang)}
                            >
                                {lang}
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
