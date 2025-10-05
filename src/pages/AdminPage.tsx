import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

export default function AdminPage() {
    const [wineData, setWineData] = useState<WineData | null>(null);
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
            const response = await fetch(`/api/admin/events/${eventId}/wine-data`);
            const data = await response.json();

            if (data.success) {
                setWineData(data);
            } else {
                setError(data.error || 'Failed to load wine data');
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
            const response = await fetch('/api/admin/wine-answer', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: editing.playerId,
                    categoryId: editing.categoryId,
                    newAnswer: newValue
                })
            });

            const result = await response.json();

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
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                Admin - Wine Data Debug
            </Typography>

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
                            {wineData.wine_guesses.map(guessingPlayer => (
                                <TableRow key={guessingPlayer.player_id}>
                                    <TableCell rowSpan={wineData.players.length}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {guessingPlayer.player_name}
                                        </Typography>
                                    </TableCell>
                                    {wineData.players.map((targetPlayer, index) => (
                                        <React.Fragment key={targetPlayer.id}>
                                            {index > 0 && <TableRow />}
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
                                        </React.Fragment>
                                    ))}
                                </TableRow>
                            ))}
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
