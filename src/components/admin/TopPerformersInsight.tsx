import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip, Box } from "@mui/material";
import { EmojiEvents } from "@mui/icons-material";

interface TopPerformersInsightProps {
    data: Array<{
        player_name: string;
        event_name: string;
        total_points: number;
        accuracy: number;
    }>;
}

export default function TopPerformersInsight({ data }: TopPerformersInsightProps) {
    const top10 = data.slice(0, 10);

    const getMedalColor = (index: number) => {
        if (index === 0) return '#ffd700'; // Gold
        if (index === 1) return '#c0c0c0'; // Silver
        if (index === 2) return '#cd7f32'; // Bronze
        return 'transparent';
    };

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEvents sx={{ color: '#ffd700' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Top Performers
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Players with the highest scores across all events
            </Typography>

            {top10.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No data available yet
                </Typography>
            ) : (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Event</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Points</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Accuracy</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {top10.map((player, index) => (
                            <TableRow key={index} sx={{ backgroundColor: index < 3 ? `${getMedalColor(index)}15` : 'inherit' }}>
                                <TableCell>
                                    <Box
                                        sx={{
                                            backgroundColor: getMedalColor(index) || '#e0e0e0',
                                            color: index < 3 ? 'white' : 'text.primary',
                                            borderRadius: '50%',
                                            width: 32,
                                            height: 32,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        #{index + 1}
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                                    {player.player_name}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {player.event_name}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Chip
                                        label={player.total_points}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Chip
                                        label={`${player.accuracy}%`}
                                        size="small"
                                        sx={{
                                            backgroundColor: player.accuracy >= 70 ? '#e8f5e9' : player.accuracy >= 40 ? '#fff3cd' : '#f8d7da',
                                            color: player.accuracy >= 70 ? '#2e7d32' : player.accuracy >= 40 ? '#f57c00' : '#c62828',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
}

