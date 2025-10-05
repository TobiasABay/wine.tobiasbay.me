import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from "@mui/material";
import { Add, GroupAdd } from "@mui/icons-material";
import FullscreenButton from '../components/FullscreenButton';

export default function HomePage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Wine Tasting - Home';
    }, []);

    const handleCreateEvent = () => {
        navigate('/create-event');
    };

    const handleJoinEvent = () => {
        navigate('/join-event');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                height: '100vh',
                padding: 0,
                margin: 0,
                minHeight: '100vh',
                border: 'none',
                outline: 'none',
                position: 'relative'
            }}
        >
            {/* Fullscreen Button */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 1000
                }}
            >
                <FullscreenButton />
            </Box>
            {/* Create Event Section */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }
                }}
                onClick={handleCreateEvent}
            >
                <Paper
                    elevation={0}
                    sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        padding: 4,
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'rgba(255,255,255,0.2)',
                            transform: 'translateY(-5px)'
                        }
                    }}
                >
                    <Add sx={{ fontSize: 60, mb: 2, color: 'white' }} />
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="white">
                        Create Event
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, color: 'white' }}>
                        Host your own wine tasting experience
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: '2rem',
                            '&:hover': {
                                backgroundColor: 'white',
                                color: '#667eea',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        Get Started
                    </Button>
                </Paper>
            </Box>

            {/* Join Event Section */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }
                }}
                onClick={handleJoinEvent}
            >
                <Paper
                    elevation={0}
                    sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        padding: 4,
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'rgba(255,255,255,0.2)',
                            transform: 'translateY(-5px)'
                        }
                    }}
                >
                    <GroupAdd sx={{ fontSize: 60, mb: 2, color: 'white' }} />
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="white">
                        Join Event
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, color: 'white' }}>
                        Join an existing wine tasting event
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '2px solid white',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: '2rem',

                            '&:hover': {
                                backgroundColor: 'white',
                                color: '#f5576c',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        Join Event
                    </Button>
                </Paper>
            </Box>
        </Box>
    )
}