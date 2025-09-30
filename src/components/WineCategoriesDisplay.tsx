import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    CircularProgress
} from '@mui/material';
import { WineBar } from '@mui/icons-material';
import { apiService } from '../services/api';

interface WineCategoriesDisplayProps {
    eventId: string;
}

interface WineAnswer {
    wine_answer: string;
    player_name: string;
    presentation_order: number;
}

interface WineCategoryWithAnswers {
    id: string;
    guessing_element: string;
    difficulty_factor: string;
    answers: WineAnswer[];
}

export default function WineCategoriesDisplay({ eventId }: WineCategoriesDisplayProps) {
    const [categories, setCategories] = useState<WineCategoryWithAnswers[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchWineAnswers = async () => {
            try {
                // First, get the wine categories
                console.log('Testing wine categories endpoint...');
                const categoriesResponse = await apiService.getWineCategories(eventId);
                console.log('Wine categories response:', categoriesResponse);

                // Try to get wine answers, but fallback to categories only if it fails
                let wineAnswersResponse = null;
                try {
                    wineAnswersResponse = await apiService.getEventWineAnswers(eventId);
                    console.log('Wine answers response:', wineAnswersResponse);
                } catch (answersError) {
                    console.log('Wine answers API failed, using categories only:', answersError);
                }

                // Use wine answers if available, otherwise use categories with empty answers
                if (wineAnswersResponse && wineAnswersResponse.categories && Array.isArray(wineAnswersResponse.categories)) {
                    setCategories(wineAnswersResponse.categories);
                } else if (categoriesResponse && Array.isArray(categoriesResponse)) {
                    // Convert categories to the expected format with empty answers
                    const categoriesWithEmptyAnswers = categoriesResponse.map(category => ({
                        id: category.id,
                        guessing_element: category.guessing_element,
                        difficulty_factor: category.difficulty_factor,
                        answers: []
                    }));
                    setCategories(categoriesWithEmptyAnswers);
                } else {
                    console.log('No valid categories found');
                    setCategories([]);
                }
            } catch (error: any) {
                console.error('Error fetching wine data:', error);
                setError(error.message || 'Failed to load wine categories');
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchWineAnswers();
        } else {
            setLoading(false);
        }
    }, [eventId]);

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
                    Loading wine categories...
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
                    Error loading wine categories: {error}
                </Typography>
            </Paper>
        );
    }

    if (categories.length === 0) {
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
                    Wine Categories
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 2 }}>
                    No wine categories defined for this event
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6, fontSize: '0.7rem' }}>
                    Event ID: {eventId}
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <WineBar sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Wine Categories & Player Guesses
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 3 }}>
                {categories.map((category) => {
                    if (!category || !category.id) return null;

                    const answers = category.answers || [];
                    const answerCount = answers.length;

                    return (
                        <Paper
                            key={category.id}
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}
                        >
                            {/* Category Header */}
                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: '#2c3e50',
                                        fontWeight: 'bold',
                                        mb: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: '#667eea',
                                            flexShrink: 0
                                        }}
                                    />
                                    {category.guessing_element || 'Unknown Category'}
                                </Typography>

                                {category.difficulty_factor && (
                                    <Chip
                                        label={`Difficulty: ${category.difficulty_factor}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: category.difficulty_factor === 'Easy' ? '#e8f5e8' :
                                                category.difficulty_factor === 'Medium' ? '#fff3cd' : '#f8d7da',
                                            color: category.difficulty_factor === 'Easy' ? '#155724' :
                                                category.difficulty_factor === 'Medium' ? '#856404' : '#721c24',
                                            fontWeight: 'medium',
                                            fontSize: '0.75rem',
                                            mb: 2
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Player Guesses */}
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#34495e',
                                        fontWeight: 'medium',
                                        mb: 2,
                                        fontSize: '1rem'
                                    }}
                                >
                                    Player Guesses ({answerCount})
                                </Typography>

                                {answerCount === 0 ? (
                                    <Box
                                        sx={{
                                            p: 3,
                                            textAlign: 'center',
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            borderRadius: 2,
                                            border: '2px dashed rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: '#7f8c8d',
                                                fontStyle: 'italic',
                                                fontWeight: 'medium'
                                            }}
                                        >
                                            No guesses submitted yet
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#95a5a6',
                                                mt: 1
                                            }}
                                        >
                                            Players will appear here once they submit their guesses
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {answers.map((answer, index) => {
                                            if (!answer) return null;
                                            return (
                                                <Paper
                                                    key={index}
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                                        borderRadius: 2,
                                                        minWidth: '200px',
                                                        flex: '1 1 auto'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{
                                                            color: '#2c3e50',
                                                            fontWeight: 'bold',
                                                            mb: 1,
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        {answer.player_name || 'Unknown Player'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            color: '#34495e',
                                                            fontWeight: 'medium',
                                                            fontSize: '1rem'
                                                        }}
                                                    >
                                                        {answer.wine_answer || 'No answer'}
                                                    </Typography>
                                                    {answer.presentation_order && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: '#7f8c8d',
                                                                fontSize: '0.75rem',
                                                                display: 'block',
                                                                mt: 0.5
                                                            }}
                                                        >
                                                            Order: #{answer.presentation_order}
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
}
