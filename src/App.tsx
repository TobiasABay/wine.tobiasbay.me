import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateEventPage from './pages/createEvents/CreateEventPage'
import EventDetailsPage from './pages/createEvents/EventDetailsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/event-details" element={<EventDetailsPage />} />
      </Routes>
    </Router>
  )
}

export default App
