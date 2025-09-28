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
    Divider
} from '@mui/material';
import { ArrowBack, Person } from '@mui/icons-material';
import QRCode from 'qrcode';

export default function EventCreatedPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [eventId, setEventId] = useState<string>('');
    const [players, setPlayers] = useState<Array<{ id: string, name: string, joinedAt: string }>>([]);
    const navigate = useNavigate();
    const { eventId: urlEventId } = useParams();

    useEffect(() => {
        // Use event ID from URL if available, otherwise generate a new one in UUID format like Kahoot
        const finalEventId = urlEventId || crypto.randomUUID();
        setEventId(finalEventId);

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

    const handleBack = () => {
        navigate('/');
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
                    Event Created!
                </Typography>
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
                                    Players ({players.length})
                                </Typography>
                                {players.length === 0 ? (
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
                                            {players.map((player, index) => (
                                                <Box key={player.id}>
                                                    <ListItem sx={{ py: 1.5 }}>
                                                        <Avatar sx={{
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                            color: 'white',
                                                            mr: 2,
                                                            width: 32,
                                                            height: 32
                                                        }}>
                                                            <Person sx={{ fontSize: 20 }} />
                                                        </Avatar>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                                                    {player.name}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                                                    Joined {new Date(player.joinedAt).toLocaleString()}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {index < players.length - 1 && <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                                                </Box>
                                            ))}
                                        </List>
                                    </Paper>
                                )}
                            </Box>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid size={12}>
                            <Box sx={{
                                display: 'flex',
                                gap: { xs: 1, sm: 2 },
                                justifyContent: 'center',
                                flexDirection: { xs: 'column', sm: 'row' }
                            }}>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
