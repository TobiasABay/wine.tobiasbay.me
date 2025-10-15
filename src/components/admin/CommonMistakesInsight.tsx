import { Paper, Typography, Box, Chip, Alert } from "@mui/material";
import { ErrorOutline, ArrowForward } from "@mui/icons-material";

interface CommonMistakesInsightProps {
    data: Array<{
        category_name: string;
        correct_answer: string;
        wrong_guess: string;
        count: number;
    }>;
}

export default function CommonMistakesInsight({ data }: CommonMistakesInsightProps) {
    const top10Mistakes = data.slice(0, 10);

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ErrorOutline sx={{ color: '#f57c00' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Common Mistakes
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Most frequent wrong guesses
            </Typography>

            {top10Mistakes.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No wrong guesses yet (or everyone is perfect! 🎉)
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {top10Mistakes.map((mistake, index) => (
                        <Alert
                            key={index}
                            severity="warning"
                            icon={false}
                            sx={{
                                backgroundColor: '#fff3e0',
                                border: '1px solid #ffe0b2',
                                '& .MuiAlert-message': { width: '100%' }
                            }}
                        >
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {mistake.category_name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={mistake.wrong_guess}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#ffcdd2',
                                            color: '#c62828',
                                            fontWeight: 'bold',
                                            textDecoration: 'line-through'
                                        }}
                                    />
                                    <ArrowForward sx={{ color: '#757575', fontSize: 16 }} />
                                    <Chip
                                        label={mistake.correct_answer}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#c8e6c9',
                                            color: '#2e7d32',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Chip
                                        label={`${mistake.count}x`}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#e0e0e0',
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Alert>
                    ))}
                </Box>
            )}
        </Paper>
    );
}

