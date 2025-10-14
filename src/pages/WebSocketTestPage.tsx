import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip, Button, TextField, Alert, Stack } from '@mui/material';
import { CheckCircle, Error, Wifi } from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';
import { websocketService } from '../services/websocket';

export default function WebSocketTestPage() {
    const [testEventId, setTestEventId] = useState('test-event-123');
    const [joinedEventId, setJoinedEventId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    };

    const { status, isConnected } = useWebSocket({
        eventId: joinedEventId || undefined,
        onConnectionStatusChange: (newStatus) => {
            addLog(`Connection status changed: ${newStatus.connected ? 'Connected' : 'Disconnected'} (ID: ${newStatus.socketId || 'N/A'})`);
        },
        onEventUpdate: (data) => {
            addLog(`Event update received: ${JSON.stringify(data)}`);
        },
        onPlayerJoined: (data) => {
            addLog(`Player joined: ${JSON.stringify(data)}`);
        },
        onPlayerLeft: (data) => {
            addLog(`Player left: ${JSON.stringify(data)}`);
        },
        onPlayerReady: (data) => {
            addLog(`Player ready: ${JSON.stringify(data)}`);
        },
        onScoreSubmitted: (data) => {
            addLog(`Score submitted: ${JSON.stringify(data)}`);
        },
        onGuessSubmitted: (data) => {
            addLog(`Guess submitted: ${JSON.stringify(data)}`);
        },
        onWineChanged: (data) => {
            addLog(`Wine changed: ${JSON.stringify(data)}`);
        },
        onEventStarted: (data) => {
            addLog(`Event started: ${JSON.stringify(data)}`);
        },
    });

    useEffect(() => {
        addLog('WebSocket test page loaded');
    }, []);

    const handleJoinEvent = () => {
        if (testEventId.trim()) {
            setJoinedEventId(testEventId.trim());
            addLog(`Joining event: ${testEventId.trim()}`);
        }
    };

    const handleLeaveEvent = () => {
        if (joinedEventId) {
            addLog(`Leaving event: ${joinedEventId}`);
            setJoinedEventId(null);
        }
    };

    const handleDisconnect = () => {
        websocketService.disconnect();
        addLog('Manually disconnected WebSocket');
    };

    const handleClearLogs = () => {
        setLogs([]);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                WebSocket Connection Test
            </Typography>

            {/* Connection Status */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Typography variant="h6">Connection Status:</Typography>
                    <Chip
                        icon={isConnected ? <CheckCircle /> : <Error />}
                        label={isConnected ? 'Connected' : 'Disconnected'}
                        color={isConnected ? 'success' : 'error'}
                        variant="filled"
                    />
                    {status.socketId && (
                        <Chip
                            icon={<Wifi />}
                            label={`Socket ID: ${status.socketId}`}
                            variant="outlined"
                        />
                    )}
                </Stack>

                {status.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Error: {status.error}
                    </Alert>
                )}

                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDisconnect}
                        disabled={!isConnected}
                    >
                        Disconnect
                    </Button>
                </Stack>
            </Paper>

            {/* Event Room Controls */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Event Room
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <TextField
                        label="Event ID"
                        value={testEventId}
                        onChange={(e) => setTestEventId(e.target.value)}
                        size="small"
                        disabled={!!joinedEventId}
                        sx={{ flexGrow: 1 }}
                    />
                    {joinedEventId ? (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleLeaveEvent}
                        >
                            Leave Event
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleJoinEvent}
                            disabled={!isConnected || !testEventId.trim()}
                        >
                            Join Event
                        </Button>
                    )}
                </Stack>

                {joinedEventId && (
                    <Alert severity="info" icon={<Wifi />}>
                        Currently in event room: <strong>{joinedEventId}</strong>
                    </Alert>
                )}
            </Paper>

            {/* Event Logs */}
            <Paper sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Event Log ({logs.length})
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClearLogs}
                    >
                        Clear Logs
                    </Button>
                </Stack>

                <Box
                    sx={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        p: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                    }}
                >
                    {logs.length === 0 ? (
                        <Typography color="text.secondary">No logs yet...</Typography>
                    ) : (
                        logs.map((log, index) => (
                            <Box key={index} sx={{ mb: 0.5 }}>
                                {log}
                            </Box>
                        ))
                    )}
                </Box>
            </Paper>

            {/* Instructions */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                    Test Instructions
                </Typography>
                <Typography variant="body2" component="div">
                    <ol>
                        <li>Verify that the connection status shows "Connected" with a green chip</li>
                        <li>Note your Socket ID in the connection status</li>
                        <li>Enter an event ID (or use the default "test-event-123")</li>
                        <li>Click "Join Event" to join the event room</li>
                        <li>Open the browser console to see detailed WebSocket logs</li>
                        <li>Open another browser tab/window with this page to test multi-client behavior</li>
                        <li>Watch the event log for real-time messages</li>
                        <li>Try disconnecting and observe the reconnection behavior</li>
                    </ol>
                </Typography>
            </Paper>
        </Box>
    );
}

