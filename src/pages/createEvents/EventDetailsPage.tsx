import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    Grid,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import { ArrowBack, Description, Delete } from '@mui/icons-material';
import FullscreenButton from '../../components/FullscreenButton';
import { apiService } from '../../services/api';

export default function EventDetailsPage() {
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [duration, setDuration] = useState('');
    const [wineNotes, setWineNotes] = useState('');
    const [wineCategories, setWineCategories] = useState<Array<{
        id: string;
        guessingElement: string;
        difficultyFactor: string;
    }>>([{
        id: '1',
        guessingElement: '',
        difficultyFactor: ''
    }]);
    const navigate = useNavigate();
    const isInitialized = useRef(false);

    // Load saved form data from localStorage on component mount
    useEffect(() => {
        const savedData = localStorage.getItem('wineEventDetailsData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            setDescription(formData.description || '');
            setBudget(formData.budget || '');
            setDuration(formData.duration || '');
            setWineNotes(formData.wineNotes || '');
            setWineCategories(formData.wineCategories || [{
                id: '1',
                guessingElement: '',
                difficultyFactor: ''
            }]);
        }
        isInitialized.current = true;
    }, []);

    // Save form data to localStorage whenever any field changes (but not on initial load)
    useEffect(() => {
        if (isInitialized.current) {
            const formData = {
                description,
                budget,
                duration,
                wineNotes,
                wineCategories
            };
            localStorage.setItem('wineEventDetailsData', JSON.stringify(formData));
        }
    }, [description, budget, duration, wineNotes, wineCategories]);

    const handleBack = () => {
        navigate('/create-event');
    };

    const addNewCategory = () => {
        const newCategory = {
            id: Date.now().toString(),
            guessingElement: '',
            difficultyFactor: ''
        };
        setWineCategories(prev => [...prev, newCategory]);
    };

    const removeCategory = (categoryId: string) => {
        if (wineCategories.length > 1) {
            setWineCategories(prev => prev.filter(category => category.id !== categoryId));
        }
    };

    const updateCategory = (categoryId: string, field: 'guessingElement' | 'difficultyFactor', value: string) => {
        setWineCategories(prev => prev.map(category =>
            category.id === categoryId ? { ...category, [field]: value } : category
        ));
    };

    const handleNext = async () => {
        console.log('handleNext called!');
        // For now, allow creating events without wine categories
        // if (allCategoriesValid) {
        try {
            // Get the basic event data from localStorage
            const basicEventData = localStorage.getItem('wineEventFormData');
            if (!basicEventData) {
                alert('Event data not found. Please go back and create an event first.');
                navigate('/create-event');
                return;
            }

            const parsedBasicData = JSON.parse(basicEventData);

            // Filter out empty wine categories and prepare them
            const validWineCategories = wineCategories.filter(category =>
                category.guessingElement.trim() !== '' && category.difficultyFactor.trim() !== ''
            );

            // Combine basic event data with additional details
            const completeEventData = {
                name: parsedBasicData.eventName.trim(),
                date: parsedBasicData.eventDate,
                maxParticipants: parseInt(parsedBasicData.maxParticipants),
                wineType: parsedBasicData.wineType,
                location: parsedBasicData.location.trim(),
                description: description.trim(),
                budget: budget.trim(),
                duration: duration.trim(),
                wineNotes: wineNotes.trim(),
                wineCategories: validWineCategories
            };

            console.log('Creating event with data:', completeEventData);
            console.log('About to call API...');

            // Create the event in the database
            const result = await apiService.createEvent(completeEventData);
            console.log('Event created successfully:', result);

            // Set the event creator flag so drag and drop is enabled
            // Store the creator session with a unique identifier and timestamp
            const creatorSessionId = `creator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(`event-creator-${result.eventId}`, creatorSessionId);

            // Store a session flag to track the current user's creator status
            // This is the primary method since sessionStorage is per-tab/user
            sessionStorage.setItem(`is-creator-${result.eventId}`, 'true');

            // Store a timestamp to ensure the creator session is recent
            localStorage.setItem(`creator-time-${result.eventId}`, Date.now().toString());

            // Store the session ID in sessionStorage as well for additional security
            sessionStorage.setItem(`creator-session-${result.eventId}`, creatorSessionId);

            // Clear localStorage data after successful creation
            localStorage.removeItem('wineEventFormData');
            localStorage.removeItem('wineEventDetailsData');

            // Navigate to the event created page with the real event ID
            navigate(`/event-created/${result.eventId}`);
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
        // } else {
        //     alert('Please select at least one guessing element');
        // }
    };


    const predefinedGuessingOptions = [
        'Region',
        'Country',
        'Age/Vintage',
        'Grape Variety',
        'Price Range',
        'Producer/Winery',
        'Wine Style',
        'Alcohol Content',
        'Tannin Level',
        'Acidity Level',
        'Body Type',
        'Finish Length'
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
                        Event Details
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
                        <Description sx={{ fontSize: 80, mb: 2, opacity: 0.9, color: 'white' }} />
                        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" sx={{ opacity: 0.9, color: 'white' }}>
                            Tell Us More
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Wine Guessing Categories Section */}
                        <Grid size={12}>
                            <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                                Wine Guessing Categories
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 3 }}>
                                Create different categories of things your guests should try to guess about each wine
                            </Typography>
                        </Grid>

                        {/* Wine Guessing Categories Container */}
                        <Grid size={12}>
                            <Box sx={{
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 2,
                                p: 3,
                                mb: 2,
                                backgroundColor: 'rgba(255,255,255,0.05)'
                            }}>
                                {wineCategories.map((category, index) => (
                                    <Box key={category.id} sx={{ mb: index < wineCategories.length - 1 ? 2 : 0 }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                <FormControl fullWidth>
                                                    <Select
                                                        value={category.guessingElement}
                                                        onChange={(e) => updateCategory(category.id, 'guessingElement', e.target.value)}
                                                        displayEmpty
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
                                                        <MenuItem value="" disabled>
                                                            <em>Choose a guessing element</em>
                                                        </MenuItem>
                                                        {predefinedGuessingOptions.map((option) => (
                                                            <MenuItem key={option} value={option}>
                                                                {option}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={category.difficultyFactor}
                                                            onChange={(e) => updateCategory(category.id, 'difficultyFactor', e.target.value)}
                                                            displayEmpty
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
                                                            <MenuItem value="" disabled>
                                                                <em>Factor (1-5)</em>
                                                            </MenuItem>
                                                            <MenuItem value="1">1</MenuItem>
                                                            <MenuItem value="2">2</MenuItem>
                                                            <MenuItem value="3">3</MenuItem>
                                                            <MenuItem value="4">4</MenuItem>
                                                            <MenuItem value="5">5</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {wineCategories.length > 1 && (
                                                        <Button
                                                            onClick={() => removeCategory(category.id)}
                                                            sx={{
                                                                minWidth: 'auto',
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                backgroundColor: 'rgba(255,0,0,0.2)',
                                                                color: 'white',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(255,0,0,0.4)',
                                                                    transform: 'scale(1.1)'
                                                                }
                                                            }}
                                                        >
                                                            <Delete sx={{ fontSize: 18 }} />
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>

                        {/* Add New Category Button */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={addNewCategory}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        px: 4,
                                        py: 1.5,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            borderColor: 'rgba(255,255,255,0.5)'
                                        }
                                    }}
                                >
                                    + Add Another Category
                                </Button>
                            </Box>
                        </Grid>


                        {/* Create Button */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleNext}
                                    disabled={false}
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
