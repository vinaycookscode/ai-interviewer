import { getVisitorLocationStats, getTotalVisitors } from "@/actions/location";
import { LocationMap } from "@/components/admin/location-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Globe, MapPin, Eye } from "lucide-react";

export default async function LocationsPage() {
    const [locationStats, totals] = await Promise.all([
        getVisitorLocationStats(),
        getTotalVisitors(),
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Visitor Locations</h1>
                <p className="text-muted-foreground mt-2">
                    Geographic distribution of all visitors to your site.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalVisits}</div>
                        <p className="text-xs text-muted-foreground">
                            From all countries
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Countries</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.uniqueCountries}</div>
                        <p className="text-xs text-muted-foreground">
                            Unique countries
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Country</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {locationStats[0]?.country || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {locationStats[0]?.count || 0} visits
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Map Visualization */}
            <LocationMap locationStats={locationStats} />

            {/* Top Countries Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead className="text-right">Visits</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {locationStats.slice(0, 10).map((stat, index) => (
                                <TableRow key={stat.countryCode}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{stat.country}</TableCell>
                                    <TableCell className="font-mono text-xs">{stat.countryCode}</TableCell>
                                    <TableCell className="text-right">{stat.count}</TableCell>
                                    <TableCell className="text-right">
                                        {totals.totalVisits > 0
                                            ? Math.round((stat.count / totals.totalVisits) * 100)
                                            : 0}
                                        %
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
