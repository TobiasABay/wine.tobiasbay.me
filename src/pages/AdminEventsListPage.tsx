import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Event } from '../services/api';
import {
    Box,
    Typography,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Link,
    Chip
} from '@mui/material';
import { UserButton, useUser } from '@clerk/clerk-react';
import { CheckCircle, Cancel } from '@mui/icons-material';

export default function AdminEventsListPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Wine Tasting - Admin Events';
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const eventsData = await apiService.getAllEvents();
            // Sort by created_at descending (most recent first)
            const sortedEvents = eventsData.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setEvents(sortedEvents);
        } catch (err: any) {
            setError(err.message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (eventId: string) => {
        navigate(`/admin/${eventId}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header with User Info */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Admin - All Events
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Admin'}
                    </Typography>
                </Box>
                <UserButton afterSignOutUrl="/" />
            </Box>

            {/* Events Count */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    Total Events: {events.length}
                </Typography>
            </Box>

            {/* Events Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Event Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Event ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Join Code</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Created</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Players</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                            No events found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow
                                        key={event.id}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {event.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {event.wine_type}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEventClick(event.id);
                                                }}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem',
                                                    textDecoration: 'none',
                                                    '&:hover': {
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                            >
                                                {event.id}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.join_code}
                                                size="small"
                                                sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(event.created_at).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {new Date(event.created_at).toLocaleTimeString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(event.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{event.location}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={`${event.players?.length || 0} / ${event.max_participants}`}
                                                size="small"
                                                color={event.players?.length >= event.max_participants ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Chip
                                                    icon={event.is_active ? <CheckCircle /> : <Cancel />}
                                                    label={event.is_active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={event.is_active ? 'success' : 'default'}
                                                    sx={{ width: 'fit-content' }}
                                                />
                                                {event.event_started && (
                                                    <Chip
                                                        label="Started"
                                                        size="small"
                                                        color="info"
                                                        sx={{ width: 'fit-content' }}
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
}

