"use client";

import { useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LocationStats {
    countryCode: string;
    country: string;
    count: number;
}

interface LocationMapProps {
    locationStats: LocationStats[];
}

export function LocationMap({ locationStats }: LocationMapProps) {
    // Create a map of country codes to counts for quick lookup
    const statsMap = useMemo(() => {
        const map = new Map<string, number>();
        locationStats.forEach((stat) => {
            map.set(stat.countryCode, stat.count);
        });
        return map;
    }, [locationStats]);

    const maxCount = useMemo(() => {
        return Math.max(...locationStats.map((s) => s.count), 1);
    }, [locationStats]);

    const getColor = (geo: any) => {
        // Try to match against ID or ISO_A2 property (case insensitive)
        const count = statsMap.get(geo.id) ||
            statsMap.get(geo.properties.ISO_A2) ||
            statsMap.get(geo.properties.iso_a2) ||
            0;

        if (count === 0) return "#D6D6DA"; // Light gray for countries with no users

        // Color intensity based on user count (gradient from light to dark primary)
        const intensity = count / maxCount;
        const hue = 262; // Primary color hue
        const saturation = 50 + intensity * 20;
        const lightness = 80 - intensity * 40;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Distribution Map</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-[500px] bg-muted/20 rounded-lg overflow-hidden">
                    <ComposableMap
                        projectionConfig={{
                            scale: 147,
                        }}
                    >
                        <ZoomableGroup>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const count = statsMap.get(geo.id) ||
                                            statsMap.get(geo.properties.ISO_A2) ||
                                            statsMap.get(geo.properties.iso_a2) ||
                                            0;
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={getColor(geo)}
                                                stroke="#FFFFFF"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: {
                                                        outline: "none",
                                                    },
                                                    hover: {
                                                        fill: "#6366f1",
                                                        outline: "none",
                                                        cursor: count > 0 ? "pointer" : "default",
                                                    },
                                                    pressed: {
                                                        outline: "none",
                                                    },
                                                }}
                                            >
                                                <title>
                                                    {geo.properties.name}: {count} user{count !== 1 ? "s" : ""}
                                                </title>
                                            </Geography>
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "#D6D6DA" }}></div>
                        <span className="text-muted-foreground">No users</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(262, 60%, 70%)" }}></div>
                        <span className="text-muted-foreground">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(262, 70%, 50%)" }}></div>
                        <span className="text-muted-foreground">High</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
