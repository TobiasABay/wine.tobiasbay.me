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

    const WineRatingRow = ({ wine, type }: { wine: any; type: 'high' | 'low' }) => (
        <Box
            sx={{
                p: 1,
                backgroundColor: type === 'high' ? '#e8f5e9' : '#ffebee',
                borderRadius: 1,
                border: `1px solid ${type === 'high' ? '#c8e6c9' : '#ffcdd2'}`
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                        {wine.wine_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        {wine.event_name}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={wine.average_score} precision={0.1} readOnly size="small" sx={{ fontSize: '0.9rem' }} />
                    <Chip
                        label={wine.average_score.toFixed(2)}
                        size="small"
                        sx={{
                            backgroundColor: type === 'high' ? '#4caf50' : '#f44336',
                            color: 'white',
                            fontWeight: 'bold',
                            height: 20,
                            fontSize: '0.7rem'
                        }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        ({wine.total_scores})
                    </Typography>
                    {type === 'high' ?
                        <TrendingUp sx={{ color: '#4caf50', fontSize: 18 }} /> :
                        <TrendingDown sx={{ color: '#f44336', fontSize: 18 }} />
                    }
                </Box>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Highest Rated */}
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, color: '#4caf50', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            🌟 Highest Rated
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {highest.map((wine, index) => (
                                <WineRatingRow key={index} wine={wine} type="high" />
                            ))}
                        </Box>
                    </Box>

                    {/* Lowest Rated */}
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, color: '#f44336', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            📉 Lowest Rated
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {lowest.map((wine, index) => (
                                <WineRatingRow key={index} wine={wine} type="low" />
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

