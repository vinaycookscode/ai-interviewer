"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crown, Edit, Users, Infinity, Save, Loader2 } from "lucide-react";
import { updateSubscriptionPlan } from "@/actions/admin-subscription";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Plan {
    id: string;
    name: string;
    tier: string;
    monthlyPrice: number;
    yearlyPrice: number;
    monthlyPriceDisplay: number;
    yearlyPriceDisplay: number;
    mockInterviewLimit: number;
    resumeAnalysisLimit: number;
    questionGenerationLimit: number;
    coverLetterLimit: number;
    resumeRewriteLimit: number;
    aiEvaluationEnabled: boolean;
    prioritySupport: boolean;
    activeSubscribers: number;
}

interface PlansManagerProps {
    plans: Plan[];
}

function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
    const tierColors: Record<string, string> = {
        FREE: "from-gray-500/10 to-slate-500/10 border-gray-500/20",
        PRO: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
        PREMIUM: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
    };

    const formatLimit = (limit: number) => {
        if (limit === -1) return <Infinity className="h-4 w-4 text-green-500" />;
        if (limit === 0) return <span className="text-red-500">Disabled</span>;
        return limit;
    };

    return (
        <Card className={`bg-gradient-to-br ${tierColors[plan.tier] || tierColors.FREE}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Crown className={`h-5 w-5 ${plan.tier === "PREMIUM" ? "text-purple-500" : plan.tier === "PRO" ? "text-blue-500" : "text-gray-500"}`} />
                        <CardTitle>{plan.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {plan.activeSubscribers}
                    </Badge>
                </div>
                <CardDescription>
                    ₹{plan.monthlyPriceDisplay}/month • ₹{plan.yearlyPriceDisplay}/year
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Mock Interviews</span>
                        <span className="font-medium">{formatLimit(plan.mockInterviewLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Resume Analysis</span>
                        <span className="font-medium">{formatLimit(plan.resumeAnalysisLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Questions</span>
                        <span className="font-medium">{formatLimit(plan.questionGenerationLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Cover Letters</span>
                        <span className="font-medium">{formatLimit(plan.coverLetterLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Resume Rewrites</span>
                        <span className="font-medium">{formatLimit(plan.resumeRewriteLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Evaluation</span>
                        <span className="font-medium">{plan.aiEvaluationEnabled ? "✓" : "✗"}</span>
                    </div>
                </div>

                <Button onClick={onEdit} variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Plan
                </Button>
            </CardContent>
        </Card>
    );
}

function EditPlanDialog({ plan, open, onOpenChange }: { plan: Plan; open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: plan.name,
        monthlyPrice: plan.monthlyPrice / 100, // Convert from paise to rupees
        yearlyPrice: plan.yearlyPrice / 100,
        mockInterviewLimit: plan.mockInterviewLimit,
        resumeAnalysisLimit: plan.resumeAnalysisLimit,
        questionGenerationLimit: plan.questionGenerationLimit,
        coverLetterLimit: plan.coverLetterLimit,
        resumeRewriteLimit: plan.resumeRewriteLimit,
        aiEvaluationEnabled: plan.aiEvaluationEnabled,
        prioritySupport: plan.prioritySupport,
    });

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await updateSubscriptionPlan(plan.id, {
                name: formData.name,
                monthlyPrice: Math.round(formData.monthlyPrice * 100), // Convert to paise
                yearlyPrice: Math.round(formData.yearlyPrice * 100),
                mockInterviewLimit: formData.mockInterviewLimit,
                resumeAnalysisLimit: formData.resumeAnalysisLimit,
                questionGenerationLimit: formData.questionGenerationLimit,
                coverLetterLimit: formData.coverLetterLimit,
                resumeRewriteLimit: formData.resumeRewriteLimit,
                aiEvaluationEnabled: formData.aiEvaluationEnabled,
                prioritySupport: formData.prioritySupport,
            });

            if (result.success) {
                toast.success("Plan updated successfully!");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update plan");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit {plan.name} Plan</DialogTitle>
                    <DialogDescription>
                        Changes will be reflected immediately on the pricing page.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monthly Price (₹)</Label>
                            <Input
                                type="number"
                                value={formData.monthlyPrice}
                                onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Yearly Price (₹)</Label>
                            <Input
                                type="number"
                                value={formData.yearlyPrice}
                                onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3">Usage Limits (-1 = Unlimited, 0 = Disabled)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs">Mock Interviews</Label>
                                <Input
                                    type="number"
                                    value={formData.mockInterviewLimit}
                                    onChange={(e) => setFormData({ ...formData, mockInterviewLimit: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Resume Analysis</Label>
                                <Input
                                    type="number"
                                    value={formData.resumeAnalysisLimit}
                                    onChange={(e) => setFormData({ ...formData, resumeAnalysisLimit: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">AI Questions</Label>
                                <Input
                                    type="number"
                                    value={formData.questionGenerationLimit}
                                    onChange={(e) => setFormData({ ...formData, questionGenerationLimit: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Cover Letters</Label>
                                <Input
                                    type="number"
                                    value={formData.coverLetterLimit}
                                    onChange={(e) => setFormData({ ...formData, coverLetterLimit: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Resume Rewrites</Label>
                                <Input
                                    type="number"
                                    value={formData.resumeRewriteLimit}
                                    onChange={(e) => setFormData({ ...formData, resumeRewriteLimit: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>AI Evaluation Enabled</Label>
                            <Switch
                                checked={formData.aiEvaluationEnabled}
                                onCheckedChange={(checked) => setFormData({ ...formData, aiEvaluationEnabled: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Priority Support</Label>
                            <Switch
                                checked={formData.prioritySupport}
                                onCheckedChange={(checked) => setFormData({ ...formData, prioritySupport: checked })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function PlansManager({ plans }: PlansManagerProps) {
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Subscription Plans
                    </CardTitle>
                    <CardDescription>
                        Edit plan pricing and limits. Changes apply immediately to new subscriptions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onEdit={() => setEditingPlan(plan)}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {editingPlan && (
                <EditPlanDialog
                    plan={editingPlan}
                    open={!!editingPlan}
                    onOpenChange={(open) => !open && setEditingPlan(null)}
                />
            )}
        </>
    );
}
