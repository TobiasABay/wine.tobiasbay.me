import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    TextField,
    Stepper,
    Step,
    StepLabel,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { ArrowBack, PersonAdd, WineBar } from '@mui/icons-material';
import FullscreenButton from '../../components/FullscreenButton';
import { apiService, type Event, type WineCategory } from '../../services/api';

// Predefined lists for wine regions and countries
const WINE_COUNTRIES = [
    'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Bulgaria',
    'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic', 'Egypt', 'England',
    'Estonia', 'Ethiopia', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'India',
    'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Latvia', 'Lebanon', 'Lithuania',
    'Mexico', 'Moldova', 'Montenegro', 'Morocco', 'Netherlands', 'New Zealand', 'Peru',
    'Poland', 'Portugal', 'Romania', 'Russia', 'Scotland', 'Serbia', 'Slovakia', 'Slovenia',
    'South Africa', 'Spain', 'Switzerland', 'Tanzania', 'Turkey', 'Ukraine', 'United States',
    'Uruguay', 'Wales'
];

// Country to regions mapping for smart filtering
const COUNTRY_REGIONS_MAP: { [key: string]: string[] } = {
    'France': [
        'Alsace', 'Beaujolais', 'Bordeaux', 'Burgundy', 'Champagne', 'Corsica',
        'Jura', 'Languedoc-Roussillon', 'Loire Valley', 'Provence', 'Rhône Valley', 'Savoie'
    ],
    'Italy': [
        'Abruzzo', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Liguria',
        'Lombardy', 'Marche', 'Piedmont', 'Puglia', 'Sardinia', 'Sicily', 'Tuscany', 'Umbria', 'Veneto'
    ],
    'Spain': [
        'Andalusia', 'Castilla y León', 'Catalonia', 'Cava', 'Galicia', 'Jerez',
        'La Mancha', 'Navarra', 'Priorat', 'Rías Baixas', 'Ribera del Duero', 'Rioja', 'Valencia'
    ],
    'Germany': [
        'Ahr', 'Baden', 'Franken', 'Hessische Bergstraße', 'Mosel', 'Nahe', 'Pfalz',
        'Rheingau', 'Rheinhessen', 'Saale-Unstrut', 'Saxony', 'Württemberg'
    ],
    'United States': [
        'Central Coast', 'Columbia Valley', 'Finger Lakes', 'Long Island', 'Napa Valley',
        'Paso Robles', 'Santa Barbara', 'Sonoma County', 'Texas Hill Country', 'Willamette Valley'
    ],
    'Portugal': [
        'Alentejo', 'Douro Valley', 'Vinho Verde'
    ],
    'Austria': [
        'Burgenland', 'Wachau'
    ],
    'Chile': [
        'Colchagua Valley', 'Maipo Valley'
    ],
    'Argentina': [
        'Mendoza'
    ],
    'Australia': [
        'Barossa Valley', 'Hunter Valley'
    ],
    'New Zealand': [
        'Marlborough'
    ],
    'South Africa': [
        'Constantia', 'Paarl', 'Stellenbosch'
    ],
    'Canada': [
        'Niagara Peninsula', 'Okanagan Valley'
    ]
};

// All regions for fallback
const ALL_WINE_REGIONS = [
    'Abruzzo', 'Ahr', 'Alentejo', 'Alsace', 'Andalusia', 'Baden', 'Barossa Valley',
    'Beaujolais', 'Bordeaux', 'Burgundy', 'Burgenland', 'Campania', 'Castilla y León',
    'Catalonia', 'Cava', 'Central Coast', 'Champagne', 'Colchagua Valley',
    'Columbia Valley', 'Constantia', 'Corsica', 'Douro Valley', 'Emilia-Romagna',
    'Finger Lakes', 'Franken', 'Friuli-Venezia Giulia', 'Galicia', 'Hessische Bergstraße',
    'Hunter Valley', 'Jerez', 'Jura', 'La Mancha', 'Languedoc-Roussillon', 'Liguria',
    'Loire Valley', 'Lombardy', 'Long Island', 'Maipo Valley', 'Marche', 'Marlborough',
    'Mendoza', 'Mosel', 'Nahe', 'Napa Valley', 'Navarra', 'Niagara Peninsula',
    'Okanagan Valley', 'Paarl', 'Paso Robles', 'Pfalz', 'Piedmont', 'Priorat',
    'Provence', 'Puglia', 'Rheingau', 'Rheinhessen', 'Rhône Valley', 'Rías Baixas',
    'Ribera del Duero', 'Rioja', 'Saale-Unstrut', 'Sardinia', 'Savoie', 'Saxony',
    'Sicily', 'Sonoma County', 'Stellenbosch', 'Tuscany', 'Umbria',
    'Valencia', 'Veneto', 'Vinho Verde', 'Wachau', 'Württemberg'
];

// Helper function to get options based on guessing element
const getOptionsForCategory = (guessingElement: string, selectedCountry?: string): string[] => {
    const element = guessingElement || '';

    if (element === 'Country') {
        return WINE_COUNTRIES;
    } else if (element === 'Region') {
        // If a country is selected, show only regions from that country
        if (selectedCountry && COUNTRY_REGIONS_MAP[selectedCountry]) {
            return COUNTRY_REGIONS_MAP[selectedCountry];
        }
        // Otherwise show all regions
        return ALL_WINE_REGIONS;
    } else if (element === 'Grape Variety') {
        return [
            'Barbera', 'Cabernet Sauvignon', 'Carmenère', 'Chardonnay', 'Chenin Blanc',
            'Dolcetto', 'Gewürztraminer', 'Grenache', 'Malbec', 'Merlot', 'Mourvèdre',
            'Muscat', 'Nebbiolo', 'Petit Verdot', 'Pinot Grigio', 'Pinot Noir', 'Riesling',
            'Sangiovese', 'Sauvignon Blanc', 'Semillon', 'Syrah', 'Tempranillo', 'Torrontés',
            'Viognier', 'Zinfandel'
        ];
    } else if (element === 'Age/Vintage') {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= 1950; year--) {
            years.push(year.toString());
        }
        return years;
    } else if (element === 'Price Range') {
        return [
            'Under $10', '$10-$20', '$20-$30', '$30-$50', '$50-$75', '$75-$100',
            '$100-$150', '$150-$200', '$200-$300', 'Over $300'
        ];
    } else if (element === 'Producer/Winery') {
        return [
            'Beringer', 'Bollinger', 'Caymus', 'Château Margaux', 'Cloudy Bay', 'Dom Pérignon',
            'Domaine de la Romanée-Conti', 'Far Niente', 'Gallo', 'Jordan Vineyard',
            'Kendall-Jackson', 'Krug', 'Louis Roederer', 'Moët & Chandon', 'Opus One',
            'Penfolds', 'Perrier-Jouët', 'Ridge Vineyards', 'Robert Mondavi', 'Silver Oak',
            'Stag\'s Leap Wine Cellars', 'Taittinger', 'Veuve Clicquot', 'Yellow Tail'
        ];
    } else if (element === 'Wine Style') {
        return [
            'Bold', 'Complex', 'Crisp', 'Dessert', 'Dry', 'Earthy', 'Elegant',
            'Fortified', 'Fruity', 'Full-Bodied', 'Light-Bodied', 'Medium-Bodied',
            'Mineral', 'Off-Dry', 'Smooth', 'Sparkling', 'Sweet'
        ];
    } else if (element === 'Alcohol Content') {
        return [
            'Under 12%', '12-13%', '13-14%', '14-15%', '15-16%', '16-17%', 'Over 17%'
        ];
    } else if (element === 'Tannin Level') {
        return [
            'High', 'Low', 'Medium', 'Medium-High', 'Medium-Low'
        ];
    } else if (element === 'Acidity Level') {
        return [
            'High', 'Low', 'Medium', 'Medium-High', 'Medium-Low'
        ];
    } else if (element === 'Body Type') {
        return [
            'Full', 'Light', 'Medium', 'Medium-Full', 'Medium-Light'
        ];
    } else if (element === 'Finish Length') {
        return [
            'Long', 'Medium', 'Medium-Long', 'Medium-Short', 'Short'
        ];
    } else {
        // Fallback for unknown categories
        return ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
    }
};

export default function JoinEventPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [eventData, setEventData] = useState<Event | null>(null);
    const [wineCategories, setWineCategories] = useState<WineCategory[]>([]);
    const [wineAnswers, setWineAnswers] = useState<{ [categoryId: string]: string }>({});
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Auto-fill join code from URL parameter
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            setJoinCode(codeFromUrl);
        }
    }, [searchParams]);

    // Initialize selectedCountry when wine categories are loaded
    useEffect(() => {
        if (wineCategories.length > 0) {
            const countryCategory = wineCategories.find(cat => {
                return cat.guessing_element === 'Country';
            });
            if (countryCategory && wineAnswers[countryCategory.id]) {
                setSelectedCountry(wineAnswers[countryCategory.id]);
            }
        }
    }, [wineCategories, wineAnswers]);

    const handleBack = () => {
        if (activeStep === 0) {
            navigate('/');
        } else {
            setActiveStep(0);
        }
    };

    const handleStep1 = async () => {
        if (playerName.trim() && joinCode.trim()) {
            setLoading(true);
            setError('');
            try {
                // First, get the event data to check wine categories
                const event = await apiService.getEventByJoinCode(joinCode.trim());
                setEventData(event);

                // Get wine categories for this event
                const categories = await apiService.getWineCategories(event.id);
                setWineCategories(categories);

                if (categories.length === 0) {
                    // No wine categories, join directly
                    const result = await apiService.joinEvent({
                        playerName: playerName.trim(),
                        joinCode: joinCode.trim()
                    });
                    navigate(`/event-created/${result.eventId}`);
                } else {
                    // Has wine categories, go to step 2
                    setActiveStep(1);
                }
            } catch (error: any) {
                console.error('Error fetching event:', error);
                setError(error.message || 'Failed to find event. Please check your join code and try again.');
            } finally {
                setLoading(false);
            }
        } else {
            setError('Please enter both your name and the join code');
        }
    };

    const handleStep2 = async () => {
        if (!eventData) return;

        // Check if all wine categories have answers
        const allAnswered = wineCategories.every(category =>
            wineAnswers[category.id] && wineAnswers[category.id] !== ''
        );

        if (!allAnswered) {
            setError('Please provide answers for all wine categories');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Join the event
            const result = await apiService.joinEvent({
                playerName: playerName.trim(),
                joinCode: joinCode.trim()
            });

            // Submit wine answers
            const wineAnswerData = wineCategories.map(category => ({
                categoryId: category.id,
                wineAnswer: wineAnswers[category.id]
            }));

            // Submit wine answers

            await apiService.submitWineAnswers({
                playerId: result.playerId,
                wineAnswers: wineAnswerData
            });

            // Store player ID for ready status tracking
            localStorage.setItem(`player-id-${result.eventId}`, result.playerId);

            // Successfully joined event
            navigate(`/event-created/${result.eventId}`);
        } catch (error: any) {
            console.error('Error joining event:', error);
            setError(error.message || 'Failed to join event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleWineAnswerChange = (categoryId: string, value: string) => {
        setWineAnswers(prev => ({
            ...prev,
            [categoryId]: value
        }));

        // Check if this is a country selection and update selectedCountry
        const category = wineCategories.find(cat => cat.id === categoryId);
        if (category) {
            if (category.guessing_element === 'Country') {
                setSelectedCountry(value);
                // Clear region selection when country changes
                const regionCategory = wineCategories.find(cat => {
                    return cat.guessing_element === 'Region';
                });
                if (regionCategory) {
                    setWineAnswers(prev => ({
                        ...prev,
                        [regionCategory.id]: ''
                    }));
                }
            }
        }
    };

    const handleEnterKey = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            if (activeStep === 0) {
                handleStep1();
            } else if (activeStep === 1) {
                handleStep2();
            }
        }
    };

    const steps = ['Enter Details', 'Wine Information'];

    return (
        <Container
            maxWidth={false}
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                position: 'relative'
            }}
        >
            <FullscreenButton />
            <Paper
                elevation={24}
                sx={{
                    p: 4,
                    borderRadius: 3,
                    maxWidth: 600,
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        Join Wine Event
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {activeStep === 0 ? 'Enter your details to join the wine tasting event' : 'Tell us about your wine'}
                    </Typography>
                </Box>

                {/* Stepper */}
                <Box sx={{ mb: 4 }}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Step 1: Basic Details */}
                {activeStep === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Your Name"
                            variant="outlined"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyPress={handleEnterKey}
                            placeholder="Enter your full name"
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Join Code"
                            variant="outlined"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            onKeyPress={handleEnterKey}
                            placeholder="Enter the 6-digit join code"
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                },
                            }}
                        />
                    </Box>
                )}

                {/* Step 2: Wine Information */}
                {activeStep === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
                            <WineBar sx={{ mr: 1 }} />
                            Tell us about your wine
                        </Typography>

                        {wineCategories.map((category: any) => {
                            // Use the actual database field name (snake_case) instead of camelCase
                            const guessingElement = category.guessing_element || category.guessingElement;
                            const options = getOptionsForCategory(guessingElement, selectedCountry);
                            return (
                                <Box key={category.id} sx={{ mb: 3 }}>
                                    <FormControl fullWidth>
                                        <InputLabel id={`wine-category-${category.id}`}>
                                            What is your wine's {guessingElement?.toLowerCase() || 'detail'}?
                                        </InputLabel>
                                        <Select
                                            labelId={`wine-category-${category.id}`}
                                            value={wineAnswers[category.id] || ''}
                                            label={`What is your wine's ${guessingElement?.toLowerCase() || 'detail'}?`}
                                            onChange={(e) => handleWineAnswerChange(category.id, e.target.value)}
                                            disabled={loading}
                                            sx={{
                                                borderRadius: 2,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(0, 0, 0, 0.23)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(0, 0, 0, 0.87)',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#667eea',
                                                },
                                            }}
                                        >
                                            {options.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={handleBack}
                        disabled={loading}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 'medium'
                        }}
                    >
                        {activeStep === 0 ? 'Back' : 'Previous'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={activeStep === 0 ? handleStep1 : handleStep2}
                        disabled={
                            loading ||
                            (activeStep === 0 && (!playerName.trim() || !joinCode.trim())) ||
                            (activeStep === 1 && wineCategories.some(category => !wineAnswers[category.id]))
                        }
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 'medium',
                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                            },
                        }}
                    >
                        {loading ? 'Loading...' : (activeStep === 0 ? 'Continue' : 'Join Event')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}