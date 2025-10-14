import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateEventPage from './pages/createEvents/CreateEventPage'
import EventDetailsPage from './pages/createEvents/EventDetailsPage'
import EventCreatedPage from './pages/createEvents/EventCreatedPage'
import JoinEventPage from './pages/joinEvents/JoinEventPage'
import EventPage from './pages/EventPage'
import PlayerScoringPage from './pages/PlayerScoringPage'
import FinishPage from './pages/FinishPage'
import AdminEventsListPage from './pages/AdminEventsListPage'
import AdminEventDetailsPage from './pages/AdminEventDetailsPage'
import ProtectedRoute from './components/ProtectedRoute'
import DemoPage from './pages/DemoPage'
import WebSocketTestPage from './pages/WebSocketTestPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/event-details" element={<EventDetailsPage />} />
        <Route path="/event-created" element={<EventCreatedPage />} />
        <Route path="/event-created/:eventId" element={<EventCreatedPage />} />
        <Route path="/event/:eventId" element={<EventPage />} />
        <Route path="/score/:eventId" element={<PlayerScoringPage />} />
        <Route path="/finish/:eventId" element={<FinishPage />} />
        <Route path="/join-event" element={<JoinEventPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/ws-test" element={<WebSocketTestPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminEventsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:eventId"
          element={
            <ProtectedRoute>
              <AdminEventDetailsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
