"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Sparkles
} from "lucide-react";
import { updateProfile, updateCandidateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ROLES = [
    { id: "sde", name: "Software Development Engineer", icon: Code, desc: "Build applications and scalable systems" },
    { id: "qa", name: "Automation Tester / QA", icon: ShieldCheck, desc: "Ensure quality through code and automation" },
    { id: "data", name: "Data Engineer / Scientist", icon: Target, desc: "Analyze data and build ML models" },
    { id: "devops", name: "DevOps Engineer", icon: Briefcase, desc: "Manage cloud infrastructure and pipelines" },
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

            toast.success(`${type.toUpperCase()} uploaded successfully`);
        } catch (error) {
            toast.error(`Failed to upload ${type}`);
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
                toast.success("Career profile initialized!");
                router.push("/candidate/dashboard");
            } else {
                toast.error(result.error || "Failed to save profile");
            }
        });
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="relative w-full max-w-5xl mx-auto py-8 px-6 bg-background/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden no-scrollbar">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Progress Header */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                        <div>
                            <p className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-1">Career Initialization</p>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Level Up Your Journey</h2>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                            <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Stage {step}</span>
                            <span className="text-xs text-muted-foreground font-medium">of 4</span>
                        </div>
                    </div>
                    <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                            initial={{ width: "25%" }}
                            animate={{ width: `${(step / 4) * 100}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        />
                        <div className="absolute top-0 left-0 h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_2s_infinite] pointer-events-none" />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-12 w-full"
                        >
                            <div className="text-center mb-8">
                                <h3 className="text-3xl md:text-4xl font-black mb-2 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic">Choose Your Path</h3>
                                <p className="text-muted-foreground text-base max-w-xl mx-auto">Select a specialized track to calibrate your high-performance preparation journey.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {ROLES.map((r) => (
                                    <Card
                                        key={r.id}
                                        className={`group cursor-pointer overflow-hidden transition-all duration-500 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] ${role === r.name ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)]' : 'hover:border-white/10'}`}
                                        onClick={() => setRole(r.name)}
                                    >
                                        <CardContent className="p-6 md:p-8 flex items-start gap-6">
                                            <div className={`p-4 rounded-[1.2rem] shrink-0 transition-all duration-500 group-hover:scale-110 ${role === r.name ? 'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-muted-foreground'}`}>
                                                <r.icon className="w-8 h-8" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`font-black text-xl mb-1 tracking-tight ${role === r.name ? 'text-white' : 'text-foreground'}`}>{r.name}</h4>
                                                <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium line-clamp-2">{r.desc}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="flex justify-center pt-12">
                                <Button
                                    onClick={nextStep}
                                    disabled={!role}
                                    size="lg"
                                    className="h-16 px-12 rounded-2xl bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-all shadow-2xl group"
                                >
                                    <span className="mr-2">Continue Path</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-12"
                        >
                            <div className="text-center mb-8">
                                <h3 className="text-3xl md:text-4xl font-black mb-2 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic">Skills Matrix</h3>
                                <p className="text-muted-foreground text-base max-w-xl mx-auto">Define your arsenal. What technologies do you wield with mastery?</p>
                            </div>

                            <div className="grid gap-8">
                                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-inner">
                                    <Label className="block text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Add Mastery</Label>
                                    <div className="flex gap-4">
                                        <Input
                                            placeholder="Add a custom skill (e.g. Kubernetes, Rust)"
                                            className="h-14 bg-black/40 border-white/5 text-lg rounded-2xl focus:ring-blue-500/30 px-6"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    const val = e.currentTarget.value.trim();
                                                    if (val) {
                                                        toggleSkill(val);
                                                        e.currentTarget.value = "";
                                                    }
                                                }
                                            }}
                                        />
                                        <Button className="h-14 px-8 rounded-2xl bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-all shadow-xl">
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {skills.length > 0 && (
                                        <div className="space-y-4 p-8 bg-blue-500/10 rounded-[2.5rem] border border-blue-500/20 shadow-[0_32px_64px_-16px_rgba(59,130,246,0.3)]">
                                            <Label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Active Arsenal</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.map(s => (
                                                    <Badge
                                                        key={s}
                                                        variant="secondary"
                                                        className="py-2 px-4 text-xs bg-blue-500 text-white border-none font-black shadow-lg animate-in fade-in zoom-in duration-300 rounded-xl"
                                                    >
                                                        {s} <X className="ml-2 w-3 h-3 cursor-pointer hover:rotate-90 transition-transform" onClick={() => toggleSkill(s)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/10">
                                        <Label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6">Suggested for {role}</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).map(s => (
                                                <Badge
                                                    key={s}
                                                    variant="outline"
                                                    className="cursor-pointer py-3 px-6 text-sm font-black border-white/10 bg-white/5 transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white rounded-xl"
                                                    onClick={() => toggleSkill(s)}
                                                >
                                                    + {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-12">
                                <Button variant="ghost" onClick={prevStep} size="lg" className="h-16 px-8 rounded-2xl text-muted-foreground hover:text-white font-black">
                                    <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                </Button>
                                <Button onClick={nextStep} disabled={skills.length === 0} size="lg" className="h-16 px-12 rounded-2xl bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-all shadow-2xl group">
                                    <span className="mr-2">Define Arsenal</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-12"
                        >
                            <div className="text-center mb-8">
                                <h3 className="text-3xl md:text-4xl font-black mb-2 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic">Career Blueprint</h3>
                                <p className="text-muted-foreground text-base max-w-xl mx-auto">Upload your professional resume. This will be the foundation for your AI-powered preparation.</p>
                            </div>

                            <div className="max-w-2xl mx-auto">
                                <Card className="group relative overflow-hidden bg-white/[0.02] border-white/5 hover:border-blue-500/30 transition-all duration-500 rounded-[2.5rem]">
                                    <div className="p-10 flex flex-col items-center text-center gap-8">
                                        <div className="p-6 bg-blue-500/10 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                                            <FileText className="w-12 h-12 text-blue-400" />
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-black text-3xl tracking-tight">Professional Resume</h4>
                                            <p className="text-muted-foreground font-medium max-w-sm">
                                                {docs.resume.name ? (
                                                    <span className="text-blue-400">Current: {docs.resume.name}</span>
                                                ) : (
                                                    "PDF format highly recommended for best AI analysis"
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-4 w-full max-w-xs">
                                            <Input
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                id="file-resume"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(e, 'resume');
                                                }}
                                            />
                                            <Button
                                                variant={docs.resume.url ? "secondary" : "default"}
                                                onClick={() => document.getElementById('file-resume')?.click()}
                                                disabled={uploading === 'resume'}
                                                className={`h-16 px-10 rounded-2xl font-black text-lg transition-all ${docs.resume.url ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white text-black hover:bg-blue-500 hover:text-white shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]'}`}
                                            >
                                                {uploading === 'resume' ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : docs.resume.url ? (
                                                    "Replace Resume"
                                                ) : (
                                                    "Upload Resume"
                                                )}
                                            </Button>

                                            {docs.resume.url && (
                                                <Button variant="ghost" asChild className="h-12 rounded-xl text-muted-foreground hover:text-white font-bold tracking-tight">
                                                    <a href={docs.resume.url} target="_blank" rel="noopener noreferrer">View Current Blueprint</a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ambient glow effect */}
                                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-colors" />
                                </Card>
                            </div>

                            <div className="flex justify-between pt-12">
                                <Button variant="ghost" onClick={prevStep} size="lg" className="h-16 px-8 rounded-2xl text-muted-foreground hover:text-white font-black">
                                    <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                </Button>
                                <Button onClick={nextStep} size="lg" className="h-16 px-12 rounded-2xl bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-all shadow-2xl group">
                                    <span className="mr-2">Continue Setup</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-12"
                        >
                            <div className="text-center mb-10">
                                <h3 className="text-3xl md:text-4xl font-black mb-2 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic">Vision Board</h3>
                                <p className="text-muted-foreground text-base max-w-xl mx-auto">Define the destination. Where do you see yourself in the next phase of your career?</p>
                            </div>

                            <div className="space-y-6 p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 shadow-inner">
                                <Label htmlFor="goals" className="block text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Career Objectives</Label>
                                <Textarea
                                    id="goals"
                                    placeholder="I want to join a top product company like Google/Amazon and solve complex engineering problems..."
                                    className="min-h-[220px] text-lg p-6 bg-black/40 border-white/5 rounded-2xl focus:ring-blue-500/30 leading-relaxed font-medium"
                                    value={goals}
                                    onChange={(e) => setGoals(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-between pt-12">
                                <Button variant="ghost" onClick={prevStep} size="lg" className="h-16 px-8 rounded-2xl text-muted-foreground hover:text-white font-black">
                                    <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                </Button>
                                <Button
                                    onClick={handleComplete}
                                    disabled={isPending}
                                    size="lg"
                                    className="h-16 px-12 rounded-2xl bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-all shadow-2xl group"
                                >
                                    {isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
                                    <span className="mr-2">Initiate Journey</span>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
