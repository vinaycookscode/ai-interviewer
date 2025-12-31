import { getFeatureFlags } from "@/actions/feature-flags";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GlobalFeatureToggle } from "@/components/admin/global-feature-toggle";

interface FeatureFlag {
    key: string;
    enabled: boolean;
    description: string | null;
    category: string;
    updatedAt: Date;
}

export default async function FeatureManagementPage() {
    const flags = await getFeatureFlags();

    // Group by category
    const grouped = flags.reduce((acc: Record<string, FeatureFlag[]>, flag) => {
        const cat = flag.category || 'SYSTEM';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(flag);
        return acc;
    }, {} as Record<string, FeatureFlag[]>);

    const categories = Object.keys(grouped).sort();

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Global Feature Flags</h2>
                    <p className="text-muted-foreground">
                        Manage global availability of application features. Disabling a feature here hides it for ALL users.
                    </p>
                </div>
            </div>

            {categories.map((cat) => (
                <Card key={cat}>
                    <CardHeader>
                        <CardTitle className="capitalize">{cat.toLowerCase()} Features</CardTitle>
                        <CardDescription>
                            Toggle features related to {cat.toLowerCase()} functionality.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Feature</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grouped[cat].map((flag) => (
                                    <TableRow key={flag.key}>
                                        <TableCell className="font-medium">
                                            {flag.key}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {flag.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <GlobalFeatureToggle
                                                featureKey={flag.key}
                                                initialValue={flag.enabled}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

