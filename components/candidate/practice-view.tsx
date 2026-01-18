"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createMockInterview, checkApiStatus } from "@/actions/mock-interview";
import {
    Loader2,
    Sparkles,
    AlertCircle,
    Target,
    Brain,
    TrendingUp,
    Zap,
    ChevronRight,
    Code,
    Users,
    LineChart
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function PracticeView() {
    const t = useTranslations("PracticeInterviews");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState("");
    const [difficulty, setDifficulty] = useState("Junior");
    const [apiStatus, setApiStatus] = useState<{ available: boolean; usingFallback?: boolean; reason?: string } | null>(null);
    const [isCheckingApi, setIsCheckingApi] = useState(true);

    // Quick start presets for common roles
    const QUICK_START_PRESETS = [
        {
            role: t("roles.frontend"),
            difficulty: "Junior",
            difficultyLabel: t("roles.junior"),
            icon: Code,
            gradient: "from-blue-500 to-cyan-500",
            description: t("roles.frontendDesc")
        },
        {
            role: t("roles.backend"),
            difficulty: "Mid",
            difficultyLabel: t("roles.mid"),
            icon: Code,
            gradient: "from-purple-500 to-pink-500",
            description: t("roles.backendDesc")
        },
        {
            role: t("roles.pm"),
            difficulty: "Mid",
            difficultyLabel: t("roles.mid"),
            icon: Users,
            gradient: "from-orange-500 to-red-500",
            description: t("roles.pmDesc")
        },
        {
            role: t("roles.data"),
            difficulty: "Senior",
            difficultyLabel: t("roles.senior"),
            icon: LineChart,
            gradient: "from-green-500 to-emerald-500",
            description: t("roles.dataDesc")
        }
    ];

    // Check API status on mount
    useEffect(() => {
        const checkApi = async () => {
            const status = await checkApiStatus();
            setApiStatus(status);
            setIsCheckingApi(false);
        };
        checkApi();
    }, []);

    const handleStart = () => {
        if (!role) {
            toast.error(t("toast.enterRole"));
            return;
        }

        startTransition(async () => {
            const result = await createMockInterview(role, difficulty);
            if (result.success && result.mockInterviewId) {
                toast.success(t("toast.created"));
                router.push(`/candidate/practice/${result.mockInterviewId}`);
            } else {
                toast.error(result.error || t("limitedAvailability.fallback"));
            }
        });
    };

    const handleQuickStart = (preset: typeof QUICK_START_PRESETS[0]) => {
        setRole(preset.role);
        setDifficulty(preset.difficulty);

        // Auto-start after a brief moment to show the selection
        setTimeout(() => {
            startTransition(async () => {
                const result = await createMockInterview(preset.role, preset.difficulty);
                if (result.success && result.mockInterviewId) {
                    toast.success(t("quickStart.starting", { role: preset.role }));
                    router.push(`/candidate/practice/${result.mockInterviewId}`);
                } else {
                    toast.error(result.error || t("limitedAvailability.fallback"));
                }
            });
        }, 300);
    };

    const isDisabled = !apiStatus?.available || isPending;

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 sm:py-12">
            {/* Hero Section */}
            <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    {t("badge")}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t("mainTitle")}
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    {t("description")}
                </p>

                {/* Feature Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                        <Target className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{t("features.realistic")}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                        <Brain className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{t("features.feedback")}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{t("features.progress")}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                        <Zap className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{t("features.results")}</span>
                    </div>
                </div>
            </div>

            {isCheckingApi ? (
                <Card className="border-2 border-primary/10 shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">{t("checking")}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {apiStatus?.usingFallback && (
                        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("limitedAvailability.title")}</AlertTitle>
                            <AlertDescription>
                                {apiStatus?.reason || t("limitedAvailability.fallback")}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Two Column Layout - Responsive */}
                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                        {/* LEFT: Custom Setup */}
                        <div className="order-2 lg:order-1 flex flex-col">
                            <h2 className="text-2xl font-bold mb-4 text-center">{t("customSetup.title")}</h2>
                            <p className="text-muted-foreground mb-6 text-center">{t("customSetup.subtitle")}</p>

                            <Card className="border-2 border-primary/10 shadow-lg h-full flex-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        {t("customSetup.config")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("customSetup.configDesc")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">{t("customSetup.roleLabel")}</Label>
                                        <Input
                                            id="role"
                                            placeholder={t("customSetup.rolePlaceholder")}
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            disabled={isDisabled}
                                            className="text-base"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t("customSetup.roleHint")}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t("customSetup.difficultyLabel")}</Label>
                                        <Select value={difficulty} onValueChange={setDifficulty} disabled={isDisabled}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Junior">{t("customSetup.difficultyJunior")}</SelectItem>
                                                <SelectItem value="Mid">{t("customSetup.difficultyMid")}</SelectItem>
                                                <SelectItem value="Senior">{t("customSetup.difficultySenior")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {t("customSetup.difficultyHint")}
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleStart}
                                        disabled={isDisabled}
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("customSetup.submitting")}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {t("customSetup.submit")}
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT: Quick Start */}
                        <div className="order-1 lg:order-2 flex flex-col">
                            <h2 className="text-2xl font-bold mb-4 text-center">{t("quickStart.title")}</h2>
                            <p className="text-muted-foreground mb-6 text-center">{t("quickStart.subtitle")}</p>

                            <div className="grid grid-cols-2 gap-4">
                                {QUICK_START_PRESETS.map((preset) => {
                                    const Icon = preset.icon;
                                    return (
                                        <Card
                                            key={preset.role}
                                            className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                                            onClick={() => !isDisabled && handleQuickStart(preset)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${preset.gradient}`}>
                                                        <Icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold mb-1">{preset.role}</h3>
                                                        <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                                                {preset.difficultyLabel}
                                                            </span>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
