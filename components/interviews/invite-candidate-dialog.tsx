"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { inviteCandidate } from "@/actions/interview";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";

const formSchema = z.object({
    candidateName: z.string().min(2, "Name must be at least 2 characters"),
    candidateEmail: z.string().email("Invalid email address"),
});

export function InviteCandidateDialog({ jobId }: { jobId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [interviewLink, setInterviewLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            candidateName: "",
            candidateEmail: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const result = await inviteCandidate({
                jobId,
                candidateName: values.candidateName,
                candidateEmail: values.candidateEmail,
            });

            if (result.success) {
                form.reset();
                router.refresh();

                // Show interview link if available
                if (result.interviewLink) {
                    setInterviewLink(result.interviewLink);
                } else {
                    setOpen(false);
                    alert("Invitation sent successfully!");
                }
            } else {
                alert(result.error || "Failed to send invitation");
            }
        } catch (error) {
            console.error("Failed to invite candidate", error);
            alert("Failed to send invitation. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function copyToClipboard() {
        if (interviewLink) {
            navigator.clipboard.writeText(interviewLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function handleClose() {
        setOpen(false);
        setInterviewLink(null);
        setCopied(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Candidate
                </Button>
            </DialogTrigger>
            <DialogContent>
                {!interviewLink ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Invite Candidate</DialogTitle>
                            <DialogDescription>
                                Send an interview invitation to a candidate via email.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="candidateName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Candidate Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="candidateEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </form>
                        </Form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Invitation Sent!</DialogTitle>
                            <DialogDescription>
                                Copy the interview link below and send it to the candidate.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-100 rounded-lg break-all text-sm">
                                {interviewLink}
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={copyToClipboard} className="flex-1">
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Link
                                        </>
                                    )}
                                </Button>
                                <Button onClick={handleClose} variant="outline">
                                    Done
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
