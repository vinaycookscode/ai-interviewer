import { getAllUsersWithFeatures, toggleUserFeature } from "@/actions/features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FEATURES } from "@/lib/features";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function FeatureManagementPage() {
    const users = await getAllUsersWithFeatures();

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Feature Management</h2>
                    <p className="text-muted-foreground">
                        Enable or disable advanced features for specific users/clients.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users & Features</CardTitle>
                    <CardDescription>
                        Toggle switches to enable features. Changes save immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-center">Multilingual Support</TableHead>
                                <TableHead className="text-center">Mobile Access</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const features = user.features as any || {};

                                // Feature Toggles Component
                                const FeatureToggle = ({ featureKey, label }: { featureKey: string, label: string }) => {
                                    // We need a client component for interactivity or a server action form wrapper.
                                    // For simplicity in this server component, we'll use a form with auto-submit logic or use a client component wrapper.
                                    // Actually, standard forms are clunky for toggles. Let's make a small client component for the row.
                                    return (
                                        <FeatureToggleSwitch
                                            userId={user.id}
                                            featureKey={featureKey}
                                            initialValue={!!features[featureKey]}
                                        />
                                    );
                                };

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px]">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <FeatureToggleSwitch
                                                    userId={user.id}
                                                    featureKey={FEATURES.MULTILINGUAL_SUPPORT}
                                                    initialValue={!!features[FEATURES.MULTILINGUAL_SUPPORT]}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <FeatureToggleSwitch
                                                    userId={user.id}
                                                    featureKey={FEATURES.MOBILE_ACCESS}
                                                    initialValue={!!features[FEATURES.MOBILE_ACCESS]}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// Inline Client Component for the Switch
import { FeatureToggleSwitch } from "./feature-toggle-switch";
