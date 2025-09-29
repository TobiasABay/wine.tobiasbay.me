# Wine Tasting Event Backend

This is the backend server for the wine tasting event application.

## Features

- **Event Management**: Create and manage wine tasting events
- **Player Management**: Handle player registration and presentation order
- **Real-time Updates**: WebSocket support for live player updates
- **Database**: SQLite database for persistent storage
- **Auto Shuffle**: Automatic player order shuffling
- **Join Codes**: 6-digit join codes for easy event access

## Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
npm run init-db
```

3. Start the development server:
```bash
npm run dev
```

4. Or start the production server:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Events
- `POST /api/events` - Create a new event
- `GET /api/events/:eventId` - Get event by ID
- `GET /api/events/join/:joinCode` - Get event by join code
- `PUT /api/events/:eventId/shuffle` - Update auto shuffle setting
- `GET /api/events/:eventId/players` - Get players for an event
- `POST /api/events/:eventId/shuffle-players` - Manually shuffle players

### Players
- `POST /api/players/join` - Join an event
- `GET /api/players/event/:eventId` - Get players for an event
- `DELETE /api/players/:playerId` - Remove a player
- `PUT /api/players/:playerId/order` - Update player presentation order

### Health Check
- `GET /api/health` - Server health check

## WebSocket Events

### Client to Server
- `join-event` - Join an event room
- `leave-event` - Leave an event room

### Server to Client
- `event-created` - New event created
- `player-joined` - Player joined an event
- `player-left` - Player left an event
- `players-shuffled` - Players were shuffled
- `player-order-updated` - Player order was updated

## Database Schema

### Events Table
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `date` (TEXT NOT NULL)
- `max_participants` (INTEGER NOT NULL)
- `wine_type` (TEXT NOT NULL)
- `location` (TEXT NOT NULL)
- `description` (TEXT)
- `budget` (TEXT)
- `duration` (TEXT)
- `wine_notes` (TEXT)
- `join_code` (TEXT UNIQUE NOT NULL)
- `is_active` (BOOLEAN DEFAULT 1)
- `auto_shuffle` (BOOLEAN DEFAULT 0)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### Players Table
- `id` (TEXT PRIMARY KEY)
- `event_id` (TEXT NOT NULL)
- `name` (TEXT NOT NULL)
- `presentation_order` (INTEGER)
- `joined_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `is_active` (BOOLEAN DEFAULT 1)

### Wine Categories Table
- `id` (TEXT PRIMARY KEY)
- `event_id` (TEXT NOT NULL)
- `guessing_element` (TEXT NOT NULL)
- `difficulty_factor` (TEXT NOT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Development

The server uses:
- **Express.js** for the web framework
- **SQLite3** for the database
- **Socket.io** for real-time communication
- **UUID** for generating unique IDs
- **CORS** for cross-origin requests
- **Helmet** for security headers
