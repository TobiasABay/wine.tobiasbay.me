import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useSSE } from '../hooks/useSSE';

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

    // Use SSE for real-time updates
    const { lastUpdate } = useSSE({
        eventId,
        onUpdate: (data) => {
            if (data.data && data.data.current_wine_number === wineNumber) {
                const wineScores = data.data.scores || [];
                setScoreData({
                    average: data.data.average_score,
                    totalScores: data.data.score_count,
                    scores: wineScores.map(score => ({
                        id: score.id,
                        player_id: score.player_id,
                        player_name: score.player_name,
                        score: score.score,
                        created_at: new Date().toISOString()
                    }))
                });
                setLoading(false);
            }
        },
        enabled: true
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialScores = async () => {
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

        fetchInitialScores();
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
                            fontSize: '0.8rem',
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
                            fontSize: '0.8rem',
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
                            fontSize: '0.8rem'
                        }}
                    />
                );
            }
        }
        return stars;
    };

    if (loading) {
        return (
            <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000
            }}>
                <CircularProgress sx={{ color: 'white', mb: 1 }} size={24} />
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, fontSize: '0.7rem' }}>
                    Loading...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000
            }}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, fontSize: '0.7rem', textAlign: 'center' }}>
                    Error
                </Typography>
            </Box>
        );
    }

    if (!scoreData || scoreData.totalScores === 0) {
        return (
            <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000
            }}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, fontSize: '0.7rem', mb: 0.5 }}>
                    Average
                </Typography>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    0.0
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                    {renderStars(0)}
                </Box>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6, fontSize: '0.6rem', mt: 0.5 }}>
                    0 votes
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000
        }}>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.8, fontSize: '0.7rem', mb: 0.5 }}>
                Average
            </Typography>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {scoreData.average.toFixed(1)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                {renderStars(scoreData.average)}
            </Box>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.6, fontSize: '0.6rem', mt: 0.5 }}>
                {scoreData.totalScores} vote{scoreData.totalScores !== 1 ? 's' : ''}
            </Typography>
        </Box>
    );
}
