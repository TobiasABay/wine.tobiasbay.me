import { Paper, Typography, Box, Chip, List, ListItem, ListItemText } from "@mui/material";
import { Event, People, CheckCircle } from "@mui/icons-material";

interface ActiveEventsInsightProps {
    data: Array<{
        id: string;
        name: string;
        player_count: number;
        max_participants: number;
        event_started: boolean;
        created_at: string;
    }>;
}

export default function ActiveEventsInsight({ data }: ActiveEventsInsightProps) {
    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Event sx={{ color: '#4caf50' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Active Events
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Currently active wine tasting events
            </Typography>

            {data.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No active events right now
                </Typography>
            ) : (
                <List sx={{ p: 0 }}>
                    {data.map((event) => (
                        <ListItem
                            key={event.id}
                            sx={{
                                backgroundColor: '#f5f5f5',
                                borderRadius: 2,
                                mb: 1,
                                border: '1px solid #e0e0e0'
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {event.name}
                                        </Typography>
                                        {event.event_started && (
                                            <Chip
                                                icon={<CheckCircle sx={{ fontSize: '0.9rem !important' }} />}
                                                label="Started"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                    backgroundColor: '#4caf50',
                                                    color: 'white'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            icon={<People sx={{ fontSize: '0.9rem !important' }} />}
                                            label={`${event.player_count} / ${event.max_participants}`}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                backgroundColor: event.player_count >= event.max_participants ? '#4caf50' : '#2196f3',
                                                color: 'white'
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Created {new Date(event.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}

