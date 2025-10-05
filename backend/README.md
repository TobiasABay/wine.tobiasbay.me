# Wine Tasting Event Backend

This is the backend server for the wine tasting event application, implemented as both a Node.js Express server and Cloudflare Workers for serverless deployment.

## 🏗️ Architecture

### Node.js Backend (Development)
- **Express.js** - Web framework
- **SQLite3** - Database
- **Socket.io** - Real-time communication
- **CORS** - Cross-origin requests
- **Helmet** - Security headers

### Cloudflare Workers (Production)
- **Serverless Functions** - API endpoints
- **D1 Database** - SQLite-compatible database
- **WebSocket** - Real-time communication
- **CORS** - Cross-origin requests

## 🚀 Setup

### Development (Node.js)
```bash
# Install dependencies
npm install

# Initialize the database
npm run init-db

# Start development server
npm run dev

# Start production server
npm start
```

### Production (Cloudflare Workers)
```bash
# Deploy to Cloudflare Workers
cd workers
npx wrangler deploy
```

The server runs on `http://localhost:3001` in development.

## 📊 Database Schema

### Events Table
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    max_participants INTEGER NOT NULL,
    wine_type TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    budget TEXT,
    duration TEXT,
    wine_notes TEXT,
    join_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    auto_shuffle BOOLEAN DEFAULT 0,
    event_started BOOLEAN DEFAULT 0,
    current_wine_number INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Players Table
```sql
CREATE TABLE players (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    presentation_order INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    is_ready BOOLEAN DEFAULT 0,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);
```

### Wine Categories Table
```sql
CREATE TABLE wine_categories (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    guessing_element TEXT NOT NULL,
    difficulty_factor TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);
```

### Player Wine Details Table
```sql
CREATE TABLE player_wine_details (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    wine_answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES wine_categories (id) ON DELETE CASCADE
);
```

### Wine Scores Table
```sql
CREATE TABLE wine_scores (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    wine_number INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
);
```

### Player Wine Guesses Table
```sql
CREATE TABLE player_wine_guesses (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    wine_number INTEGER NOT NULL,
    guess TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES wine_categories (id) ON DELETE CASCADE
);
```

## 🔗 API Endpoints

### Health & Debug
- `GET /api/health` - Server health check
- `GET /api/debug/database` - Database debug information
- `GET /api/debug/test-wine-answers` - Test wine answers
- `GET /api/debug/event/:eventId/categories` - Debug event categories

### Events
- `POST /api/events` - Create a new event
- `GET /api/events/list` - List all events
- `GET /api/events/:eventId` - Get event by ID
- `GET /api/events/join/:joinCode` - Get event by join code
- `PUT /api/events/:eventId/shuffle` - Update auto shuffle setting
- `POST /api/events/:eventId/start` - Start an event
- `PUT /api/events/:eventId/current-wine` - Update current wine number
- `GET /api/events/:eventId/wine-categories` - Get event wine categories
- `GET /api/events/:eventId/wine-answers` - Get event wine answers
- `GET /api/events/:eventId/wine-guesses` - Get event wine guesses
- `GET /api/events/:eventId/scores` - Get event scores
- `POST /api/events/:eventId/scores` - Submit wine scores
- `GET /api/events/:eventId/leaderboard` - Get final leaderboard
- `PUT /api/events/:eventId/players/order` - Update player presentation order

### Players
- `POST /api/players/join` - Join an event
- `GET /api/players/event/:eventId` - Get players for an event
- `PUT /api/players/:playerId/ready` - Mark player as ready
- `GET /api/players/:playerId/wine-details` - Get player wine details
- `POST /api/players/:playerId/wine-details` - Submit player wine details
- `POST /api/players/:playerId/wine-answers` - Submit wine answers
- `POST /api/players/:playerId/wine-guesses` - Submit wine guesses
- `GET /api/players/:playerId/wine-guesses` - Get player wine guesses

### Admin
- `GET /api/admin/events/:eventId/wine-data` - Get comprehensive wine data for admin
- `PUT /api/admin/wine-answer` - Update wine answer (admin only)

## 🔄 WebSocket Events

### Client to Server
- `join-event` - Join an event room
- `leave-event` - Leave an event room

### Server to Client
- `event-created` - New event created
- `player-joined` - Player joined an event
- `player-left` - Player left an event
- `players-shuffled` - Players were shuffled
- `player-order-updated` - Player order was updated
- `player-ready` - Player marked as ready
- `event-started` - Event has started
- `current-wine-updated` - Current wine number updated

## ⚙️ Environment Variables

### Development (.env)
```bash
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Production (Cloudflare Workers)
```bash
FRONTEND_URL=https://wine.tobiasbay.me
```

## 🎯 Key Features

### Event Management
- Create events with custom wine categories
- 6-digit join codes for easy access
- Automatic player order shuffling
- Real-time event status updates

### Player Management
- Join events with player details
- Presentation order management
- Ready status tracking
- Wine detail submission

### Scoring System
- 1-5 point scoring scale
- Difficulty factor weighting
- Real-time score updates
- Comprehensive leaderboard

### Wine Categories
- Country, Region, Grape Variety
- Vintage, Price Range, Producer
- Custom difficulty factors
- Smart region filtering

## 🔐 Security

- **CORS** - Configured for specific origins
- **Input Validation** - UUID validation and data sanitization
- **SQL Injection Protection** - Parameterized queries
- **Rate Limiting** - Request throttling
- **Helmet** - Security headers

## 🚀 Deployment

### Cloudflare Workers
```bash
# Configure wrangler.toml
# Set environment variables
# Deploy
npx wrangler deploy
```

### Custom Domain
```toml
# wrangler.toml
routes = [
  { pattern = "api.wine.tobiasbay.me/*", zone_name = "tobiasbay.me" }
]
```

## 🧪 Testing

### Database Testing
```bash
# Test database connection
npm run test-db

# Reset database
npm run reset-db
```

### API Testing
```bash
# Test all endpoints
npm run test-api

# Test specific endpoint
curl http://localhost:3001/api/health
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## 🔧 Development Tools

### Database Management
- **SQLite Browser** - Visual database editor
- **Migration Scripts** - Database version control
- **Backup/Restore** - Data protection

### API Testing
- **Postman** - API endpoint testing
- **curl** - Command-line testing
- **WebSocket Client** - Real-time testing

## 📊 Performance

### Optimization
- **Database Indexing** - Query performance
- **Connection Pooling** - Resource management
- **Caching** - Response optimization
- **Compression** - Bandwidth reduction

### Monitoring
- **Health Checks** - System status
- **Error Logging** - Issue tracking
- **Performance Metrics** - Response times
- **Usage Analytics** - Traffic patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the API documentation
- Review the database schema
- Contact the maintainer

---

**API Base URL**: https://api.wine.tobiasbay.me  
**Health Check**: https://api.wine.tobiasbay.me/api/health