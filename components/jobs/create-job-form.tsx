"use client";

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
import { createJob } from "@/actions/job";
import { generateQuestions } from "@/actions/questions";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TranslationButton } from "@/components/jobs/translation-button";
import { INTERVIEW_LANGUAGES } from "@/lib/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// ... imports

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    requireResume: z.boolean(),
    requireAadhar: z.boolean(),
    requirePAN: z.boolean(),
});

export function CreateJobForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [generationLanguage, setGenerationLanguage] = useState<string>("auto");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            requireResume: false,
            requireAadhar: false,
            requirePAN: false,
        },
    });

    // Watch for changes in questions array to re-render
    // const questions = form.watch("questions") || [];

    async function handleGenerateQuestions() {
        const description = form.getValues("description");
        if (!description || description.length < 10) {
            toast.error("Please enter a job description first (min 10 characters)");
            return;
        }

        setIsGenerating(true);
        try {
            const lang = generationLanguage === "auto" ? undefined : generationLanguage;
            const result = await generateQuestions(description, lang);
            if (result.success && result.questions) {
                // Append new questions to existing ones from state
                setQuestions(prev => [...prev, ...result.questions!]);
                toast.success("Questions generated successfully");
            } else {
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

    function updateQuestion(index: number, value: string) {
        const newQuestions = [...questions];
        newQuestions[index] = value;
        setQuestions(newQuestions);
    }

    function removeQuestion(index: number) {
        setQuestions(questions.filter((_, i) => i !== index));
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await createJob({ ...values, questions });
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            console.error("Failed to create job", error);
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
                                    {/* Translation Feature */}
                                    {/* We need state for language. Since this is inside render prop, we might need to lift state up or use a separate component. 
                                         But keeping it inline for now is easier if we use React state from parent component.
                                     */}
                                    <TranslationButton
                                        onTranslate={async (lang) => {
                                            const currentText = form.getValues("description");
                                            if (!currentText) return;

                                            // Call translate action
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
                        <FormField
                            control={form.control}
                            name="requireResume"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Require Resume</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="requireAadhar"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Require Aadhar Card</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="requirePAN"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Require PAN Card</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
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
                            variant="outline"
                            onClick={() => setQuestions([...questions, ""])}
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
                        <CardContent className="space-y-3">
                            {questions.map((question, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={question}
                                        onChange={(e) => updateQuestion(index, e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Job
                </Button>
            </form>
        </Form>
    );
}

