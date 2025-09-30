import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { ExpandMore, WineBar } from '@mui/icons-material';
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
                const response = await apiService.getEventWineAnswers(eventId);
                console.log('Wine answers response:', response);

                if (response && response.categories && Array.isArray(response.categories)) {
                    setCategories(response.categories);
                } else {
                    console.log('Invalid response structure:', response);
                    setCategories([]);
                }
            } catch (error: any) {
                console.error('Error fetching wine answers:', error);
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
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                    No wine categories defined for this event
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{
            p: 3,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <WineBar sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Wine Categories
                </Typography>
            </Box>

            {categories.map((category) => {
                if (!category || !category.id) return null;

                const answers = category.answers || [];
                const answerCount = answers.length;

                return (
                    <Accordion
                        key={category.id}
                        sx={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            mb: 2,
                            '&:before': {
                                display: 'none',
                            },
                            '&.Mui-expanded': {
                                margin: '0 0 16px 0',
                            }
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                            sx={{
                                '& .MuiAccordionSummary-content': {
                                    margin: '12px 0',
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'medium' }}>
                                    {category.guessing_element || 'Unknown Category'}
                                </Typography>
                                <Chip
                                    label={`${answerCount} answer${answerCount !== 1 ? 's' : ''}`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 'medium'
                                    }}
                                />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {answerCount === 0 ? (
                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.6, fontStyle: 'italic' }}>
                                    No answers submitted yet
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {answers.map((answer, index) => {
                                        if (!answer) return null;
                                        return (
                                            <Chip
                                                key={index}
                                                label={`${answer.player_name || 'Unknown'}: ${answer.wine_answer || 'No answer'}`}
                                                sx={{
                                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    height: 32,
                                                    '& .MuiChip-label': {
                                                        px: 2
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Paper>
    );
}
