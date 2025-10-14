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
    TextField,
    Checkbox
} from '@mui/material';
import { UserButton, useUser } from '@clerk/clerk-react';
import { CheckCircle, Cancel, Delete, MoreVert, Edit, DeleteSweep, Restore, Block, Insights, Feedback, Wifi } from '@mui/icons-material';

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
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
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

    const handleReactivateClick = () => {
        if (selectedEvent) {
            handleReactivateEvent(selectedEvent.id, selectedEvent.name);
            handleMenuClose();
        }
    };

    const handleReactivateEvent = async (eventId: string, eventName: string) => {
        try {
            await apiService.reactivateEvent(eventId);

            // Reload events to show updated status
            await loadEvents();

            setSnackbarMessage(`Event "${eventName}" reactivated successfully`);
            setSnackbarOpen(true);
        } catch (err: any) {
            setError(err.message || 'Failed to reactivate event');
            setSnackbarMessage('Failed to reactivate event');
            setSnackbarOpen(true);
        }
    };

    const handleDeactivateClick = () => {
        if (selectedEvent) {
            handleDeactivateEvent(selectedEvent.id, selectedEvent.name);
            handleMenuClose();
        }
    };

    const handleDeactivateEvent = async (eventId: string, eventName: string) => {
        try {
            await apiService.deactivateEvent(eventId);

            // Reload events to show updated status
            await loadEvents();

            setSnackbarMessage(`Event "${eventName}" deactivated successfully`);
            setSnackbarOpen(true);
        } catch (err: any) {
            setError(err.message || 'Failed to deactivate event');
            setSnackbarMessage('Failed to deactivate event');
            setSnackbarOpen(true);
        }
    };

    // Multi-select handlers
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedEvents(events.map(e => e.id));
        } else {
            setSelectedEvents([]);
        }
    };

    const handleSelectEvent = (eventId: string, index: number, shiftKey: boolean = false) => {
        if (shiftKey && lastSelectedIndex !== null) {
            // Range selection with Shift
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const rangeIds = events.slice(start, end + 1).map(e => e.id);

            setSelectedEvents(prev => {
                // Merge with existing selection
                const newSelection = new Set([...prev, ...rangeIds]);
                return Array.from(newSelection);
            });
        } else {
            // Normal toggle selection
            setSelectedEvents(prev => {
                if (prev.includes(eventId)) {
                    return prev.filter(id => id !== eventId);
                } else {
                    return [...prev, eventId];
                }
            });
            setLastSelectedIndex(index);
        }
    };

    const handleBulkDeleteClick = () => {
        setBulkDeleteDialogOpen(true);
    };

    const handleBulkDeleteCancel = () => {
        setBulkDeleteDialogOpen(false);
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            setDeleting(true);

            // Delete all selected events
            await Promise.all(selectedEvents.map(eventId => apiService.deleteEvent(eventId)));

            // Remove deleted events from the list
            setEvents(events.filter(e => !selectedEvents.includes(e.id)));

            setSnackbarMessage(`${selectedEvents.length} event(s) deleted successfully`);
            setSnackbarOpen(true);
            setBulkDeleteDialogOpen(false);
            setSelectedEvents([]);
        } catch (err: any) {
            setError(err.message || 'Failed to delete events');
            setSnackbarMessage('Failed to delete some events');
            setSnackbarOpen(true);
        } finally {
            setDeleting(false);
        }
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Insights />}
                        sx={{ textTransform: 'none' }}
                    >
                        Insights
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Feedback />}
                        sx={{ textTransform: 'none' }}
                    >
                        Feedback
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Wifi />}
                        onClick={() => navigate('/ws-test')}
                        sx={{ textTransform: 'none' }}
                    >
                        WebSocket
                    </Button>
                    <UserButton afterSignOutUrl="/" />
                </Box>
            </Box>

            {/* Bulk Actions Toolbar */}
            {selectedEvents.length > 0 && (
                <Paper
                    elevation={3}
                    sx={{
                        mb: 2,
                        p: 2.5,
                        backgroundColor: '#e3f2fd',
                        border: '2px solid',
                        borderColor: '#1976d2',
                        borderRadius: 2
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                                ✓ {selectedEvents.length} event(s) selected
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Hold Shift and click to select a range
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSelectedEvents([]);
                                    setLastSelectedIndex(null);
                                }}
                                sx={{ fontWeight: 'bold' }}
                            >
                                Clear Selection
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteSweep />}
                                onClick={handleBulkDeleteClick}
                                sx={{ fontWeight: 'bold', px: 3 }}
                            >
                                Delete Selected ({selectedEvents.length})
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Events Count */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    Total Events: {events.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    💡 Tip: Hold Shift to select a range
                </Typography>
            </Box>

            {/* Events Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                                    <Checkbox
                                        indeterminate={selectedEvents.length > 0 && selectedEvents.length < events.length}
                                        checked={events.length > 0 && selectedEvents.length === events.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
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
                                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                            No events found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event, index) => (
                                    <TableRow
                                        key={event.id}
                                        hover
                                        selected={selectedEvents.includes(event.id)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedEvents.includes(event.id)}
                                                onChange={(changeEvent) => {
                                                    const isShiftPressed = (changeEvent.nativeEvent as any).shiftKey || false;
                                                    handleSelectEvent(event.id, index, isShiftPressed);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
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
                {selectedEvent && !selectedEvent.is_active && (
                    <MenuItem onClick={handleReactivateClick} sx={{ color: 'success.main' }}>
                        <ListItemIcon>
                            <Restore fontSize="small" sx={{ color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText>Reactivate</ListItemText>
                    </MenuItem>
                )}
                {selectedEvent && selectedEvent.is_active && (
                    <MenuItem onClick={handleDeactivateClick} sx={{ color: 'warning.main' }}>
                        <ListItemIcon>
                            <Block fontSize="small" sx={{ color: 'warning.main' }} />
                        </ListItemIcon>
                        <ListItemText>Deactivate</ListItemText>
                    </MenuItem>
                )}
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

            {/* Bulk Delete Confirmation Dialog */}
            <Dialog
                open={bulkDeleteDialogOpen}
                onClose={handleBulkDeleteCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Multiple Events</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{selectedEvents.length} event(s)</strong>?
                        <br /><br />
                        This action will permanently delete:
                        <ul style={{ marginTop: '8px', marginBottom: '8px' }}>
                            <li>All selected events and their details</li>
                            <li>All players and their wine submissions</li>
                            <li>All wine scores and guesses</li>
                        </ul>
                        <strong>This action cannot be undone.</strong>
                        <br /><br />
                        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1, maxHeight: '200px', overflow: 'auto' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Events to be deleted:
                            </Typography>
                            {selectedEvents.map(eventId => {
                                const event = events.find(e => e.id === eventId);
                                return event ? (
                                    <Typography key={eventId} variant="body2" sx={{ mb: 0.5 }}>
                                        • {event.name}
                                    </Typography>
                                ) : null;
                            })}
                        </Box>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBulkDeleteCancel} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBulkDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteSweep />}
                    >
                        {deleting ? `Deleting ${selectedEvents.length} event(s)...` : `Delete ${selectedEvents.length} Event(s)`}
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

