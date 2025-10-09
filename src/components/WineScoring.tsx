import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Slider,
    Alert
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { apiService } from '../services/api';

interface WineScoringProps {
    eventId: string;
    wineNumber: number;
    playerId: string;
    onScoreSubmitted?: () => void;
}

export default function WineScoring({ eventId, wineNumber, playerId, onScoreSubmitted }: WineScoringProps) {
    const [score, setScore] = useState<number>(3);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentScore, setCurrentScore] = useState<number | null>(null);

    useEffect(() => {
        // Check if player has already submitted a score for this wine
        const checkExistingScore = async () => {
            try {
                const response = await apiService.getWineScores(eventId);
                const wineData = response.averages[wineNumber.toString()];

                if (wineData && wineData.scores) {
                    const playerScore = wineData.scores.find(s => s.player_id === playerId);
                    if (playerScore) {
                        setCurrentScore(playerScore.score);
                        setScore(playerScore.score);
                        setSubmitted(true);
                    }
                }
            } catch (error) {
                // Ignore errors when checking existing scores
            }
        };

        checkExistingScore();
    }, [eventId, wineNumber, playerId]);

    const handleScoreChange = (_event: Event, newValue: number | number[]) => {
        setScore(newValue as number);
    };

    const handleSubmit = async () => {
        if (submitting) return;

        setSubmitting(true);
        setError('');

        try {
            await apiService.submitWineScore(eventId, playerId, wineNumber, score);
            setSubmitted(true);
            setCurrentScore(score);
            onScoreSubmitted?.();
        } catch (error: any) {
            setError(error.message || 'Failed to submit score');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (score: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= score) {
                stars.push(
                    <Star
                        key={i}
                        sx={{
                            color: '#ffd700',
                            fontSize: '2rem',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                        }}
                    />
                );
            } else {
                stars.push(
                    <StarBorder
                        key={i}
                        sx={{
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '2rem'
                        }}
                    />
                );
            }
        }
        return stars;
    };

    return (
        <Paper sx={{
            p: 4,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
        }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                Rate This Wine
            </Typography>

            {submitted && currentScore !== null ? (
                <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Your Score: {currentScore.toFixed(1)}/5
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        {renderStars(currentScore)}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                        Thank you for rating this wine!
                    </Typography>
                </Box>
            ) : (
                <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Current Score: {score.toFixed(1)}/5
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        {renderStars(score)}
                    </Box>

                    <Box sx={{ px: 3, mb: 3 }}>
                        <Slider
                            value={score}
                            onChange={handleScoreChange}
                            min={1}
                            max={5}
                            step={0.1}
                            marks={[
                                { value: 1, label: '1' },
                                { value: 3, label: '3' },
                                { value: 5, label: '5' }
                            ]}
                            valueLabelDisplay="auto"
                            sx={{
                                color: '#ffd700',
                                '& .MuiSlider-thumb': {
                                    backgroundColor: '#ffd700',
                                    border: '2px solid white',
                                    width: 24,
                                    height: 24,
                                },
                                '& .MuiSlider-track': {
                                    backgroundColor: '#ffd700',
                                    border: 'none',
                                },
                                '& .MuiSlider-rail': {
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                },
                                '& .MuiSlider-mark': {
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                },
                                '& .MuiSlider-markLabel': {
                                    color: 'white',
                                    fontSize: '0.875rem',
                                },
                                '& .MuiSlider-valueLabel': {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                },
                            }}
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        variant="contained"
                        sx={{
                            backgroundColor: '#ffd700',
                            color: '#333',
                            fontWeight: 'bold',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            '&:hover': {
                                backgroundColor: '#ffc107',
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                color: 'rgba(255,255,255,0.7)',
                            }
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Score'}
                    </Button>
                </Box>
            )}
        </Paper>
    );
}
