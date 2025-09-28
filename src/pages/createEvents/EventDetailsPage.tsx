import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Container,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { ArrowBack, Description } from '@mui/icons-material';

export default function EventDetailsPage() {
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [duration, setDuration] = useState('');
    const [wineNotes, setWineNotes] = useState('');
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/create-event');
    };

    const handleNext = () => {
        if (description.trim() && budget && duration) {
            const eventDetails = {
                description,
                budget: parseFloat(budget),
                duration,
                wineNotes,
                createdAt: new Date().toISOString()
            };
            console.log('Event details:', eventDetails);
            // TODO: Implement actual event creation logic with API
            alert(`Event details saved successfully! 🍷`);
            navigate('/');
        } else {
            alert('Please fill in all required fields');
        }
    };

    const durationOptions = [
        '1 hour',
        '1.5 hours',
        '2 hours',
        '2.5 hours',
        '3 hours',
        '3.5 hours',
        '4 hours'
    ];

    return (
        <Container
            maxWidth={false}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                padding: 0,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                overflow: 'auto'
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 3,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <Button
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    sx={{
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.5)'
                        }
                    }}
                >
                    Back
                </Button>
                <Typography variant="h4" component="h1" sx={{ ml: 3, fontWeight: 'bold', color: 'white' }}>
                    Event Details
                </Typography>
            </Box>

            {/* Main Content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: 4,
                    minHeight: 'calc(100vh - 120px)'
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 4,
                        padding: 6,
                        border: '1px solid rgba(255,255,255,0.2)',
                        maxWidth: 600,
                        width: '100%',
                        overflow: 'auto'
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Description sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
                        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                            Tell Us More
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                            Add details to make your wine event special
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Description */}
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Event Description"
                                placeholder="Describe your wine event, what makes it special, what guests can expect..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'white',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'white',
                                        fontSize: '1rem'
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'white',
                                        '&.Mui-focused': {
                                            color: 'white'
                                        }
                                    }
                                }}
                            />
                        </Grid>

                        {/* Budget and Duration */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Budget per Person"
                                placeholder="e.g., 25"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'white',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'white'
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'white',
                                        '&.Mui-focused': {
                                            color: 'white'
                                        }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                                    Duration
                                </InputLabel>
                                <Select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    sx={{
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255,255,255,0.3)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255,255,255,0.5)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'white',
                                        },
                                        '& .MuiSelect-select': {
                                            color: 'white'
                                        }
                                    }}
                                >
                                    {durationOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Wine Notes */}
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Wine Notes (Optional)"
                                placeholder="Any specific wine preferences, themes, or special requests..."
                                value={wineNotes}
                                onChange={(e) => setWineNotes(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'white',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'white',
                                        fontSize: '1rem'
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'white',
                                        '&.Mui-focused': {
                                            color: 'white'
                                        }
                                    }
                                }}
                            />
                        </Grid>

                        {/* Create Button */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleNext}
                                    disabled={!description.trim() || !budget || !duration}
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: '2px solid white',
                                        px: 6,
                                        py: 2,
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        borderRadius: '2rem',
                                        minWidth: 200,
                                        '&:hover': {
                                            backgroundColor: 'white',
                                            color: '#667eea',
                                            transform: 'translateY(-2px)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.5)',
                                            border: '2px solid rgba(255,255,255,0.3)'
                                        }
                                    }}
                                >
                                    Create Event 🍷
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
