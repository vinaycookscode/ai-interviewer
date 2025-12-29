"use client";

import { INTERVIEW_LANGUAGES } from "@/lib/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { updateJob } from "@/actions/job";
import { generateQuestions } from "@/actions/questions";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLimit } from "@/components/providers/limit-provider";
import { TranslationButton } from "@/components/jobs/translation-button";

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    requireResume: z.boolean().default(false),
    requireAadhar: z.boolean().default(false),
    requirePAN: z.boolean().default(false),
});

interface Question {
    id?: string;
    text: string;
    type: "TEXT" | "CODE";
}

interface EditJobFormProps {
    jobId: string;
    initialData: {
        title: string;
        description: string;
        requireResume: boolean;
        requireAadhar: boolean;
        requirePAN: boolean;
        questions: { id: string; text: string; type: "TEXT" | "CODE" }[];
    };
}

export function EditJobForm({ jobId, initialData }: EditJobFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Ensure initial questions have a type, defaulting to TEXT if missing (for legacy data)
    const [questions, setQuestions] = useState<Question[]>(
        initialData.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type || "TEXT"
        }))
    );

    const [generationLanguage, setGenerationLanguage] = useState<string>("auto");
    const { setRateLimited } = useLimit();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: initialData.title,
            description: initialData.description,
            requireResume: initialData.requireResume,
            requireAadhar: initialData.requireAadhar,
            requirePAN: initialData.requirePAN,
        },
    });

    async function handleGenerateQuestions() {
        const description = form.getValues("description");
        if (!description || description.length < 10) {
            toast.error("Please enter a job description first");
            return;
        }

        setIsGenerating(true);
        try {
            const lang = generationLanguage === "auto" ? undefined : generationLanguage;
            const result = await generateQuestions(description, lang);
            if (result.success && result.questions) {
                // Append new questions to existing ones
                const newQuestions = result.questions.map((q, i) => ({
                    id: `ai-${Date.now()}-${i}`,
                    text: q,
                    type: "TEXT" as const
                }));
                setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
                toast.success("Questions generated successfully");
            } else {
                if (result.isRateLimit) {
                    setRateLimited(true);
                    return;
                }
                if (result.error?.includes("API key")) {
                    toast.error(result.error, {
                        action: {
                            label: "Settings",
                            onClick: () => window.location.href = "/settings"
                        }
                    });
                } else {
                    toast.error(result.error || "Failed to generate questions");
                }
            }
        } catch (error) {
            toast.error("Failed to generate questions. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }

    function updateQuestionText(index: number, value: string) {
        setQuestions(prev => {
            const newQuestions = [...prev];
            newQuestions[index] = { ...newQuestions[index], text: value };
            return newQuestions;
        });
    }

    function updateQuestionType(index: number, value: "TEXT" | "CODE") {
        setQuestions(prev => {
            const newQuestions = [...prev];
            newQuestions[index] = { ...newQuestions[index], type: value };
            return newQuestions;
        });
    }

    function removeQuestion(index: number) {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    }

    function addManualQuestion() {
        setQuestions(prev => [...prev, { id: `temp-${Date.now()}`, text: "", type: "TEXT" }]);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await updateJob(jobId, { ...values, questions });
            toast.success("Job updated successfully");
            router.push(`/dashboard/jobs/${jobId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to update job", error);
            toast.error("Failed to update job");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Senior React Developer" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Job Description</FormLabel>
                                <div className="flex items-center gap-2">
                                    <TranslationButton
                                        onTranslate={async (lang: string) => {
                                            const currentText = form.getValues("description");
                                            if (!currentText) return;

                                            const { translateText } = await import("@/actions/translation");
                                            const result = await translateText(currentText, lang);

                                            if (result.success && result.translatedText) {
                                                form.setValue("description", result.translatedText);
                                                toast.success("Description translated");
                                            } else {
                                                toast.error(result.error || "Translation failed");
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <FormControl>
                                <Textarea
                                    placeholder="Paste the full job description here..."
                                    className="min-h-[200px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Document Requirements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Required Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Select which documents candidates must upload before starting the interview.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="requireResume"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-lg">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                            Require Resume
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requireAadhar"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-lg">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                            Require Aadhar Card
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requirePAN"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-lg">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                            Require PAN Card
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGenerateQuestions}
                            disabled={isGenerating}
                            className="w-full sm:w-auto flex items-center justify-center"
                        >
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Generate Questions with AI</span>
                            <span className="sm:hidden">Generate with AI</span>
                        </Button>

                        <div className="w-full sm:w-[180px]">
                            <Select
                                value={generationLanguage}
                                onValueChange={setGenerationLanguage}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Output Language (Auto)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Same as Description</SelectItem>
                                    {INTERVIEW_LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={addManualQuestion}
                            className="w-full sm:w-auto flex items-center justify-center ml-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Add Question Manually</span>
                            <span className="sm:hidden">Add Manually</span>
                        </Button>
                    </div>
                </div>

                {questions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Interview Questions ({questions.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {questions.map((question, index) => (
                                <div key={question.id || `temp-${index}`} className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            value={question.text}
                                            onChange={(e) => updateQuestionText(index, e.target.value)}
                                            placeholder={`Question ${index + 1}`}
                                        />
                                        <div className="w-[150px]">
                                            <Select
                                                value={question.type}
                                                onValueChange={(value: "TEXT" | "CODE") => updateQuestionType(index, value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TEXT">Oral Answer</SelectItem>
                                                    <SelectItem value="CODE">Code Editor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(index)}
                                        className="mt-0.5 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}
