import { getSubscriptionStats, getTodaySubscribers, getAllSubscribers, getAdminSubscriptionPlans } from "@/actions/admin-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndianRupee, Users, Crown, TrendingUp, Calendar, Clock } from "lucide-react";
import { SubscribersTable } from "./subscribers-table";
import { PlansManager } from "./plans-manager";

export default async function AdminSubscriptionsPage() {
    const [stats, todaySubscribers, allSubscribersData, plans] = await Promise.all([
        getSubscriptionStats(),
        getTodaySubscribers(),
        getAllSubscribers(1, 50),
        getAdminSubscriptionPlans(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
                <p className="text-muted-foreground mt-2">
                    Monitor revenue, manage subscribers, and configure plans.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{stats.totalRevenue}</div>
                        <p className="text-xs text-muted-foreground">
                            ₹{stats.monthRevenue} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.todayPurchases} new today
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
                        <Crown className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.proSubscribers}</div>
                        <p className="text-xs text-muted-foreground">₹249/month plan</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium Subscribers</CardTitle>
                        <Crown className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.premiumSubscribers}</div>
                        <p className="text-xs text-muted-foreground">₹499/month plan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="today" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="today" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Today's Purchases
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Subscribers
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Manage Plans
                    </TabsTrigger>
                </TabsList>

                {/* Today's Subscribers */}
                <TabsContent value="today" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Today's Purchases
                            </CardTitle>
                            <CardDescription>
                                Users who subscribed or renewed today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {todaySubscribers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No purchases today yet</p>
                                </div>
                            ) : (
                                <SubscribersTable subscribers={todaySubscribers} showDaysRemaining />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* All Subscribers */}
                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                All Subscribers
                            </CardTitle>
                            <CardDescription>
                                Complete list of all subscription purchases
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SubscribersTable
                                subscribers={allSubscribersData.subscribers}
                                showDaysRemaining
                                showStatus
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Manage Plans */}
                <TabsContent value="plans" className="space-y-4">
                    <PlansManager plans={plans} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
