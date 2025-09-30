import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Chip
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { apiService } from '../services/api';

interface AverageScoreProps {
    eventId: string;
    wineNumber: number;
}

interface WineScoreData {
    average: number;
    totalScores: number;
    scores: Array<{
        id: string;
        player_id: string;
        player_name: string;
        score: number;
        created_at: string;
    }>;
}

export default function AverageScore({ eventId, wineNumber }: AverageScoreProps) {
    const [scoreData, setScoreData] = useState<WineScoreData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await apiService.getWineScores(eventId);

                // Check if response and averages exist
                if (response && response.averages) {
                    const wineData = response.averages[wineNumber.toString()];

                    if (wineData) {
                        setScoreData(wineData);
                    } else {
                        setScoreData({
                            average: 0,
                            totalScores: 0,
                            scores: []
                        });
                    }
                } else {
                    // No scores data available yet
                    setScoreData({
                        average: 0,
                        totalScores: 0,
                        scores: []
                    });
                }
            } catch (error: any) {
                console.error('Error fetching wine scores:', error);
                setError(error.message || 'Failed to load scores');
            } finally {
                setLoading(false);
            }
        };

        fetchScores();

        // Poll for updates every 5 seconds
        const interval = setInterval(fetchScores, 5000);

        return () => clearInterval(interval);
    }, [eventId, wineNumber]);

    const renderStars = (score: number) => {
        const stars = [];
        const fullStars = Math.floor(score);
        const hasHalfStar = score % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Star
                        key={i}
                        sx={{
                            color: '#ffd700',
                            fontSize: '1.2rem',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                        }}
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Star
                        key={i}
                        sx={{
                            color: '#ffd700',
                            fontSize: '1.2rem',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                            opacity: 0.5
                        }}
                    />
                );
            } else {
                stars.push(
                    <StarBorder
                        key={i}
                        sx={{
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '1.2rem'
                        }}
                    />
                );
            }
        }
        return stars;
    };

    if (loading) {
        return (
            <Paper sx={{
                p: 3,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
            }}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography variant="body2" sx={{ color: 'white', mt: 1, opacity: 0.8 }}>
                    Loading scores...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{
                p: 3,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
            }}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                    Error loading scores: {error}
                </Typography>
            </Paper>
        );
    }

    if (!scoreData || scoreData.totalScores === 0) {
        return (
            <Paper sx={{
                p: 3,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
            }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                    Average Score
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                    No scores yet
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    {renderStars(0)}
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{
            p: 3,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
        }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Average Score
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        mr: 2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                >
                    {scoreData.average.toFixed(1)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {renderStars(scoreData.average)}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Chip
                    label={`${scoreData.totalScores} rating${scoreData.totalScores !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'medium'
                    }}
                />
            </Box>

            {/* Individual Scores */}
            {scoreData.scores.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 1 }}>
                        Individual Scores:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                        {scoreData.scores.map((score) => (
                            <Chip
                                key={score.id}
                                label={`${score.player_name}: ${score.score}`}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    height: 24
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
}
