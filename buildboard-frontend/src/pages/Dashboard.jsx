import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!userData || !userData.id) {
      navigate('/')
      return
    }

    setUser(userData)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        
        <nav style={styles.navMenu}>
          <button
            style={styles.navLink}
            onClick={() => navigate('/projects')}
          >
            📁 Projects
          </button>
          <button
            style={styles.navLink}
            onClick={() => navigate('/analytics')}
          >
            📊 Analytics
          </button>
          <button
            style={styles.navLink}
            onClick={() => navigate('/shared-projects')}
          >
            🤝 Shared
          </button>

          {/* ✅ ADMIN LINK - ONLY FOR ADMINS */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                ...styles.navLink,
                backgroundColor: '#ef4444',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🔐 Admin Panel
            </button>
          )}
        </nav>

        <div style={styles.navRight}>
          <span style={styles.username}>👋 {user?.name}</span>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={styles.body}>
        <h1 style={styles.title}>Welcome to BuildBoard+</h1>
        <p style={styles.subtitle}>
          {user?.role === 'admin' 
            ? '🔐 You are logged in as an Admin' 
            : user?.role === 'reviewer'
            ? '👁️ You are logged in as a Reviewer'
            : '👤 You are logged in as a User'}
        </p>

        {/* QUICK STATS */}
        <div style={styles.statsGrid}>
          <StatCard 
            icon="📁" 
            title="My Projects" 
            subtitle="Create and manage projects"
            action={() => navigate('/projects')}
            actionText="View Projects →"
          />
          <StatCard 
            icon="📊" 
            title="Analytics" 
            subtitle="View your statistics"
            action={() => navigate('/analytics')}
            actionText="View Analytics →"
          />
          <StatCard 
            icon="🤝" 
            title="Shared Projects" 
            subtitle="Projects shared with you"
            action={() => navigate('/shared-projects')}
            actionText="View Shared →"
          />
          {user?.role === 'admin' && (
            <StatCard 
              icon="🔐" 
              title="Admin Panel" 
              subtitle="Manage platform"
              action={() => navigate('/admin')}
              actionText="Go to Admin →"
            />
          )}
        </div>

        {/* QUICK LINKS */}
        <div style={styles.quickLinks}>
          <h2 style={styles.quickTitle}>Quick Links</h2>
          <div style={styles.linkGrid}>
            <QuickLink 
              icon="➕" 
              text="Create New Project" 
              onClick={() => navigate('/projects')}
            />
            <QuickLink 
              icon="👁️" 
              text="View Shared Projects" 
              onClick={() => navigate('/shared-projects')}
            />
            <QuickLink 
              icon="📊" 
              text="Check Analytics" 
              onClick={() => navigate('/analytics')}
            />
            {user?.role === 'admin' && (
              <QuickLink 
                icon="🔐" 
                text="Admin Dashboard" 
                onClick={() => navigate('/admin')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, subtitle, action, actionText }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <h3 style={styles.statTitle}>{title}</h3>
      <p style={styles.statSubtitle}>{subtitle}</p>
      <button
        style={styles.statAction}
        onClick={action}
      >
        {actionText}
      </button>
    </div>
  )
}

function QuickLink({ icon, text, onClick }) {
  return (
    <button
      style={styles.quickLink}
      onClick={onClick}
    >
      <span style={styles.quickIcon}>{icon}</span>
      <span style={styles.quickText}>{text}</span>
    </button>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#4f46e5',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
    gap: '20px'
  },
  logo: {
    margin: 0,
    color: '#fff',
    fontSize: '24px',
    fontWeight: '700'
  },
  navMenu: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center'
  },
  navLink: {
    color: '#fff',
    background: 'none',
    border: 'none',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    padding: 0
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  username: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  body: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  title: {
    margin: '0 0 10px',
    fontSize: '32px',
    fontWeight: '700',
    color: '#333'
  },
  subtitle: {
    margin: '0 0 30px',
    fontSize: '14px',
    color: '#666'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    textAlign: 'center',
    transition: 'all 0.2s'
  },
  statIcon: {
    fontSize: '40px',
    marginBottom: '10px'
  },
  statTitle: {
    margin: '0 0 5px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#333'
  },
  statSubtitle: {
    margin: '0 0 15px',
    fontSize: '13px',
    color: '#666'
  },
  statAction: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  quickLinks: {
    marginTop: '40px'
  },
  quickTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#333'
  },
  linkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  quickLink: {
    backgroundColor: '#fff',
    padding: '16px',
    border: '2px solid #ddd',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    color: '#333'
  },
  quickIcon: {
    fontSize: '20px'
  },
  quickText: {
    flex: 1,
    textAlign: 'left'
  }
}

export default Dashboard