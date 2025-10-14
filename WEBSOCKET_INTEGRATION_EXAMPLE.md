# WebSocket Integration Example

## Quick Start Example

Here's how to integrate WebSocket into your existing components:

### Example 1: Real-time Event Updates

Replace polling with WebSocket for real-time event updates:

```typescript
// Before: Using polling
import { useSmartPolling } from '../hooks/useSmartPolling';

function EventPage() {
    const [eventData, setEventData] = useState<Event | null>(null);

    useSmartPolling(async () => {
        const event = await apiService.getEvent(eventId);
        setEventData(event);
    }, { interval: 12000 });

    return <div>Event: {eventData?.name}</div>;
}

// After: Using WebSocket
import { useWebSocket } from '../hooks/useWebSocket';

function EventPage() {
    const [eventData, setEventData] = useState<Event | null>(null);

    // Initial data load
    useEffect(() => {
        apiService.getEvent(eventId).then(setEventData);
    }, [eventId]);

    // Real-time updates
    const { isConnected } = useWebSocket({
        eventId,
        onEventUpdate: (updatedEvent) => {
            setEventData(updatedEvent);
        },
        onPlayerJoined: (player) => {
            // Update player list
            setEventData(prev => prev ? {
                ...prev,
                players: [...prev.players, player]
            } : prev);
        },
    });

    return (
        <div>
            Event: {eventData?.name}
            {isConnected && <span>🟢 Live</span>}
        </div>
    );
}
```

### Example 2: Real-time Score Updates

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function PlayerScoringPage() {
    const [scores, setScores] = useState<Score[]>([]);

    // Initial data load
    useEffect(() => {
        apiService.getWineScores(eventId).then(data => {
            setScores(data.allScores);
        });
    }, [eventId]);

    // Real-time score updates
    const { isConnected } = useWebSocket({
        eventId,
        onScoreSubmitted: (newScore) => {
            setScores(prev => [...prev, newScore]);
        },
        onWineChanged: (data) => {
            console.log('Wine changed to:', data.wineNumber);
        },
    });

    return (
        <div>
            <h2>Scores {isConnected && '🟢'}</h2>
            <ul>
                {scores.map(score => (
                    <li key={score.id}>{score.score}</li>
                ))}
            </ul>
        </div>
    );
}
```

### Example 3: Admin Real-time Dashboard

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function AdminEventDetailsPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [livePlayerCount, setLivePlayerCount] = useState(0);

    const { isConnected, status } = useWebSocket({
        eventId,
        onConnectionStatusChange: (newStatus) => {
            console.log('WebSocket status:', newStatus);
        },
        onEventUpdate: (updatedEvent) => {
            setEvent(updatedEvent);
        },
        onPlayerJoined: (player) => {
            setLivePlayerCount(prev => prev + 1);
            // Show notification
            toast.success(`${player.name} joined!`);
        },
        onPlayerLeft: (player) => {
            setLivePlayerCount(prev => Math.max(0, prev - 1));
            toast.info(`${player.name} left`);
        },
        onScoreSubmitted: (score) => {
            // Update score display
            console.log('New score:', score);
        },
        onEventStarted: (data) => {
            toast.success('Event started!');
            setEvent(prev => prev ? { ...prev, event_started: true } : prev);
        },
    });

    return (
        <div>
            <h1>{event?.name}</h1>
            <div>
                Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                {status.socketId && <small> (ID: {status.socketId})</small>}
            </div>
            <div>Live Players: {livePlayerCount}</div>
        </div>
    );
}
```

## Server-Side Event Emission

Update your backend routes to emit events when data changes:

### Example: Player Joins Event

```javascript
// In backend/routes/players.js

router.post('/join', async (req, res) => {
    const { joinCode, playerName, deviceId } = req.body;
    
    try {
        // ... existing logic to add player ...
        
        // Get Socket.IO instance
        const io = req.app.get('io');
        
        // Emit event to all clients in the event room
        io.to(`event-${eventId}`).emit('player-joined', {
            id: playerId,
            name: playerName,
            presentation_order: presentationOrder,
            joined_at: new Date().toISOString()
        });
        
        res.json({ success: true, eventId, playerId, presentationOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Example: Score Submitted

```javascript
// In backend/routes/events.js

router.post('/:eventId/scores', async (req, res) => {
    const { eventId } = req.params;
    const { playerId, wineNumber, score } = req.body;
    
    try {
        // ... existing logic to save score ...
        
        const io = req.app.get('io');
        
        // Emit to all clients in event room
        io.to(`event-${eventId}`).emit('score-submitted', {
            id: scoreId,
            player_id: playerId,
            wine_number: wineNumber,
            score: score,
            player_name: playerName,
            created_at: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Score submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Example: Event Started

```javascript
// In backend/routes/events.js

router.post('/:eventId/start', async (req, res) => {
    const { eventId } = req.params;
    
    try {
        // ... existing logic to start event ...
        
        const io = req.app.get('io');
        
        // Emit to all clients in event room
        io.to(`event-${eventId}`).emit('event-started', {
            eventId,
            started_at: new Date().toISOString(),
            current_wine_number: 1
        });
        
        res.json({ success: true, message: 'Event started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Connection Status Indicator Component

Create a reusable connection indicator:

```typescript
// src/components/ConnectionIndicator.tsx
import { Chip } from '@mui/material';
import { Wifi, WifiOff } from '@mui/icons-material';

interface ConnectionIndicatorProps {
    isConnected: boolean;
    socketId?: string;
}

export function ConnectionIndicator({ isConnected, socketId }: ConnectionIndicatorProps) {
    return (
        <Chip
            icon={isConnected ? <Wifi /> : <WifiOff />}
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'default'}
            size="small"
            variant="outlined"
            title={socketId ? `Socket ID: ${socketId}` : undefined}
        />
    );
}

// Usage in any component
import { useWebSocket } from '../hooks/useWebSocket';
import { ConnectionIndicator } from '../components/ConnectionIndicator';

function MyComponent() {
    const { isConnected, status } = useWebSocket({ eventId });
    
    return (
        <div>
            <ConnectionIndicator 
                isConnected={isConnected} 
                socketId={status.socketId} 
            />
        </div>
    );
}
```

## Best Practices

### 1. Combine Initial Load with Real-time Updates

Always load initial data, then use WebSocket for updates:

```typescript
// ✅ Good
useEffect(() => {
    // Load initial data
    apiService.getData().then(setData);
}, []);

useWebSocket({
    eventId,
    onUpdate: (newData) => {
        // Apply incremental updates
        setData(prev => ({ ...prev, ...newData }));
    }
});

// ❌ Bad - relying only on WebSocket
useWebSocket({
    eventId,
    onUpdate: setData  // What if connection is slow?
});
```

### 2. Show Connection Status

Always show users the connection status:

```typescript
const { isConnected } = useWebSocket({ eventId });

return (
    <div>
        {isConnected ? '🟢 Live' : '🔴 Offline'}
        {/* Your content */}
    </div>
);
```

### 3. Handle Disconnections Gracefully

```typescript
const { isConnected } = useWebSocket({
    eventId,
    onConnectionStatusChange: (status) => {
        if (!status.connected) {
            // Maybe show a notification
            toast.warning('Connection lost. Trying to reconnect...');
        } else {
            // Refresh data after reconnection
            refreshData();
            toast.success('Connected!');
        }
    }
});
```

### 4. Clean Up Event Listeners

The `useWebSocket` hook automatically cleans up, but if using the service directly:

```typescript
useEffect(() => {
    const handleUpdate = (data) => {
        console.log('Update:', data);
    };
    
    websocketService.on('event-update', handleUpdate);
    
    return () => {
        websocketService.off('event-update', handleUpdate);
    };
}, []);
```

## Debugging

### Enable Verbose Logging

The WebSocket service already includes detailed console logging. Open browser DevTools to see:

- Connection events
- Room join/leave
- Event emissions
- Errors and reconnection attempts

### Check Backend Logs

The backend also logs all WebSocket activity:

```
Client connected: abc123
Client abc123 joined event test-event-123
Client disconnected: abc123
```

### Test with Multiple Clients

Open multiple browser tabs to test multi-client behavior:

1. Tab 1: Join event room
2. Tab 2: Join same event room
3. Tab 1: Submit a score
4. Tab 2: Should receive the score update immediately

## Migration Path

### Phase 1: Add WebSocket Alongside Polling
- Keep existing polling
- Add WebSocket listeners
- Verify both receive updates

### Phase 2: Switch to WebSocket Primary
- Use WebSocket as primary update mechanism
- Keep polling as fallback with longer interval

### Phase 3: Remove Polling
- Remove `useSmartPolling` where WebSocket is used
- Keep polling only for non-real-time data

### Phase 4: Optimize
- Fine-tune reconnection settings
- Add connection pooling
- Implement event batching

## Summary

WebSocket integration is straightforward:

1. Use `useWebSocket` hook in components
2. Provide `eventId` to join room
3. Add callbacks for events you care about
4. Emit events from backend when data changes
5. Show connection status to users

The implementation is backward compatible - you can add WebSocket incrementally without breaking existing functionality.

---

**Ready to integrate?** Start with one component, test it, then expand to others!

