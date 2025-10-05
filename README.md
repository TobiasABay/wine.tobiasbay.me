# Wine Tasting Event Application

A full-stack wine tasting event application built with React, TypeScript, and Cloudflare Workers. Players can create events, join with codes, submit wine details, guess other players' wines, and see final scores.

## 🍷 Features

- **Event Management**: Create wine tasting events with custom categories
- **Player Registration**: Join events with 6-digit codes or QR codes
- **Smart Region Filtering**: Regions automatically filtered based on selected country
- **Real-time Updates**: Live player updates and scoring
- **Scoring System**: Points based on correct guesses and difficulty factors
- **Admin Interface**: Review and edit wine answers and guesses
- **Responsive Design**: Works on desktop and mobile devices
- **Cloudflare Deployment**: Hosted on Cloudflare Pages and Workers

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Pages**: Event creation, joining, scoring, results
- **Components**: Reusable UI components
- **Services**: API communication and WebSocket handling
- **Hooks**: Custom React hooks for fullscreen and polling

### Backend (Cloudflare Workers + SQLite)
- **API**: RESTful endpoints for all operations
- **Database**: SQLite with comprehensive schema
- **Real-time**: WebSocket support for live updates
- **CORS**: Configured for cross-origin requests

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AverageScore.tsx
│   ├── FullscreenButton.tsx
│   ├── WineCategoriesDisplay.tsx
│   └── WineScoring.tsx
├── hooks/              # Custom React hooks
│   ├── useFullscreen.ts
│   └── useSmartPolling.ts
├── pages/              # Application pages
│   ├── AdminPage.tsx
│   ├── EventPage.tsx
│   ├── FinishPage.tsx
│   ├── HomePage.tsx
│   ├── PlayerScoringPage.tsx
│   ├── createEvents/
│   │   ├── CreateEventPage.tsx
│   │   ├── EventCreatedPage.tsx
│   │   └── EventDetailsPage.tsx
│   └── joinEvents/
│       └── JoinEventPage.tsx
├── services/           # External service integrations
│   ├── api.ts
│   └── websocket.ts
└── utils/              # Utility functions
    └── deviceId.ts
```

## 🎯 Pages & Routes

### Public Pages
- **`/`** - HomePage: Landing page with event creation and joining options
- **`/create`** - CreateEventPage: Create new wine tasting events
- **`/create/:eventId`** - EventDetailsPage: Configure event details and categories
- **`/join/:eventId`** - JoinEventPage: Join existing events with player details

### Event Pages
- **`/event/:eventId`** - EventPage: Event lobby with player management
- **`/score/:eventId/:playerId`** - PlayerScoringPage: Submit scores and guesses
- **`/finish/:eventId`** - FinishPage: Final results and leaderboard

### Admin Pages
- **`/admin/:eventId`** - AdminPage: Review and edit wine data

## 🧩 Components

### Core Components
- **`WineScoring`** - Score input and validation
- **`WineCategoriesDisplay`** - Display wine categories and answers
- **`AverageScore`** - Calculate and display average scores
- **`FullscreenButton`** - Toggle fullscreen mode

### Custom Hooks
- **`useFullscreen`** - Manage fullscreen state
- **`useSmartPolling`** - Intelligent polling for real-time updates

## 🔧 Key Variables & Configuration

### Environment Variables
```typescript
// API Configuration
const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : 'https://api.wine.tobiasbay.me';

// Wine Categories
const WINE_COUNTRIES = ['France', 'Italy', 'Spain', 'Germany', ...];
const COUNTRY_REGIONS_MAP = {
  'France': ['Alsace', 'Bordeaux', 'Burgundy', ...],
  'Italy': ['Piedmont', 'Tuscany', 'Veneto', ...],
  // ...
};
```

### TypeScript Interfaces
```typescript
interface Event {
  id: string;
  name: string;
  date: string;
  max_participants: number;
  wine_type: string;
  location: string;
  // ...
}

interface Player {
  id: string;
  event_id: string;
  name: string;
  presentation_order: number;
  // ...
}

interface WineCategory {
  id: string;
  guessing_element: string;
  difficulty_factor: string;
}
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd wine.tobiasbay.me

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm run dev
```

## 🌐 Deployment

### Frontend (Cloudflare Pages)
```bash
npm run build
npx wrangler pages deploy dist --project-name=wine-tobiasbay-me
```

### Backend (Cloudflare Workers)
```bash
cd workers
npx wrangler deploy
```

## 🔗 API Endpoints

### Events
- `POST /api/events` - Create new event
- `GET /api/events/:eventId` - Get event details
- `PUT /api/events/:eventId/start` - Start event

### Players
- `POST /api/players/join` - Join event
- `GET /api/players/event/:eventId` - Get event players
- `PUT /api/players/:playerId/ready` - Mark player ready

### Wine Data
- `POST /api/wine-answers` - Submit wine answers
- `POST /api/wine-scores` - Submit wine scores
- `POST /api/wine-guesses` - Submit wine guesses
- `GET /api/leaderboard/:eventId` - Get final leaderboard

### Admin
- `GET /api/admin/events/:eventId/wine-data` - Get admin wine data
- `PUT /api/admin/wine-answer` - Update wine answer

## 🎮 Game Flow

1. **Event Creation**: Host creates event with categories
2. **Player Joining**: Players join with 6-digit codes
3. **Wine Submission**: Players submit details about their wines
4. **Scoring Phase**: Players score and guess other wines
5. **Results**: Final leaderboard with detailed breakdown

## 🏆 Scoring System

- **Correct Guesses**: Points based on difficulty factor
- **Self-Guessing**: Players can guess their own wines
- **Accuracy Tracking**: Percentage of correct guesses
- **Leaderboard**: Ranked by total points and accuracy

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI** - Component library
- **React Router** - Navigation

### Backend
- **Cloudflare Workers** - Serverless functions
- **SQLite** - Database
- **WebSocket** - Real-time communication
- **CORS** - Cross-origin requests

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

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
- Contact the maintainer
- Check the documentation

---

**Live Application**: https://wine.tobiasbay.me  
**API Documentation**: https://api.wine.tobiasbay.me