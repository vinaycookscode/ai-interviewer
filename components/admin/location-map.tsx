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

// Mapping from ISO Alpha-2 codes to ISO numeric codes used by world-atlas
const ISO_A2_TO_NUMERIC: Record<string, string> = {
    "AF": "004", "AL": "008", "DZ": "012", "AS": "016", "AD": "020", "AO": "024", "AG": "028", "AR": "032", "AM": "051", "AU": "036",
    "AT": "040", "AZ": "031", "BS": "044", "BH": "048", "BD": "050", "BB": "052", "BY": "112", "BE": "056", "BZ": "084", "BJ": "204",
    "BT": "064", "BO": "068", "BA": "070", "BW": "072", "BR": "076", "BN": "096", "BG": "100", "BF": "854", "BI": "108", "CV": "132",
    "KH": "116", "CM": "120", "CA": "124", "CF": "140", "TD": "148", "CL": "152", "CN": "156", "CO": "170", "KM": "174", "CG": "178",
    "CD": "180", "CR": "188", "CI": "384", "HR": "191", "CU": "192", "CY": "196", "CZ": "203", "DK": "208", "DJ": "262", "DM": "212",
    "DO": "214", "EC": "218", "EG": "818", "SV": "222", "GQ": "226", "ER": "232", "EE": "233", "SZ": "748", "ET": "231", "FJ": "242",
    "FI": "246", "FR": "250", "GA": "266", "GM": "270", "GE": "268", "DE": "276", "GH": "288", "GR": "300", "GD": "308", "GT": "320",
    "GN": "324", "GW": "624", "GY": "328", "HT": "332", "HN": "340", "HU": "348", "IS": "352", "IN": "356", "ID": "360", "IR": "364",
    "IQ": "368", "IE": "372", "IL": "376", "IT": "380", "JM": "388", "JP": "392", "JO": "400", "KZ": "398", "KE": "404", "KI": "296",
    "KP": "408", "KR": "410", "KW": "414", "KG": "417", "LA": "418", "LV": "428", "LB": "422", "LS": "426", "LR": "430", "LY": "434",
    "LI": "438", "LT": "440", "LU": "442", "MG": "450", "MW": "454", "MY": "458", "MV": "462", "ML": "466", "MT": "470", "MH": "584",
    "MR": "478", "MU": "480", "MX": "484", "FM": "583", "MD": "498", "MC": "492", "MN": "496", "ME": "499", "MA": "504", "MZ": "508",
    "MM": "104", "NA": "516", "NR": "520", "NP": "524", "NL": "528", "NZ": "554", "NI": "558", "NE": "562", "NG": "566", "NO": "578",
    "OM": "512", "PK": "586", "PW": "585", "PA": "591", "PG": "598", "PY": "600", "PE": "604", "PH": "608", "PL": "616", "PT": "620",
    "QA": "634", "RO": "642", "RU": "643", "RW": "646", "KN": "659", "LC": "662", "VC": "670", "WS": "882", "SM": "674", "ST": "678",
    "SA": "682", "SN": "686", "RS": "688", "SC": "690", "SL": "694", "SG": "702", "SK": "703", "SI": "705", "SB": "090", "SO": "706",
    "ZA": "710", "SS": "728", "ES": "724", "LK": "144", "SD": "729", "SR": "740", "SE": "752", "CH": "756", "SY": "760", "TW": "158",
    "TJ": "762", "TZ": "834", "TH": "764", "TL": "626", "TG": "768", "TO": "776", "TT": "780", "TN": "788", "TR": "792", "TM": "795",
    "TV": "798", "UG": "800", "UA": "804", "AE": "784", "GB": "826", "US": "840", "UY": "858", "UZ": "860", "VU": "548", "VA": "336",
    "VE": "862", "VN": "704", "YE": "887", "ZM": "894", "ZW": "716", "PS": "275", "XK": "-99", "PAC": "000", // PAC might be Pacific region
};

interface LocationStats {
    countryCode: string;
    country: string;
    count: number;
}

interface LocationMapProps {
    locationStats: LocationStats[];
}

export function LocationMap({ locationStats }: LocationMapProps) {
    // Create a map of numeric codes to counts for quick lookup
    const statsMap = useMemo(() => {
        const map = new Map<string, number>();
        locationStats.forEach((stat) => {
            const code = stat.countryCode.toUpperCase();
            // Add both the original code and the numeric equivalent
            map.set(code, stat.count);
            const numericCode = ISO_A2_TO_NUMERIC[code];
            if (numericCode) {
                map.set(numericCode, stat.count);
            }
        });
        return map;
    }, [locationStats]);

    const maxCount = useMemo(() => {
        return Math.max(...locationStats.map((s) => s.count), 1);
    }, [locationStats]);

    const getCountForGeo = (geo: any): number => {
        // Try multiple properties that might contain the country identifier
        const id = geo.id?.toString();
        const isoA2 = geo.properties?.ISO_A2;
        const isoA3 = geo.properties?.ISO_A3;

        return statsMap.get(id) ||
            statsMap.get(isoA2) ||
            statsMap.get(isoA3) ||
            0;
    };

    const getColor = (count: number) => {
        if (count === 0) return "#374151"; // Dark gray for countries with no users (better for dark mode)

        // Color intensity based on user count (gradient from light purple to dark purple)
        const intensity = Math.min(count / maxCount, 1);
        const hue = 262; // Purple hue
        const saturation = 60 + intensity * 20;
        const lightness = 70 - intensity * 30;

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
                                        const count = getCountForGeo(geo);
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={getColor(count)}
                                                stroke="#1f2937"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: {
                                                        outline: "none",
                                                    },
                                                    hover: {
                                                        fill: count > 0 ? "#8b5cf6" : "#4b5563",
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
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "#374151" }}></div>
                        <span className="text-muted-foreground">No users</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(262, 65%, 65%)" }}></div>
                        <span className="text-muted-foreground">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(262, 80%, 45%)" }}></div>
                        <span className="text-muted-foreground">High</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

