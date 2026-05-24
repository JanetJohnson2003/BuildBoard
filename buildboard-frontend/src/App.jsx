import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Analytics from './pages/Analytics'
import SharedProjects from './pages/SharedProjects'
import Versions from './pages/Versions'
import Feedback from './pages/Feedback'
import Admin from './pages/Admin'  // ✅ ADD THIS

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/shared-projects" element={<SharedProjects />} />
        <Route path="/versions/:projectId" element={<Versions />} />
        <Route path="/feedback/:versionId" element={<Feedback />} />
        <Route path="/admin" element={<Admin />} />  // ✅ ADD THIS
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  )
}

export default App