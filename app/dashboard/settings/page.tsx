import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserButton } from "@/components/auth/user-button";

import { db } from "@/lib/db";

export default async function SettingsPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return <div>Unauthorized</div>;
    }

    const dbUser = await db.user.findUnique({
        where: { id: userId },
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account and preferences
                    </p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Role
                            </label>
                            <p className="text-lg font-semibold capitalize">
                                {dbUser?.role?.toLowerCase() || "Unknown"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Email
                            </label>
                            <p className="text-lg">
                                {dbUser?.email}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Name
                            </label>
                            <p className="text-lg">
                                {dbUser?.name}
                            </p>
                        </div>
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                                Manage your account settings
                            </p>
                            <UserButton />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Environment Variables</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Gemini API Key
                            </label>
                            <p className="text-sm text-muted-foreground">
                                {process.env.GEMINI_API_KEY ? "✓ Configured" : "✗ Not configured"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Resend API Key
                            </label>
                            <p className="text-sm text-muted-foreground">
                                {process.env.RESEND_API_KEY ? "✓ Configured" : "✗ Not configured"}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            API keys are configured in your .env file
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Account deletion and other destructive actions will be available in a future update.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
