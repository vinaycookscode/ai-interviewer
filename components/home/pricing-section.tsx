"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, DollarSign } from "lucide-react";
import { encryptData } from "@/lib/encryption";
import { useEffect } from "react";

export function HomePricingSection() {
    const [isYearly, setIsYearly] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getSelectionUrl = (plan: string) => {
        if (!isMounted) return `/auth/register?plan=${plan}&period=${isYearly ? "YEARLY" : "MONTHLY"}`;
        const encrypted = encryptData({ plan, period: isYearly ? "YEARLY" : "MONTHLY" });
        return `/auth/register?s=${encrypted}`;
    };

    return (
        <section id="pricing" className="pb-24 pt-8 relative">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <DollarSign className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-400">Simple Pricing</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                            Choose Your Plan
                        </span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Start free and upgrade when you need more power
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
                        <Switch
                            checked={isYearly}
                            onCheckedChange={setIsYearly}
                            className="data-[state=checked]:bg-purple-600"
                        />
                        <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                            Yearly
                            <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                Save 17%+
                            </Badge>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Free Plan */}
                    <Card className="relative border-2 border-border/50 hover:border-border transition-all duration-300">
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Free</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">₹0</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Get started with basics</p>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>2 Mock Interviews/month</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>1 Resume Analysis</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>5 AI Questions</span>
                                </li>
                            </ul>
                            <Link href={getSelectionUrl("FREE")} className="block">
                                <Button variant="outline" className="w-full py-6">
                                    Start Free
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Pro Plan - Popular */}
                    <Card className="relative border-2 border-blue-500/50 bg-gradient-to-b from-blue-500/5 to-transparent shadow-xl shadow-blue-500/10 scale-105">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span className="px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-full">
                                Most Popular
                            </span>
                        </div>
                        <CardContent className="pt-10 pb-8 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-blue-400">Pro</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">₹{isYearly ? "2,490" : "249"}</span>
                                    <span className="text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                                </div>
                                {isYearly && <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Save ₹498/year</p>}
                                <p className="text-sm text-muted-foreground">For serious job seekers</p>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                                    <span>15 Mock Interviews/month</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                                    <span>10 Resume Analysis</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                                    <span>50 AI Questions</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                                    <span>All Premium Features</span>
                                </li>
                            </ul>
                            <Link href={getSelectionUrl("PRO")} className="block">
                                <Button className="w-full py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                                    Get Pro
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Premium Plan */}
                    <Card className="relative border-2 border-purple-500/50 bg-gradient-to-b from-purple-500/5 to-transparent">
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-purple-400">Premium</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">₹{isYearly ? "4,990" : "499"}</span>
                                    <span className="text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                                </div>
                                {isYearly && <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Save ₹998/year</p>}
                                <p className="text-sm text-muted-foreground">Unlimited everything</p>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                                    <span>Unlimited Mock Interviews</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                                    <span>Unlimited Resume Analysis</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                                    <span>Unlimited AI Questions</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                                    <span>Priority Support</span>
                                </li>
                            </ul>
                            <Link href={getSelectionUrl("PREMIUM")} className="block">
                                <Button className="w-full py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25">
                                    Get Premium
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
