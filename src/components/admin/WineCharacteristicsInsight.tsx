import { Paper, Typography, Box, Chip } from "@mui/material";
import { Public, Spa, WineBar } from "@mui/icons-material";

interface WineCharacteristicsInsightProps {
    grapeVarieties: Array<{ name: string; count: number }>;
    countries: Array<{ name: string; count: number }>;
    wineTypes: Array<{ type: string; count: number }>;
}

export default function WineCharacteristicsInsight({ grapeVarieties, countries, wineTypes }: WineCharacteristicsInsightProps) {
    const top5Grapes = grapeVarieties.slice(0, 5);
    const top5Countries = countries.slice(0, 5);

    const DataList = ({ items, icon, title, color }: { items: any[]; icon: React.ReactNode; title: string; color: string }) => (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {icon}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color }}>
                    {title}
                </Typography>
            </Box>
            {items.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No data yet
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {items.map((item, index) => (
                        <Chip
                            key={index}
                            label={`${item.name || item.type} (${item.count})`}
                            size="small"
                            sx={{
                                backgroundColor: `${color}15`,
                                border: `1px solid ${color}40`,
                                fontWeight: index === 0 ? 'bold' : 'normal'
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WineBar sx={{ color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Wine Characteristics
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Most common wine properties submitted by players
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <DataList
                    items={top5Grapes}
                    icon={<Spa sx={{ color: '#8e24aa', fontSize: 20 }} />}
                    title="Top Grape Varieties"
                    color="#8e24aa"
                />

                <DataList
                    items={top5Countries}
                    icon={<Public sx={{ color: '#1976d2', fontSize: 20 }} />}
                    title="Top Countries/Regions"
                    color="#1976d2"
                />

                <DataList
                    items={wineTypes}
                    icon={<WineBar sx={{ color: '#d32f2f', fontSize: 20 }} />}
                    title="Wine Types"
                    color="#d32f2f"
                />
            </Box>
        </Paper>
    );
}

