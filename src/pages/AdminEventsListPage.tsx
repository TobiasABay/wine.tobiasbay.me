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
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Snackbar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    TextField
} from '@mui/material';
import { UserButton, useUser } from '@clerk/clerk-react';
import { CheckCircle, Cancel, Delete, MoreVert, Edit } from '@mui/icons-material';

export default function AdminEventsListPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        date: '',
        location: '',
        wine_type: '',
        max_participants: 0,
        description: '',
        budget: '',
        duration: '',
        wine_notes: ''
    });
    const [saving, setSaving] = useState(false);
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

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, selectedEvent: Event) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedEvent(selectedEvent);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedEvent(null);
    };

    const handleEditClick = () => {
        if (selectedEvent) {
            // Populate form with current event data
            setEditFormData({
                name: selectedEvent.name,
                date: selectedEvent.date.split('T')[0], // Convert to YYYY-MM-DD format
                location: selectedEvent.location,
                wine_type: selectedEvent.wine_type,
                max_participants: selectedEvent.max_participants,
                description: selectedEvent.description || '',
                budget: selectedEvent.budget || '',
                duration: selectedEvent.duration || '',
                wine_notes: selectedEvent.wine_notes || ''
            });
            setEditDialogOpen(true);
            handleMenuClose();
        }
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setSelectedEvent(null);
    };

    const handleEditFormChange = (field: string, value: string | number) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditSave = async () => {
        if (!selectedEvent) return;

        try {
            setSaving(true);
            await apiService.updateEvent(selectedEvent.id, {
                name: editFormData.name,
                date: editFormData.date,
                location: editFormData.location,
                wineType: editFormData.wine_type,
                maxParticipants: editFormData.max_participants,
                description: editFormData.description,
                budget: editFormData.budget,
                duration: editFormData.duration,
                wineNotes: editFormData.wine_notes
            });

            // Reload events to show updated data
            await loadEvents();

            setSnackbarMessage(`Event "${editFormData.name}" updated successfully`);
            setSnackbarOpen(true);
            handleEditDialogClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update event');
            setSnackbarMessage('Failed to update event');
            setSnackbarOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = () => {
        if (selectedEvent) {
            setEventToDelete(selectedEvent);
            setDeleteDialogOpen(true);
            handleMenuClose();
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setEventToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!eventToDelete) return;

        try {
            setDeleting(true);
            await apiService.deleteEvent(eventToDelete.id);

            // Remove the event from the list
            setEvents(events.filter(e => e.id !== eventToDelete.id));

            setSnackbarMessage(`Event "${eventToDelete.name}" deleted successfully`);
            setSnackbarOpen(true);
            setDeleteDialogOpen(false);
            setEventToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete event');
            setSnackbarMessage('Failed to delete event');
            setSnackbarOpen(true);
        } finally {
            setDeleting(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
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
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
                                        <TableCell>
                                            <IconButton
                                                onClick={(e) => handleMenuOpen(e, event)}
                                                size="small"
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Actions Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={handleEditDialogClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit Event</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Event Name"
                            value={editFormData.name}
                            onChange={(e) => handleEditFormChange('name', e.target.value)}
                            required
                        />
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                fullWidth
                                label="Date"
                                type="date"
                                value={editFormData.date}
                                onChange={(e) => handleEditFormChange('date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Max Participants"
                                type="number"
                                value={editFormData.max_participants}
                                onChange={(e) => handleEditFormChange('max_participants', parseInt(e.target.value))}
                                required
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                fullWidth
                                label="Wine Type"
                                value={editFormData.wine_type}
                                onChange={(e) => handleEditFormChange('wine_type', e.target.value)}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Location"
                                value={editFormData.location}
                                onChange={(e) => handleEditFormChange('location', e.target.value)}
                                required
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                fullWidth
                                label="Budget"
                                value={editFormData.budget}
                                onChange={(e) => handleEditFormChange('budget', e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Duration"
                                value={editFormData.duration}
                                onChange={(e) => handleEditFormChange('duration', e.target.value)}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={editFormData.description}
                            onChange={(e) => handleEditFormChange('description', e.target.value)}
                        />
                        <TextField
                            fullWidth
                            label="Wine Notes"
                            multiline
                            rows={3}
                            value={editFormData.wine_notes}
                            onChange={(e) => handleEditFormChange('wine_notes', e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditDialogClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditSave}
                        variant="contained"
                        disabled={saving || !editFormData.name || !editFormData.date}
                        startIcon={saving ? <CircularProgress size={16} /> : null}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Event</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the event <strong>"{eventToDelete?.name}"</strong>?
                        <br /><br />
                        This action will permanently delete:
                        <ul style={{ marginTop: '8px', marginBottom: '8px' }}>
                            <li>The event and all its details</li>
                            <li>All players and their wine submissions</li>
                            <li>All wine scores and guesses</li>
                        </ul>
                        <strong>This action cannot be undone.</strong>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
                    >
                        {deleting ? 'Deleting...' : 'Delete Event'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
            />
        </Container>
    );
}

