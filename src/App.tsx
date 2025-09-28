import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateEventPage from './pages/createEvents/CreateEventPage'
import EventDetailsPage from './pages/createEvents/EventDetailsPage'
import EventCreatedPage from './pages/createEvents/EventCreatedPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/event-details" element={<EventDetailsPage />} />
        <Route path="/event-created" element={<EventCreatedPage />} />
      </Routes>
    </Router>
  )
}

export default App
