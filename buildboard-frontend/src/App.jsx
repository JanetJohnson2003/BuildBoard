import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Projects from './pages/Projects'
import Versions from './pages/Versions'
import Feedback from './pages/Feedback'
import Analytics from './components/Analytics'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Projects />} />
        <Route path="/versions/:projectId" element={<Versions />} />
        <Route path="/feedback/:versionId" element={<Feedback />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App