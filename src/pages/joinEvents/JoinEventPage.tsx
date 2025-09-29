import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    TextField,
    Grid
} from '@mui/material';
import { ArrowBack, PersonAdd } from '@mui/icons-material';
import FullscreenButton from '../../components/FullscreenButton';

export default function JoinEventPage() {
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/');
    };

    const handleJoinEvent = () => {
        if (playerName.trim() && joinCode.trim()) {
            // TODO: Implement actual join logic with backend
            console.log('Joining event:', { playerName: playerName.trim(), joinCode: joinCode.trim() });

            // For now, navigate to a placeholder page or back to home
            // In the future, this should navigate to the event lobby or waiting room
            alert(`Welcome ${playerName.trim()}! You've joined event ${joinCode.trim()}`);
            navigate('/');
        } else {
            alert('Please enter both your name and the join code');
        }
    };

    const handleEnterKey = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleJoinEvent();
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
                        Join Event
                    </Typography>
                </Box>

                <FullscreenButton />
            </Box>

            {/* Main Content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
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
                        maxWidth: 500,
                        width: '100%'
                    }}
                >
                    <Grid container spacing={3}>
                        {/* Title */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <PersonAdd sx={{ fontSize: 64, color: 'white', mb: 2 }} />
                                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                    Join Wine Tasting Event
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'white', opacity: 0.8 }}>
                                    Enter your details to join the event
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Player Name Input */}
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Your Name"
                                variant="outlined"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                onKeyPress={handleEnterKey}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
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
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255,255,255,0.7)',
                                        '&.Mui-focused': {
                                            color: 'white',
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        {/* Join Code Input */}
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Join Code"
                                variant="outlined"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                onKeyPress={handleEnterKey}
                                placeholder="Enter 6-digit code"
                                inputProps={{
                                    maxLength: 6,
                                    style: {
                                        textAlign: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
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
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255,255,255,0.7)',
                                        '&.Mui-focused': {
                                            color: 'white',
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        {/* Join Button */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', pt: 2 }}>
                                <Button
                                    onClick={handleJoinEvent}
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    disabled={!playerName.trim() || !joinCode.trim()}
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
                                        '&:disabled': {
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.5)',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    Join Event
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
