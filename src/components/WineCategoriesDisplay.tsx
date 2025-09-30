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

interface WineCategory {
    id: string;
    guessing_element: string;
    difficulty_factor: string;
}

export default function WineCategoriesDisplay({ eventId }: WineCategoriesDisplayProps) {
    const [categories, setCategories] = useState<WineCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchWineCategories = async () => {
            try {
                console.log('Fetching wine categories...');
                const categoriesResponse = await apiService.getWineCategories(eventId);
                console.log('Wine categories response:', categoriesResponse);

                if (categoriesResponse && Array.isArray(categoriesResponse)) {
                    setCategories(categoriesResponse);
                } else {
                    console.log('No valid categories found');
                    setCategories([]);
                }
            } catch (error: any) {
                console.error('Error fetching wine categories:', error);
                setError(error.message || 'Failed to load wine categories');
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchWineCategories();
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

                            {/* Placeholder for future guesses from rating page */}
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
                                    Player guesses will appear here
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#95a5a6',
                                        mt: 1
                                    }}
                                >
                                    After players rate and guess the wines
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
}
