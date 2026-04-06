import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Projects from './pages/Projects'
import Versions from './pages/Versions'
import Feedback from './pages/Feedback'

function App() {
  const token = localStorage.getItem('token')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={token ? <Projects /> : <Navigate to="/" />} />
        <Route path="/versions/:projectId" element={token ? <Versions /> : <Navigate to="/" />} />
        <Route path="/feedback/:versionId" element={token ? <Feedback /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App