import { Paper, Typography, Box, Rating, Chip } from "@mui/material";
import { Star, TrendingUp, TrendingDown } from "@mui/icons-material";

interface WineRatingsInsightProps {
    data: Array<{
        wine_name: string;
        event_name: string;
        average_score: number;
        total_scores: number;
    }>;
}

export default function WineRatingsInsight({ data }: WineRatingsInsightProps) {
    const sortedByScore = [...data].sort((a, b) => b.average_score - a.average_score);
    const highest = sortedByScore.slice(0, 5);
    const lowest = sortedByScore.slice(-5).reverse();

    const WineRatingRow = ({ wine, index, type }: { wine: any; index: number; type: 'high' | 'low' }) => (
        <Box
            sx={{
                p: 2,
                backgroundColor: type === 'high' ? '#e8f5e9' : '#ffebee',
                borderRadius: 2,
                border: `1px solid ${type === 'high' ? '#c8e6c9' : '#ffcdd2'}`
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {wine.wine_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {wine.event_name}
                    </Typography>
                </Box>
                {type === 'high' ?
                    <TrendingUp sx={{ color: '#4caf50', mr: 1 }} /> :
                    <TrendingDown sx={{ color: '#f44336', mr: 1 }} />
                }
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Rating value={wine.average_score} precision={0.1} readOnly size="small" />
                <Chip
                    label={wine.average_score.toFixed(2)}
                    size="small"
                    sx={{
                        backgroundColor: type === 'high' ? '#4caf50' : '#f44336',
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ({wine.total_scores} ratings)
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Star sx={{ color: '#ffa726' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Wine Ratings
                </Typography>
            </Box>

            {data.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No wine ratings yet
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Highest Rated */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#4caf50' }}>
                            🌟 Highest Rated Wines
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {highest.map((wine, index) => (
                                <WineRatingRow key={index} wine={wine} index={index} type="high" />
                            ))}
                        </Box>
                    </Box>

                    {/* Lowest Rated */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#f44336' }}>
                            📉 Lowest Rated Wines
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {lowest.map((wine, index) => (
                                <WineRatingRow key={index} wine={wine} index={index} type="low" />
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

