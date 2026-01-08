"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, Layers } from "lucide-react";
import Link from "next/link";

interface DeckCardProps {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    cardCount: number;
    masteryPercent: number;
    isOwned?: boolean;
}

const categoryColors: Record<string, string> = {
    DSA: "bg-blue-500",
    "System Design": "bg-purple-500",
    Behavioral: "bg-green-500",
    SQL: "bg-orange-500",
    Custom: "bg-cyan-500",
};

export function DeckCard({
    id,
    name,
    description,
    category,
    cardCount,
    masteryPercent,
    isOwned,
}: DeckCardProps) {
    return (
        <TooltipProvider>
            <Link href={`/candidate/flashcards/${id}`}>
                <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden">
                    <CardHeader className="pb-3 overflow-hidden">
                        <div className="flex items-start gap-2">
                            <div className={`p-2 rounded-lg shrink-0 ${categoryColors[category] || "bg-gray-500"}`}>
                                <Layers className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="text-base font-semibold leading-tight group-hover:text-primary transition-colors overflow-hidden text-ellipsis whitespace-nowrap">
                                            {name}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p>{name}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Badge variant="outline" className="mt-1.5 text-xs">
                                    {category}
                                </Badge>
                            </div>
                            {isOwned && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    Custom
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        {description && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {description}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs" side="top">
                                    <p>{description}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4 shrink-0" />
                            <span>{cardCount} cards</span>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Mastery</span>
                                <span className="font-medium">{masteryPercent}%</span>
                            </div>
                            <Progress value={masteryPercent} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </TooltipProvider>
    );
}
