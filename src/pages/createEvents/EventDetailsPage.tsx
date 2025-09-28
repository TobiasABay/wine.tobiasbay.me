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

    const handleNext = () => {
        if (allCategoriesValid) {
            const eventDetails = {
                wineNotes,
                wineCategories,
                createdAt: new Date().toISOString()
            };
            console.log('Event details:', eventDetails);

            // Get the basic event data from localStorage
            const basicEventData = localStorage.getItem('wineEventFormData');
            const completeEventData = {
                ...(basicEventData ? JSON.parse(basicEventData) : {}),
                ...eventDetails
            };

            console.log('Complete event data:', completeEventData);

            // Clear localStorage data after successful creation
            localStorage.removeItem('wineEventFormData');
            localStorage.removeItem('wineEventDetailsData');

            // TODO: Implement actual event creation logic with API
            // Generate event ID in UUID format like Kahoot
            const eventId = crypto.randomUUID();

            // Store event data for the created page
            localStorage.setItem('createdEventData', JSON.stringify(completeEventData));
            navigate(`/event-created/${eventId}`);
        } else {
            alert('Please select at least one guessing element');
        }
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

    const allCategoriesValid = wineCategories.every(category =>
        category.guessingElement && category.difficultyFactor
    );

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
                                    disabled={!allCategoriesValid}
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
