import { UserButton, useUser } from "@clerk/clerk-react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip
} from "@mui/material";
import { useState, useEffect } from "react";
import { apiService } from "../../services/api";

interface FeedbackItem {
    id: string;
    event_id: string;
    event_name: string;
    player_id: string;
    player_name: string;
    feedback: string;
    created_at: string;
}

export default function AdminFeedbackPage() {
    const { user } = useUser();
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = 'Wine Tasting - Admin Feedback';
        loadFeedback();
    }, []);

    const loadFeedback = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllFeedback();
            const feedbackList = response.feedback || [];
            setFeedback(feedbackList);

            // Update the last viewed count in localStorage when feedback is loaded
            localStorage.setItem('admin-last-viewed-feedback-count', feedbackList.length.toString());
        } catch (err: any) {
            setError(err.message || 'Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
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
                        Player Feedback
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Admin'}
                    </Typography>
                </Box>
                <UserButton afterSignOutUrl="/" />
            </Box>

            {/* Feedback Count */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    Total Feedback: {feedback.length}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Feedback Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Event Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Player Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100', width: '50%' }}>Feedback</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>Submitted</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {feedback.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                            No feedback submitted yet
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                feedback.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {item.event_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {item.event_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.player_name}
                                                size="small"
                                                sx={{ fontWeight: 'medium' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {item.feedback}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {new Date(item.created_at).toLocaleTimeString()}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
}