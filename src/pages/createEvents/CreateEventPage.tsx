import { useState, useEffect, useRef } from 'react';
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
    MenuItem
} from '@mui/material';
import { ArrowBack, WineBar } from '@mui/icons-material';
import FullscreenButton from '../../components/FullscreenButton';

export default function CreateEventPage() {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [wineType, setWineType] = useState('');
    const [location, setLocation] = useState('');
    const navigate = useNavigate();
    const isInitialized = useRef(false);

    // Load saved form data from localStorage on component mount
    useEffect(() => {
        const savedData = localStorage.getItem('wineEventFormData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            setEventName(formData.eventName || '');
            setEventDate(formData.eventDate || '');
            setMaxParticipants(formData.maxParticipants || '');
            setWineType(formData.wineType || '');
            setLocation(formData.location || '');
        }
        isInitialized.current = true;
    }, []);

    // Save form data to localStorage whenever any field changes (but not on initial load)
    useEffect(() => {
        if (isInitialized.current) {
            const formData = {
                eventName,
                eventDate,
                maxParticipants,
                wineType,
                location
            };
            localStorage.setItem('wineEventFormData', JSON.stringify(formData));
        }
    }, [eventName, eventDate, maxParticipants, wineType, location]);

    const handleBack = () => {
        // Clear localStorage when going back to home
        localStorage.removeItem('wineEventFormData');
        localStorage.removeItem('wineEventDetailsData');
        navigate('/');
    };

    const handleCreateEvent = () => {
        if (eventName.trim() && eventDate && maxParticipants && wineType && location.trim()) {
            // Navigate to event details page to complete the event creation
            navigate('/event-details');
        } else {
            alert('Please fill in all fields to continue');
        }
    };

    const wineTypes = [
        'Red Wine',
        'White Wine',
        'Rosé Wine',
        'Sparkling Wine',
        'Champagne',
        'Dessert Wine',
        'Port Wine',
        'Mixed Selection'
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
                    justifyContent: 'space-between',
                    padding: 3,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{
                            color: 'white',
                            scale: 1.5,
                            '&:hover': {
                                scale: 1.7,
                            }
                        }}
                    >
                    </Button>
                    <Typography variant="h4" component="h1" sx={{ ml: 3, fontWeight: 'bold', color: 'white' }}>
                        Create Wine Event
                    </Typography>
                </Box>

                <FullscreenButton />
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
                        <WineBar sx={{ fontSize: 80, mb: 2, opacity: 0.9, color: 'white' }} />
                        <Typography sx={{ color: 'white' }} variant="h4" component="h2" gutterBottom fontWeight="bold">
                            Plan Your Wine Event
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                            Create a memorable wine tasting experience
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Event Name */}
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Event Name"
                                placeholder="e.g., 'Summer Wine Tasting' or 'Bordeaux Night'"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
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

                        {/* Date and Max Participants */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Event Date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
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
                            <TextField
                                fullWidth
                                type="number"
                                label="Max Participants"
                                placeholder="e.g., 12"
                                value={maxParticipants}
                                onChange={(e) => setMaxParticipants(e.target.value)}
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

                        {/* Wine Type */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                                    Wine Type
                                </InputLabel>
                                <Select
                                    value={wineType}
                                    onChange={(e) => setWineType(e.target.value)}
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
                                    {wineTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Location */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Location"
                                placeholder="e.g., 'My Home' or 'Wine Bar Downtown'"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
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

                        {/* Create Button */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleCreateEvent}
                                    disabled={!eventName.trim() || !eventDate || !maxParticipants || !wineType || !location.trim()}
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
                                    Next
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
