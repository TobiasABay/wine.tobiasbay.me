import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Divider,
    FormControlLabel,
    Switch
} from '@mui/material';
import { ArrowBack, Person, Fullscreen, FullscreenExit, Shuffle, PlayArrow } from '@mui/icons-material';
import QRCode from 'qrcode';

export default function EventCreatedPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [players] = useState<Array<{ id: string, name: string, joinedAt: string }>>([]);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [autoShuffle, setAutoShuffle] = useState<boolean>(false);
    const [presentationOrder, setPresentationOrder] = useState<Array<{ id: string, name: string, joinedAt: string }>>([]);
    const navigate = useNavigate();
    const { eventId: urlEventId } = useParams();

    useEffect(() => {
        // Use event ID from URL if available, otherwise generate a new one in UUID format like Kahoot
        const finalEventId = urlEventId || crypto.randomUUID();

        // Generate a join code (6-digit number)
        const newJoinCode = Math.floor(100000 + Math.random() * 900000).toString();
        setJoinCode(newJoinCode);

        // Update the URL to include the event ID if not already there
        if (!urlEventId) {
            const newUrl = `/event-created/${finalEventId}`;
            window.history.replaceState({}, '', newUrl);
        }

        // Generate QR code
        const generateQRCode = async () => {
            try {
                const qrData = `https://wine.tobiasbay.me/join/${finalEventId}`;
                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrCodeUrl(qrCodeDataURL);
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        };

        generateQRCode();
    }, [urlEventId]);

    // Listen for fullscreen changes (important for iOS)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        // Add event listeners for different browsers
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Handle auto shuffle logic
    useEffect(() => {
        if (autoShuffle && players.length > 0) {
            // Create a shuffled copy of the players array
            const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
            setPresentationOrder(shuffledPlayers);
        } else {
            // Use original order when auto shuffle is off
            setPresentationOrder([...players]);
        }
    }, [players, autoShuffle]);

    const handleBack = () => {
        navigate('/');
    };

    const handleStart = () => {
        // Navigate to the event details page to start the wine tasting
        const finalEventId = urlEventId || crypto.randomUUID();
        navigate(`/event/${finalEventId}`);
    };

    const toggleFullscreen = async () => {
        try {
            const element = document.documentElement;

            // Check for various fullscreen methods (cross-browser compatibility)
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );

            if (!isCurrentlyFullscreen) {
                // Try different fullscreen methods for cross-browser support
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                } else if ((element as any).mozRequestFullScreen) {
                    await (element as any).mozRequestFullScreen();
                } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                } else {
                    // Fallback for iOS - try to hide the address bar
                    if (window.scrollTo) {
                        window.scrollTo(0, 1);
                    }
                    console.warn('Fullscreen API not supported, using fallback');
                }
                setIsFullscreen(true);
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
            // For iOS, try a different approach
            if (navigator.userAgent.match(/iPad|iPhone|iPod/)) {
                // iOS fallback - scroll to hide address bar
                if (window.scrollTo) {
                    window.scrollTo(0, 1);
                    setTimeout(() => window.scrollTo(0, 0), 100);
                }
            }
        }
    };

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
                        Event Created!
                    </Typography>
                </Box>

                <Button
                    onClick={toggleFullscreen}
                    sx={{
                        color: 'white',
                        scale: 1.2,
                        '&:hover': {
                            scale: 1.4,
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </Button>
            </Box>

            {/* Main Content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: { xs: 2, sm: 4 },
                    minHeight: 'calc(100vh - 120px)'
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: { xs: 2, sm: 4 },
                        padding: { xs: 3, sm: 6 },
                        border: '1px solid rgba(255,255,255,0.2)',
                        maxWidth: 600,
                        width: '100%',
                        overflow: 'auto'
                    }}
                >

                    <Grid container spacing={{ xs: 1, sm: 2 }}>

                        {/* Join Code */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Join Code
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: { xs: 1, sm: 2 },
                                    flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                    <Chip
                                        label={joinCode}
                                        sx={{
                                            fontSize: { xs: '1.5rem', sm: '2rem' },
                                            fontWeight: 'bold',
                                            height: { xs: 50, sm: 60 },
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '2px solid white',
                                            minWidth: { xs: 120, sm: 150 }
                                        }}
                                    />

                                </Box>
                            </Box>
                        </Grid>

                        {/* QR Code */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
                                {qrCodeUrl && (
                                    <Box sx={{
                                        display: 'inline-block',
                                        p: { xs: 1, sm: 2 },
                                        backgroundColor: 'white',
                                        borderRadius: 2,
                                        mb: 2
                                    }}>
                                        <img
                                            src={qrCodeUrl}
                                            alt="QR Code"
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                maxWidth: '200px',
                                                height: 'auto'
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Players List */}
                        <Grid size={12}>
                            <Box sx={{ mb: { xs: 1, sm: 2 } }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Presentation Order ({presentationOrder.length})
                                </Typography>
                                {presentationOrder.length === 0 ? (
                                    <Box sx={{
                                        textAlign: 'center',
                                        py: 4,
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 2,
                                        border: '1px dashed rgba(255,255,255,0.2)'
                                    }}>
                                        <Person sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)', mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.6 }}>
                                            No players joined yet. Share the join code or QR code to invite guests!
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Paper sx={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 2,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        maxHeight: 200,
                                        overflow: 'auto'
                                    }}>
                                        <List>
                                            {presentationOrder.map((player, index) => (
                                                <Box key={player.id}>
                                                    <ListItem sx={{ py: 1.5 }}>
                                                        <Avatar sx={{
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                            color: 'white',
                                                            mr: 2,
                                                            width: 32,
                                                            height: 32,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {index + 1}
                                                        </Avatar>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                                                    {player.name}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                                                    Wine #{index + 1}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {index < presentationOrder.length - 1 && <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                                                </Box>
                                            ))}
                                        </List>
                                    </Paper>
                                )}
                            </Box>
                        </Grid>

                        {/* Bottom Controls */}
                        <Grid size={12}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                                pt: 2,
                                borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {/* Auto Shuffle Toggle */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={autoShuffle}
                                                onChange={(e) => setAutoShuffle(e.target.checked)}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: 'white',
                                                        '& + .MuiSwitch-track': {
                                                            backgroundColor: 'rgba(255,255,255,0.5)',
                                                        },
                                                    },
                                                    '& .MuiSwitch-switchBase': {
                                                        color: 'rgba(255,255,255,0.5)',
                                                    },
                                                    '& .MuiSwitch-track': {
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, order: -1 }}>
                                                <Shuffle sx={{ color: 'white', fontSize: '1.2rem' }} />
                                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                                    Auto Shuffle
                                                </Typography>
                                            </Box>
                                        }
                                        labelPlacement="start"
                                        sx={{
                                            '& .MuiFormControlLabel-label': {
                                                color: 'white',
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Start Button */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Button
                                        onClick={handleStart}
                                        variant="contained"
                                        startIcon={<PlayArrow />}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '2px solid white',
                                            borderRadius: 3,
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 200,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.3)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                                            },
                                            '&:active': {
                                                transform: 'translateY(0px)',
                                            },
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        Start
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
