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
import { Loader2, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
});

export function CreateJobForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    });

    async function handleGenerateQuestions() {
        const description = form.getValues("description");
        if (!description || description.length < 10) {
            alert("Please enter a job description first");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateQuestions(description);
            if (result.success && result.questions) {
                setQuestions(result.questions);
            } else {
                alert(result.error || "Failed to generate questions");
            }
        } catch (error) {
            alert("Failed to generate questions. Please try again.");
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
                            <FormLabel>Job Description</FormLabel>
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

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateQuestions}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate Questions with AI
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setQuestions([...questions, ""])}
                    >
                        Add Question Manually
                    </Button>
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

