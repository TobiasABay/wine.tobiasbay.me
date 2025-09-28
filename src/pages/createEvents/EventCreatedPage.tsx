import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    Grid,
    IconButton,
    Chip
} from '@mui/material';
import { ArrowBack, ContentCopy, Share, QrCode } from '@mui/icons-material';
import QRCode from 'qrcode';

export default function EventCreatedPage() {
    const [eventData, setEventData] = useState<any>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [eventId, setEventId] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        // Generate a unique event ID
        const newEventId = `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setEventId(newEventId);

        // Generate a join code (6-digit number)
        const newJoinCode = Math.floor(100000 + Math.random() * 900000).toString();
        setJoinCode(newJoinCode);

        // Generate QR code
        const generateQRCode = async () => {
            try {
                const qrData = `https://wine.tobiasbay.me/join/${newJoinCode}`;
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
    }, []);

    const handleBack = () => {
        navigate('/');
    };

    const handleCopyJoinCode = async () => {
        try {
            await navigator.clipboard.writeText(joinCode);
            alert('Join code copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy join code:', error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Join my Wine Tasting Event',
            text: `Join my wine tasting event! Use code: ${joinCode}`,
            url: `https://wine.tobiasbay.me/join/${joinCode}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(`Join my wine tasting event! Use code: ${joinCode} or visit: https://wine.tobiasbay.me/join/${joinCode}`);
                alert('Share link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
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

                    <Grid container spacing={4}>
                        {/* Event Title */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                    Event Title
                                </Typography>
                                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    Wine Tasting Event
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Join Code */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                                    Join Code
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                    <Chip
                                        label={joinCode}
                                        sx={{
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            height: 60,
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '2px solid white'
                                        }}
                                    />
                                    <IconButton
                                        onClick={handleCopyJoinCode}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.3)'
                                            }
                                        }}
                                    >
                                        <ContentCopy />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Grid>

                        {/* QR Code */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                                    QR Code
                                </Typography>
                                {qrCodeUrl && (
                                    <Box sx={{
                                        display: 'inline-block',
                                        p: 2,
                                        backgroundColor: 'white',
                                        borderRadius: 2,
                                        mb: 2
                                    }}>
                                        <img src={qrCodeUrl} alt="QR Code" style={{ display: 'block' }} />
                                    </Box>
                                )}
                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                                    Guests can scan this QR code to join
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Event ID */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                    Event ID
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'white', opacity: 0.8, fontFamily: 'monospace' }}>
                                    {eventId}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid size={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Share />}
                                    onClick={handleShare}
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
                                    Share Event
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleBack}
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: '2px solid white',
                                        px: 4,
                                        py: 1.5,
                                        '&:hover': {
                                            backgroundColor: 'white',
                                            color: '#667eea',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    Back to Home
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
