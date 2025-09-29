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
import { ArrowBack, Person, Shuffle, PlayArrow, DragIndicator } from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FullscreenButton from '../../components/FullscreenButton';
import QRCode from 'qrcode';
import { apiService, type Event, type Player } from '../../services/api';
import { webSocketService } from '../../services/websocket';

// Sortable Player Item Component
function SortablePlayerItem({ player, index, canDrag }: { player: Player; index: number; canDrag: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box key={player.id} ref={setNodeRef} style={style}>
            <ListItem sx={{ py: 1.5, pl: 1 }}>
                {/* Player Avatar */}
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

                {/* Player Info */}
                <ListItemText
                    primary={
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                            {player.name}
                        </Typography>
                    }
                    secondary={
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                            Wine #{index + 1} • Joined {new Date(player.joined_at).toLocaleString()}
                        </Typography>
                    }
                />

                {/* Drag Handle - Only show for event creator */}
                {canDrag && (
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'grab',
                            ml: 2,
                            padding: '8px',
                            borderRadius: '4px',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                            },
                            '&:active': {
                                cursor: 'grabbing',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                            },
                        }}
                    >
                        <DragIndicator sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }} />
                    </Box>
                )}

            </ListItem>
            <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </Box>
    );
}

export default function EventCreatedPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [autoShuffle, setAutoShuffle] = useState<boolean>(false);
    const [eventData, setEventData] = useState<Event | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isEventCreator, setIsEventCreator] = useState<boolean>(false);
    const navigate = useNavigate();
    const { eventId: urlEventId } = useParams();

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = players.findIndex(player => player.id === active.id);
            const newIndex = players.findIndex(player => player.id === over.id);

            const newPlayers = arrayMove(players, oldIndex, newIndex);
            setPlayers(newPlayers);

            // Update presentation order in database
            try {
                console.log('Calling API to update player order:', newPlayers);
                await apiService.updatePlayerOrder(urlEventId!, newPlayers);
                console.log('API call successful - WebSocket event should be emitted');
            } catch (error) {
                console.error('Error updating player order:', error);
                // Revert the change if API call fails
                setPlayers(players);
                alert('Failed to update player order. Please try again.');
            }
        }
    };

    useEffect(() => {
        const loadEventData = async () => {
            if (!urlEventId) {
                setLoading(false);
                return;
            }

            // Check if user is the event creator by looking at sessionStorage and localStorage
            // This is a simple approach - in a real app you'd have proper authentication
            const hasCreatorSession = sessionStorage.getItem(`is-creator-${urlEventId}`) === 'true';
            const hasCreatorLocalStorage = localStorage.getItem(`event-creator-${urlEventId}`) !== null;
            const creatorTime = localStorage.getItem(`creator-time-${urlEventId}`);

            // Check if the creator session is recent (within last 24 hours)
            const isRecentCreator = creatorTime !== null && (Date.now() - parseInt(creatorTime)) < (24 * 60 * 60 * 1000);

            // User is creator if they have sessionStorage OR if they have recent localStorage
            // Fallback: if localStorage exists but no timestamp, assume they're the creator (for backward compatibility)
            const isCreator = hasCreatorSession || (hasCreatorLocalStorage && isRecentCreator) || (hasCreatorLocalStorage && !creatorTime);

            // Debug logging to troubleshoot the issue
            console.log('Event creator check:', {
                urlEventId,
                hasCreatorSession,
                hasCreatorLocalStorage,
                isRecentCreator,
                isCreator,
                sessionStorageValue: sessionStorage.getItem(`is-creator-${urlEventId}`),
                localStorageValue: localStorage.getItem(`event-creator-${urlEventId}`),
                creatorTime: localStorage.getItem(`creator-time-${urlEventId}`)
            });
            setIsEventCreator(isCreator);

            try {
                const event = await apiService.getEvent(urlEventId);
                setEventData(event);
                setJoinCode(event.join_code);
                setPlayers(event.players || []);
                setAutoShuffle(event.auto_shuffle);

                // Generate QR code with join code as parameter
                const qrData = `${window.location.origin}/join-event?code=${event.join_code}`;
                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrCodeUrl(qrCodeDataURL);

                // Connect to WebSocket and join event room
                const socket = webSocketService.connect();

                // Set up real-time event listeners
                webSocketService.onPlayerJoined((data) => {
                    setPlayers(data.allPlayers);
                });

                webSocketService.onPlayerLeft((data) => {
                    setPlayers(data.allPlayers);
                });

                webSocketService.onPlayersShuffled((shuffledPlayers) => {
                    setPlayers(shuffledPlayers);
                });

                webSocketService.onPlayersReordered((reorderedPlayers) => {
                    console.log('Received players-reordered event:', reorderedPlayers);
                    setPlayers(reorderedPlayers);
                });

                // Join event room after listeners are set up
                webSocketService.joinEvent(urlEventId);
                console.log('WebSocket connected and joined event room:', urlEventId);

            } catch (error) {
                console.error('Error loading event:', error);
                alert('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        loadEventData();

        // Cleanup WebSocket connection on unmount
        return () => {
            if (urlEventId) {
                webSocketService.leaveEvent(urlEventId);
                // Remove specific event listeners
                webSocketService.offPlayerJoined();
                webSocketService.offPlayerLeft();
                webSocketService.offPlayersShuffled();
                webSocketService.offPlayersReordered();
            }
        };
    }, [urlEventId]);


    const handleAutoShuffleToggle = async (checked: boolean) => {
        if (!urlEventId) return;

        try {
            setAutoShuffle(checked);
            await apiService.updateEventAutoShuffle(urlEventId, checked);
        } catch (error) {
            console.error('Error updating auto shuffle:', error);
            // Revert the toggle if the API call failed
            setAutoShuffle(!checked);
            alert('Failed to update shuffle setting');
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleStart = () => {
        if (urlEventId) {
            navigate(`/event/${urlEventId}`);
        }
    };


    if (loading) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" sx={{ color: 'white' }}>
                    Loading event...
                </Typography>
            </Container>
        );
    }

    if (!eventData) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" sx={{ color: 'white' }}>
                    Event not found
                </Typography>
                <Button onClick={handleBack} sx={{ mt: 2, color: 'white' }}>
                    Go Back
                </Button>
            </Container>
        );
    }

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

                <FullscreenButton />
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
                                    Presentation Order ({players.length})
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
                                        maxHeight: 300,
                                        overflow: 'auto'
                                    }}>
                                        {isEventCreator ? (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext
                                                    items={players.map(player => player.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    <List>
                                                        {players.map((player, index) => (
                                                            <SortablePlayerItem
                                                                key={player.id}
                                                                player={player}
                                                                index={index}
                                                                canDrag={true}
                                                            />
                                                        ))}
                                                    </List>
                                                </SortableContext>
                                            </DndContext>
                                        ) : (
                                            <List>
                                                {players.map((player, index) => (
                                                    <SortablePlayerItem
                                                        key={player.id}
                                                        player={player}
                                                        index={index}
                                                        canDrag={false}
                                                    />
                                                ))}
                                            </List>
                                        )}
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
                                {/* Auto Shuffle Toggle - Only show for event creator */}
                                {isEventCreator && (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={autoShuffle}
                                                    onChange={(e) => handleAutoShuffleToggle(e.target.checked)}
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
                                )}

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
