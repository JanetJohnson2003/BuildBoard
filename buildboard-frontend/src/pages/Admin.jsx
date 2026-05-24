import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Import Admin Components
import AdminDashboard from '../components/Admin/AdminDashboard'
import UserManagement from '../components/Admin/UserManagement'
import ProjectManagement from '../components/Admin/ProjectManagement'
import ActivityLogs from '../components/Admin/ActivityLogs'
import ContentModeration from '../components/Admin/ContentModeration'

function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!userData || userData.role !== 'admin') {
      alert('❌ Admin access required')
      navigate('/dashboard')
      return
    }

    setUser(userData)
    setLoading(false)
  }, [navigate])

  if (loading) {
    return <div style={styles.loading}>⏳ Loading admin panel...</div>
  }

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        <p style={styles.adminBadge}>🔐 Admin Panel</p>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'dashboard' ? '#4f46e5' : '#f0f2f5',
              color: activeTab === 'dashboard' ? '#fff' : '#333'
            }}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>

          <button
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'users' ? '#4f46e5' : '#f0f2f5',
              color: activeTab === 'users' ? '#fff' : '#333'
            }}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>

          <button
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'projects' ? '#4f46e5' : '#f0f2f5',
              color: activeTab === 'projects' ? '#fff' : '#333'
            }}
            onClick={() => setActiveTab('projects')}
          >
            📁 Projects
          </button>

          <button
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'logs' ? '#4f46e5' : '#f0f2f5',
              color: activeTab === 'logs' ? '#fff' : '#333'
            }}
            onClick={() => setActiveTab('logs')}
          >
            📋 Activity Logs
          </button>

          <button
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'moderation' ? '#4f46e5' : '#f0f2f5',
              color: activeTab === 'moderation' ? '#fff' : '#333'
            }}
            onClick={() => setActiveTab('moderation')}
          >
            🛡️ Moderation
          </button>

          <hr style={styles.divider} />

          <button
            style={styles.logoutBtn}
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              navigate('/')
            }}
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            {activeTab === 'dashboard' && '📊 Dashboard'}
            {activeTab === 'users' && '👥 User Management'}
            {activeTab === 'projects' && '📁 Project Management'}
            {activeTab === 'logs' && '📋 Activity Logs'}
            {activeTab === 'moderation' && '🛡️ Content Moderation'}
          </h1>
          <div style={styles.adminInfo}>
            <span>👤 {user?.name}</span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'projects' && <ProjectManagement />}
          {activeTab === 'logs' && <ActivityLogs />}
          {activeTab === 'moderation' && <ContentModeration />}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#fff',
    borderRight: '1px solid #ddd',
    padding: '20px',
    overflowY: 'auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  logo: {
    margin: '0 0 5px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#4f46e5'
  },
  adminBadge: {
    margin: '0 0 20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textAlign: 'center'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  navItem: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left'
  },
  divider: {
    margin: '20px 0',
    border: 'none',
    borderTop: '1px solid #ddd'
  },
  logoutBtn: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c33',
    border: '1px solid #fcc',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#333'
  },
  adminInfo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '30px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }
}

export default Admin