"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    Code,
    FileText,
    Target,
    ChevronRight,
    ChevronLeft,
    Check,
    Upload,
    Loader2,
    X,
    ShieldCheck,
} from "lucide-react";
import { updateProfile, updateCandidateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { documentHref } from "@/lib/document-url";
import { cn } from "@/lib/utils";

const ROLES = [
    { id: "sde", name: "Software Development Engineer", icon: Code, desc: "Build applications and scalable systems" },
    { id: "qa", name: "Automation Tester / QA", icon: ShieldCheck, desc: "Ensure quality through code and automation" },
    { id: "data", name: "Data Engineer / Scientist", icon: Target, desc: "Analyze data and build ML models" },
    { id: "devops", name: "DevOps Engineer", icon: Briefcase, desc: "Manage cloud infrastructure and pipelines" },
];

const STEPS = [
    { title: "Choose your role", description: "Pick the track you're preparing for." },
    { title: "Your skills", description: "Add the technologies you're comfortable with." },
    { title: "Resume", description: "Upload your resume. We use it to tailor your preparation." },
    { title: "Career goals", description: "Where do you want to be next? A sentence or two is enough." },
];

const SUGGESTED_SKILLS = ["React", "Node.js", "Python", "Java", "AWS", "Docker", "SQL", "Selenium", "Jest", "Go", "TypeScript"];

interface CareerWizardProps {
    initialData: any;
}

export function CareerWizard({ initialData }: CareerWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [role, setRole] = useState(initialData?.candidateProfile?.primaryRole || "");
    const [skills, setSkills] = useState<string[]>(initialData?.candidateProfile?.skills || []);
    const [goals, setGoals] = useState(initialData?.candidateProfile?.careerGoals || "");
    const [docs, setDocs] = useState({
        resume: { url: initialData?.resumeUrl, name: initialData?.resumeName },
    });

    const [customSkill, setCustomSkill] = useState("");
    const [uploading, setUploading] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'resume') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(type);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        try {
            const response = await fetch("/api/upload/profile", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const result = await response.json();
            setDocs(prev => ({
                ...prev,
                [type]: { url: result.url, name: result.name }
            }));

            // Auto-update profile for the doc
            await updateProfile({
                [`${type}Url`]: result.url,
                [`${type}Name`]: result.name,
            });

            toast.success("Resume uploaded");
        } catch (error) {
            toast.error("Resume upload failed. Please try again.");
        } finally {
            setUploading(null);
        }
    };

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const handleComplete = () => {
        startTransition(async () => {
            const result = await updateCandidateProfile({
                primaryRole: role,
                skills,
                careerGoals: goals,
                onboardingComplete: true,
            });

            if (result.success) {
                toast.success("Profile saved");
                router.push("/candidate/dashboard");
            } else {
                toast.error(result.error || "Failed to save profile");
            }
        });
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const addCustomSkill = () => {
        const value = customSkill.trim();
        if (value && !skills.includes(value)) toggleSkill(value);
        setCustomSkill("");
    };

    const current = STEPS[step - 1];
    const canContinue = step === 1 ? Boolean(role) : step === 2 ? skills.length > 0 : true;

    return (
        <div className="space-y-section p-card">
            {/* Progress */}
            <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-section-title">{current.title}</h2>
                    <span className="shrink-0 text-caption text-muted-foreground">
                        Step {step} of {STEPS.length}
                    </span>
                </div>
                <p className="text-body text-muted-foreground">{current.description}</p>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                        className="h-full rounded-full bg-brand"
                        initial={false}
                        animate={{ width: `${(step / STEPS.length) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {step === 1 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {ROLES.map((r) => {
                                const selected = role === r.name;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => setRole(r.name)}
                                        className={cn(
                                            "flex items-start gap-3 rounded-card border p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                                            selected && "border-brand bg-brand-subtle hover:bg-brand-subtle"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex size-9 shrink-0 items-center justify-center rounded-control",
                                                selected ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            <r.icon className="size-4" />
                                        </span>
                                        <span className="min-w-0 space-y-0.5">
                                            <span className="block text-card-title">{r.name}</span>
                                            <span className="block text-body text-muted-foreground">{r.desc}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-stack">
                            <div className="space-y-2">
                                <Label htmlFor="custom-skill">Add a skill</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="custom-skill"
                                        placeholder="e.g. Kubernetes, Rust"
                                        value={customSkill}
                                        onChange={(e) => setCustomSkill(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addCustomSkill();
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="secondary" onClick={addCustomSkill} disabled={!customSkill.trim()}>
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {skills.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-caption font-medium text-muted-foreground">Selected</p>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((s) => (
                                            <Badge key={s} className="gap-1 bg-brand text-brand-foreground hover:bg-brand">
                                                {s}
                                                <button
                                                    type="button"
                                                    aria-label={`Remove ${s}`}
                                                    onClick={() => toggleSkill(s)}
                                                    className="rounded-full opacity-80 hover:opacity-100"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-caption font-medium text-muted-foreground">
                                    Suggested{role ? ` for ${role}` : ""}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleSkill(s)}
                                            className="rounded-full border px-3 py-1 text-caption font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center gap-stack rounded-card border border-dashed p-card text-center">
                            <span className="flex size-10 items-center justify-center rounded-control bg-brand-subtle text-brand">
                                <FileText className="size-5" />
                            </span>
                            <div className="space-y-1">
                                <p className="text-card-title">{docs.resume.name || "Upload your resume"}</p>
                                <p className="text-body text-muted-foreground">
                                    {docs.resume.name ? "Uploaded. You can replace it any time." : "PDF, up to 5 MB."}
                                </p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                id="file-resume"
                                onChange={(e) => handleFileUpload(e, "resume")}
                            />
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button
                                    type="button"
                                    variant={docs.resume.url ? "outline" : "default"}
                                    onClick={() => document.getElementById("file-resume")?.click()}
                                    disabled={uploading === "resume"}
                                >
                                    {uploading === "resume" ? <Loader2 className="animate-spin" /> : <Upload />}
                                    {docs.resume.url ? "Replace resume" : "Upload resume"}
                                </Button>
                                {docs.resume.url && (
                                    <Button variant="ghost" asChild>
                                        <a href={documentHref(docs.resume.url)} target="_blank" rel="noopener noreferrer">
                                            View current
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-2">
                            <Label htmlFor="goals">Your goals</Label>
                            <Textarea
                                id="goals"
                                placeholder="I want to join a product company and work on complex engineering problems…"
                                className="min-h-32"
                                value={goals}
                                onChange={(e) => setGoals(e.target.value)}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between border-t pt-stack">
                {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={prevStep}>
                        <ChevronLeft /> Back
                    </Button>
                ) : (
                    <span />
                )}
                {step < STEPS.length ? (
                    <Button type="button" onClick={nextStep} disabled={!canContinue}>
                        Continue <ChevronRight />
                    </Button>
                ) : (
                    <Button type="button" onClick={handleComplete} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
                        Finish setup
                    </Button>
                )}
            </div>
        </div>
    );
}
