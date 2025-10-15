import { Paper, Typography, Box, LinearProgress, Chip } from "@mui/material";
import { Psychology, TrendingUp, TrendingDown } from "@mui/icons-material";

interface CategoryAccuracyInsightProps {
    data: Array<{
        category_name: string;
        total_guesses: number;
        correct_guesses: number;
        accuracy: number;
    }>;
    title: string;
    type: 'hardest' | 'easiest' | 'all';
}

export default function CategoryAccuracyInsight({ data, title, type }: CategoryAccuracyInsightProps) {
    let displayData = [...data];

    // Sort and filter based on type
    if (type === 'hardest') {
        displayData = displayData.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
    } else if (type === 'easiest') {
        displayData = displayData.sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);
    } else {
        displayData = displayData.sort((a, b) => b.total_guesses - a.total_guesses);
    }

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 70) return '#4caf50';
        if (accuracy >= 40) return '#ff9800';
        return '#f44336';
    };

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Psychology sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {type === 'hardest' && 'Categories with lowest guess accuracy'}
                {type === 'easiest' && 'Categories with highest guess accuracy'}
                {type === 'all' && 'Total guesses submitted per category'}
            </Typography>

            {displayData.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No data available yet
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {displayData.map((category, index) => (
                        <Box key={index}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {category.category_name}
                                    </Typography>
                                    {type !== 'all' && (
                                        category.accuracy >= 50 ?
                                            <TrendingUp sx={{ color: '#4caf50', fontSize: 18 }} /> :
                                            <TrendingDown sx={{ color: '#f44336', fontSize: 18 }} />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    {type === 'all' && (
                                        <Chip
                                            label={`${category.total_guesses} guesses`}
                                            size="small"
                                            sx={{ fontSize: '0.75rem' }}
                                        />
                                    )}
                                    <Chip
                                        label={`${category.accuracy.toFixed(1)}%`}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${getAccuracyColor(category.accuracy)}20`,
                                            color: getAccuracyColor(category.accuracy),
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                </Box>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={category.accuracy}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: getAccuracyColor(category.accuracy),
                                        borderRadius: 4
                                    }
                                }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                {category.correct_guesses} / {category.total_guesses} correct
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Paper>
    );
}

