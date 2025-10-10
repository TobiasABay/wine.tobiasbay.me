import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Divider,
    Alert
} from '@mui/material';
import { Person, Refresh } from '@mui/icons-material';
import { DEMO_EVENT_ID, DEMO_PLAYERS, enableDemoMode, disableDemoMode } from '../utils/demoData';
import { useEffect } from 'react';

export default function DemoPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Wine Tasting - Demo Mode';
    }, []);

    const handleSelectPlayer = (playerId: string) => {
        // Enable demo mode
        enableDemoMode();

        // Store player ID in localStorage
        localStorage.setItem(`player-id-${DEMO_EVENT_ID}`, playerId);

        // Navigate to scoring page
        navigate(`/score/${DEMO_EVENT_ID}`);
    };

    const handleResetDemo = () => {
        disableDemoMode();
        // Reload page to clear states
        window.location.reload();
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
                overflow: 'auto',
                py: 4
            }}
        >
            <Container maxWidth="sm">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>
                        Demo Mode
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', opacity: 0.9 }}>
                        Test the wine tasting app without connecting to the database
                    </Typography>
                </Box>

                {/* Info Alert */}
                <Alert severity="info" sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                    <Typography variant="body2">
                        This demo uses hardcoded data stored in localStorage.
                        Select a player below to start testing the scoring flow.
                    </Typography>
                </Alert>

                {/* Player Selection */}
                <Paper sx={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    p: 3,
                    mb: 3
                }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                        Select Your Player
                    </Typography>

                    <List>
                        {DEMO_PLAYERS.map((player, index) => (
                            <Box key={player.id}>
                                <ListItem
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                        },
                                        py: 2
                                    }}
                                    onClick={() => handleSelectPlayer(player.id)}
                                >
                                    <Avatar sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        mr: 2,
                                        fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'medium' }}>
                                                {player.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                                    Wine #{player.presentation_order}
                                                </Typography>
                                                {player.wine_details && player.wine_details.length > 0 && (
                                                    <Typography variant="caption" sx={{ color: 'white', opacity: 0.6 }}>
                                                        Wine: {player.wine_details.find(d => d.guessing_element === 'Grape Variety')?.wine_answer} from {player.wine_details.find(d => d.guessing_element === 'Country')?.wine_answer}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                </ListItem>
                                {index < DEMO_PLAYERS.length - 1 && (
                                    <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                                )}
                            </Box>
                        ))}
                    </List>
                </Paper>

                {/* Reset Button */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        onClick={handleResetDemo}
                        startIcon={<Refresh />}
                        variant="outlined"
                        sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.5)',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Reset Demo Data
                    </Button>
                </Box>

                {/* Info Box */}
                <Paper sx={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    p: 3,
                    mt: 4
                }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', opacity: 0.8, mb: 1 }}>
                        Demo Features:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                        • Pre-filled wine details for each player<br />
                        • Test scoring with decimal values (1.0 - 5.0)<br />
                        • Test category guessing<br />
                        • All data stored in localStorage<br />
                        • No database connection required
                    </Typography>
                </Paper>
            </Container>
        </Container>
    );
}

