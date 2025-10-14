# WebSocket Implementation

## Overview

This document describes the WebSocket implementation for the Wine Tasting Event application. The implementation uses Socket.IO for real-time bidirectional communication between the client and server.

## Architecture

### Backend (Server)

**Location:** `/backend/server.js`

The backend uses Socket.IO server to handle WebSocket connections:

- **Port:** 3001 (configurable via `config.js`)
- **Transport:** WebSocket with polling fallback
- **CORS:** Configured to allow localhost and production frontend URLs

#### Server Events

The server listens for and emits the following events:

**Client → Server:**
- `join-event`: Join a specific event room
- `leave-event`: Leave a specific event room

**Server → Client:**
- `connection`: New client connected
- `disconnect`: Client disconnected
- `event-update`: Event data has been updated
- `player-joined`: New player joined the event
- `player-left`: Player left the event
- `player-ready`: Player ready status changed
- `score-submitted`: Wine score submitted
- `guess-submitted`: Wine guess submitted
- `wine-changed`: Current wine changed
- `event-started`: Event has started

#### Event Rooms

The server uses Socket.IO rooms to organize connections by event ID:
- Room format: `event-{eventId}`
- Clients automatically join/leave rooms when joining/leaving events
- Broadcasting to rooms ensures only relevant clients receive updates

### Frontend (Client)

#### WebSocket Service

**Location:** `/src/services/websocket.ts`

A singleton service that manages the WebSocket connection:

```typescript
import { websocketService } from '../services/websocket';

// Join an event room
websocketService.joinEvent(eventId);

// Leave an event room
websocketService.leaveEvent(eventId);

// Listen for events
websocketService.on('event-update', (data) => {
    console.log('Event updated:', data);
});

// Remove event listeners
websocketService.off('event-update', callback);

// Check connection status
const isConnected = websocketService.isConnected();

// Get socket instance
const socket = websocketService.getSocket();
```

**Features:**
- Automatic reconnection with exponential backoff
- Event listener management
- Connection status monitoring
- Singleton pattern for global access

#### WebSocket Hook

**Location:** `/src/hooks/useWebSocket.ts`

A React hook for easy WebSocket integration in components:

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function MyComponent() {
    const { status, isConnected } = useWebSocket({
        eventId: 'event-123',
        onEventUpdate: (data) => {
            console.log('Event updated:', data);
        },
        onPlayerJoined: (data) => {
            console.log('Player joined:', data);
        },
        onConnectionStatusChange: (status) => {
            console.log('Connection status:', status);
        },
    });

    return (
        <div>
            Status: {isConnected ? 'Connected' : 'Disconnected'}
            {status.socketId && <p>Socket ID: {status.socketId}</p>}
        </div>
    );
}
```

**Hook Options:**
- `eventId`: Automatically join/leave event room
- Event callbacks for all server events
- Connection status tracking
- Automatic cleanup on unmount

## Testing

### Automated Test

Run the automated WebSocket test:

```bash
node test-websocket.cjs
```

This test verifies:
1. Connection to the server
2. Joining an event room
3. Leaving an event room
4. Disconnection

Expected output:
```
🎉 All tests passed!
```

### Manual Testing (Browser)

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start

   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Open the test page:**
   Navigate to: `http://localhost:5173/ws-test`

3. **Test the connection:**
   - Verify "Connected" status with green chip
   - Note your Socket ID
   - Enter an event ID (or use default "test-event-123")
   - Click "Join Event"
   - Watch the event log for real-time messages

4. **Multi-client testing:**
   - Open multiple browser tabs/windows
   - Join the same event room
   - Observe events in all connected clients

5. **Reconnection testing:**
   - Click "Disconnect"
   - Observe automatic reconnection
   - Verify the event log shows reconnection attempts

### Browser Console Logs

The WebSocket service provides detailed console logging:

- ✅ Green checkmarks for successful operations
- ❌ Red X for errors
- 🔄 Rotating arrow for reconnection attempts
- 📡 Satellite for event updates
- 👤 User icon for player events
- 🍷 Wine glass for wine-related events

## Integration with Existing Features

### Polling Replacement

The existing `useSmartPolling` hook can be gradually replaced with WebSocket listeners:

**Before (Polling):**
```typescript
useSmartPolling(async () => {
    const event = await apiService.getEvent(eventId);
    setEventData(event);
}, { interval: 12000 });
```

**After (WebSocket):**
```typescript
useWebSocket({
    eventId,
    onEventUpdate: (data) => {
        setEventData(data);
    },
});
```

### Server-Side Updates

When data changes on the server, emit events to notify connected clients:

```javascript
// In backend routes
const io = req.app.get('io');

// Notify all clients in event room
io.to(`event-${eventId}`).emit('event-update', eventData);
io.to(`event-${eventId}`).emit('player-joined', playerData);
io.to(`event-${eventId}`).emit('score-submitted', scoreData);
```

## Configuration

### Backend Configuration

**File:** `/backend/config.js`

```javascript
module.exports = {
    PORT: process.env.PORT || 3001,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    NODE_ENV: process.env.NODE_ENV || "development"
};
```

### Frontend Configuration

**File:** `/src/services/websocket.ts`

```typescript
const WEBSOCKET_URL = isLocalhost 
    ? 'http://localhost:3001' 
    : 'https://api.wine.tobiasbay.me';
```

## Performance Considerations

### Advantages over Polling

1. **Real-time updates:** Instant notifications instead of periodic polling
2. **Reduced server load:** No unnecessary requests when no data changes
3. **Lower latency:** Sub-second update delivery
4. **Better user experience:** Immediate feedback on actions

### Connection Management

- Automatic reconnection on connection loss
- Exponential backoff to prevent server overload
- Connection pooling via Socket.IO
- Efficient room-based broadcasting

## Security

### CORS Configuration

The server is configured to accept connections from:
- Localhost on any port (development)
- Configured frontend URL (production)

### Future Enhancements

Consider implementing:
- Authentication middleware for Socket.IO
- Rate limiting for socket events
- Event validation and sanitization
- Encrypted WebSocket (WSS) in production

## Troubleshooting

### Connection Issues

1. **Check backend is running:**
   ```bash
   lsof -i :3001
   ```

2. **Check frontend is running:**
   ```bash
   lsof -i :5173
   ```

3. **Check browser console:**
   - Look for WebSocket connection logs
   - Check for CORS errors
   - Verify Socket.IO transport method

4. **Check backend logs:**
   - Look for "Client connected" messages
   - Verify room join/leave operations
   - Check for error messages

### Common Issues

**Issue:** "WebSocket connection failed"
- **Solution:** Ensure backend is running and accessible

**Issue:** "Not allowed by CORS"
- **Solution:** Add your frontend URL to CORS configuration in `backend/server.js`

**Issue:** "Max reconnection attempts reached"
- **Solution:** Check backend availability and network connectivity

**Issue:** Events not received
- **Solution:** Verify you've joined the event room with the correct event ID

## Next Steps

1. ✅ **Basic WebSocket infrastructure** - Complete
2. **Integrate with existing pages:**
   - Replace polling in EventPage
   - Replace polling in PlayerScoringPage
   - Replace polling in AdminEventDetailsPage
3. **Add server-side event emissions:**
   - Emit events when players join/leave
   - Emit events when scores are submitted
   - Emit events when event status changes
4. **Optimize performance:**
   - Remove unnecessary polling
   - Implement connection pooling
   - Add event batching for high-frequency updates
5. **Enhance security:**
   - Add authentication to Socket.IO
   - Implement rate limiting
   - Add event validation

## Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Socket.IO Server API](https://socket.io/docs/v4/server-api/)
- [WebSocket Test Page](http://localhost:5173/ws-test)

---

**Status:** ✅ Implemented and Tested
**Last Updated:** October 14, 2025
**Tested By:** Automated test script + Manual browser testing

