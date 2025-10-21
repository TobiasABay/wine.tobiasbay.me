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
import MyResultsPage from './pages/MyResultsPage'
import AdminEventsListPage from './pages/admin/AdminEventsListPage'
import AdminEventDetailsPage from './pages/admin/AdminEventDetailsPage'
import ProtectedRoute from './components/ProtectedRoute'
import DemoPage from './pages/DemoPage'
import WebSocketTestPage from './pages/WebSocketTestPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminLayout from './components/AdminLayout'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage'
import AdminInsightsPage from './pages/admin/AdminInsightsPage'
import AdminHeatMap from './pages/admin/AdminHeatMap'

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
        <Route path="/my-results/:eventId" element={<MyResultsPage />} />
        <Route path="/join-event" element={<JoinEventPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/ws-test" element={<WebSocketTestPage />} />

        {/* Admin routes with persistent sidebar */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested admin routes - rendered in the Outlet */}
          <Route index element={<AdminEventsListPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path=":eventId" element={<AdminEventDetailsPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="insights" element={<AdminInsightsPage />} />
          <Route path="heat-map" element={<AdminHeatMap />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
