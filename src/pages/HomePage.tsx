import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from "@mui/material";
import { Add, GroupAdd } from "@mui/icons-material";
import FullscreenButton from '../components/FullscreenButton';

/** Full-bleed mobile background: blue/purple above, pink/red below (matches Create + Join panels). */
const MOBILE_SPLIT_BG =
    'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #f093fb 50%, #f5576c 100%)';

/** Solid colors for iOS 26+ Safari: it samples `background-color` on full-width fixed strips near the edges (meta theme-color is unreliable). */
const SAFARI_TOP_TINT = '#667eea';
const SAFARI_BOTTOM_TINT = '#f5576c';

export default function HomePage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Wine Tasting - Home';
    }, []);

    useEffect(() => {
        const mq = window.matchMedia('(max-width:899.95px)');
        const applyLayeredBg = (el: HTMLElement) => {
            // Gradient alone leaves background-color transparent → Safari 26 falls back to white chrome
            el.style.backgroundColor = SAFARI_TOP_TINT;
            el.style.backgroundImage = MOBILE_SPLIT_BG;
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = '100% 100%';
        };
        const clearLayeredBg = (el: HTMLElement) => {
            el.style.backgroundColor = '';
            el.style.backgroundImage = '';
            el.style.backgroundRepeat = '';
            el.style.backgroundSize = '';
        };
        const syncDocumentBg = () => {
            if (mq.matches) {
                applyLayeredBg(document.documentElement);
                applyLayeredBg(document.body);
            } else {
                clearLayeredBg(document.documentElement);
                clearLayeredBg(document.body);
            }
        };
        syncDocumentBg();
        mq.addEventListener('change', syncDocumentBg);
        return () => {
            mq.removeEventListener('change', syncDocumentBg);
            clearLayeredBg(document.documentElement);
            clearLayeredBg(document.body);
        };
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
                flexDirection: { xs: 'column', md: 'row' },
                minHeight: '100dvh',
                padding: 0,
                margin: 0,
                border: 'none',
                outline: 'none',
                position: 'relative',
                background: { xs: MOBILE_SPLIT_BG, md: 'transparent' }
            }}
        >
            {/*
              iOS 26+ Safari tints the status bar / toolbar from full-width fixed elements within a few px of
              the top and bottom (see WebKit “Liquid Glass” behavior). These sentinels are off-screen or under
              the system UI but supply the intended solid colors.
            */}
            <Box
                aria-hidden
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '12px',
                    minHeight: '12px',
                    backgroundColor: SAFARI_TOP_TINT,
                    zIndex: 999,
                    pointerEvents: 'none'
                }}
            />
            <Box
                aria-hidden
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'fixed',
                    bottom: '-8px',
                    left: 0,
                    width: '100%',
                    minHeight: '12px',
                    backgroundColor: SAFARI_BOTTOM_TINT,
                    zIndex: 999,
                    pointerEvents: 'none'
                }}
            />
            {/* Fullscreen Button */}
            <Box
                sx={{
                    position: 'fixed',
                    top: { xs: 'calc(10px + env(safe-area-inset-top, 0px))', md: 20 },
                    right: { xs: 'calc(10px + env(safe-area-inset-right, 0px))', md: 20 },
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
                    background: {
                        xs: 'transparent',
                        md: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    },
                    color: 'white',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: { xs: '50dvh', md: '100vh' },
                    pt: { xs: 'max(24px, calc(24px + env(safe-area-inset-top, 0px)))', md: 0 },
                    pb: { xs: 3, md: 0 },
                    px: { xs: 3, md: 0 },
                    '&:hover': {
                        transform: { xs: 'none', md: 'scale(1.02)' },
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
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        width: { xs: '100%', md: '400px' },
                        minHeight: { xs: '280px', md: '320px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        '&:hover': {
                            background: 'rgba(255,255,255,0.2)',
                            transform: { xs: 'none', md: 'translateY(-5px)' }
                        }
                    }}
                >
                    <Add sx={{ fontSize: { xs: 50, md: 60 }, mb: 2, color: 'white' }} />
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="white" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                        Create Event
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, color: 'white', fontSize: { xs: '1rem', md: '1.25rem' } }}>
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
                    background: {
                        xs: 'transparent',
                        md: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    },
                    color: 'white',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: { xs: '50dvh', md: '100vh' },
                    pt: { xs: 3, md: 0 },
                    pb: { xs: 'max(24px, calc(24px + env(safe-area-inset-bottom, 0px)))', md: 0 },
                    px: { xs: 3, md: 0 },
                    '&:hover': {
                        transform: { xs: 'none', md: 'scale(1.02)' },
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
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        width: { xs: '100%', md: '400px' },
                        minHeight: { xs: '280px', md: '320px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        '&:hover': {
                            background: 'rgba(255,255,255,0.2)',
                            transform: { xs: 'none', md: 'translateY(-5px)' }
                        }
                    }}
                >
                    <GroupAdd sx={{ fontSize: { xs: 50, md: 60 }, mb: 2, color: 'white' }} />
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="white" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                        Join Event
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, color: 'white', fontSize: { xs: '1rem', md: '1.25rem' } }}>
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