import { auth, currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserButton } from "@clerk/nextjs";

export default async function SettingsPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return <div>Unauthorized</div>;
    }

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
                                Email
                            </label>
                            <p className="text-lg">
                                {user.emailAddresses[0]?.emailAddress}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Name
                            </label>
                            <p className="text-lg">
                                {user.firstName} {user.lastName}
                            </p>
                        </div>
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                                Manage your account settings
                            </p>
                            <UserButton afterSignOutUrl="/sign-in" />
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
