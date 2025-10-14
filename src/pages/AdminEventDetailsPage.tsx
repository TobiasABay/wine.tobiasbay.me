import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import {
    Box,
    Typography,
    Container,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';

interface WineData {
    success: boolean;
    event_id: string;
    players: Array<{
        id: string;
        name: string;
        presentation_order: number;
    }>;
    categories: Array<{
        id: string;
        guessing_element: string;
        difficulty_factor: string;
    }>;
    wine_answers: Array<{
        player_id: string;
        player_name: string;
        presentation_order: number;
        answers: Array<{
            category_id: string;
            wine_answer: string;
        }>;
    }>;
    wine_guesses: Array<{
        player_id: string;
        player_name: string;
        guesses: Array<{
            category_id: string;
            guess: string;
            wine_number: number;
        }>;
    }>;
}

export default function AdminEventDetailsPage() {
    const [wineData, setWineData] = useState<WineData | null>(null);
    const { user } = useUser();

    useEffect(() => {
        document.title = 'Wine Tasting - Admin';
    }, []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<{ playerId: string; categoryId: string; currentValue: string } | null>(null);
    const [newValue, setNewValue] = useState('');
    const [saving, setSaving] = useState(false);
    const { eventId } = useParams();

    useEffect(() => {
        if (eventId) {
            loadWineData();
        }
    }, [eventId]);

    const loadWineData = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAdminWineData(eventId!);

            if (data.success) {
                setWineData(data);
            } else {
                setError('Failed to load wine data');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load wine data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (playerId: string, categoryId: string, currentValue: string) => {
        setEditing({ playerId, categoryId, currentValue });
        setNewValue(currentValue);
    };

    const handleSave = async () => {
        if (!editing) return;

        try {
            setSaving(true);
            const result = await apiService.updateWineAnswer(
                editing.playerId,
                editing.categoryId,
                newValue
            );

            if (result.success) {
                setEditing(null);
                await loadWineData(); // Reload data
            } else {
                setError(result.error || 'Failed to update wine answer');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update wine answer');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(null);
        setNewValue('');
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
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!wineData) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="info">No wine data found</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                        Admin - Wine Data Debug
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Admin'}
                    </Typography>
                </Box>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
                Event: {wineData.event_id}
            </Typography>

            {/* Wine Answers Table */}
            <Paper sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    Wine Answers (What players submitted about their own wines)
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Player</TableCell>
                                {wineData.categories.map(category => (
                                    <TableCell key={category.id}>{category.guessing_element}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {wineData.wine_answers.map(player => (
                                <TableRow key={player.player_id}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                {player.player_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Order: {player.presentation_order}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    {wineData.categories.map(category => {
                                        const answer = player.answers.find(a => a.category_id === category.id);
                                        return (
                                            <TableCell key={category.id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2">
                                                        {answer?.wine_answer || 'Not set'}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Edit />}
                                                        onClick={() => handleEdit(
                                                            player.player_id,
                                                            category.id,
                                                            answer?.wine_answer || ''
                                                        )}
                                                    >
                                                        Edit
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Wine Guesses Table */}
            <Paper sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    Wine Guesses (What players guessed about other wines)
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Guessing Player</TableCell>
                                <TableCell>Target Wine</TableCell>
                                {wineData.categories.map(category => (
                                    <TableCell key={category.id}>{category.guessing_element}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {wineData.wine_guesses.map(guessingPlayer =>
                                wineData.players.map((targetPlayer, targetIndex) => (
                                    <TableRow key={`${guessingPlayer.player_id}-${targetPlayer.id}`}>
                                        {targetIndex === 0 && (
                                            <TableCell rowSpan={wineData.players.length}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                    {guessingPlayer.player_name}
                                                </Typography>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Typography variant="body2">
                                                {targetPlayer.name} (Order: {targetPlayer.presentation_order})
                                            </Typography>
                                        </TableCell>
                                        {wineData.categories.map(category => {
                                            const guess = guessingPlayer.guesses.find(
                                                g => g.category_id === category.id && g.wine_number === targetPlayer.presentation_order
                                            );
                                            const correctAnswer = wineData.wine_answers
                                                .find(p => p.player_id === targetPlayer.id)
                                                ?.answers.find(a => a.category_id === category.id);
                                            const isCorrect = guess && correctAnswer &&
                                                guess.guess.toLowerCase() === correctAnswer.wine_answer.toLowerCase();

                                            return (
                                                <TableCell key={category.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2">
                                                            {guess?.guess || 'No guess'}
                                                        </Typography>
                                                        {guess && (
                                                            <Chip
                                                                label={isCorrect ? 'Correct' : 'Incorrect'}
                                                                size="small"
                                                                color={isCorrect ? 'success' : 'error'}
                                                            />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Edit Dialog */}
            <Dialog open={!!editing} onClose={handleCancel} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Wine Answer</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Answer"
                        fullWidth
                        variant="outlined"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} startIcon={<Cancel />}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        startIcon={<Save />}
                        disabled={saving || !newValue.trim()}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
