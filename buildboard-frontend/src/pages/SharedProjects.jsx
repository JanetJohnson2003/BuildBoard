import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import Notifications from '../components/Notifications'

function SharedProjects() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (err) {
      console.error('Error parsing user data:', err)
      return null
    }
  }
  
  const user = getUserData()

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  // ✅ FIXED: Fetch shared projects with increased timeout
  const fetchSharedProjects = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('📥 Fetching shared projects...')
      console.log('Token:', token?.substring(0, 20) + '...')
      
      // ✅ CORRECT ENDPOINT WITH TRAILING SLASH
      const res = await axios.get('http://localhost:5000/api/projects/shared/', {
        headers: { 
          Authorization: token,
          'Content-Type': 'application/json'
        },
        timeout: 10000  // ✅ INCREASED TIMEOUT
      })
      
      console.log('✅ Shared projects fetched:', res.data.length)
      console.log('📦 Data:', res.data)
      setProjects(res.data)
      setError('')
    } catch (err) {
      console.error('❌ Error fetching shared projects:', err.message)
      console.error('❌ Error details:', err.response?.data)
      setError(err.response?.data?.message || 'Failed to load shared projects')
      showToast(err.response?.data?.message || 'Failed to load shared projects', 'error')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Check auth on mount and fetch projects - with cleanup
  useEffect(() => {
    console.log('📍 SharedProjects mounted')
    console.log('Token:', token?.substring(0, 20) + '...')
    console.log('User:', user?.name)

    if (!token || !user) {
      console.log('❌ No token or user, redirecting to login')
      navigate('/')
      return
    }

    fetchSharedProjects()

    // ✅ CLEANUP function
    return () => {
      console.log('🧹 SharedProjects component unmounting - cleanup')
    }
  }, []) // ✅ EMPTY dependency array - fetch only once on mount

  // ✅ Apply search filter
  useEffect(() => {
    const filtered = projects.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredProjects(filtered)
  }, [projects, searchQuery])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (!user) {
    return null
  }

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={styles.navbar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        <div style={styles.navRight}>
          <button 
            style={styles.analyticsBtn} 
            onClick={() => navigate('/analytics')}
            title="View Analytics"
          >
            📊 Analytics
          </button>
          <Notifications />
          <span style={styles.username}>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <h3 style={styles.heading}>📤 Projects Shared with Me</h3>
          <div style={styles.topActions}>
            <button 
              style={styles.backBtn}
              onClick={() => navigate('/projects')}
              title="Back to my projects"
            >
              ← Back to My Projects
            </button>
          </div>
        </div>

        <div style={styles.searchBox}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="🔍 Search shared projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ✅ Error display */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* ✅ Loading state */}
        {loading ? (
          <div style={styles.empty}>
            <p>⏳ Loading shared projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={styles.empty}>
            <p>
              {projects.length === 0
                ? '📭 No projects shared with you yet!'
                : '🔍 No shared projects match your search.'}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProjects.map((project) => (
              <div key={project._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.cardTitle}>{project.title}</h4>
                  <span style={styles.badge}>👤 {project.createdBy?.name}</span>
                </div>
                <p style={styles.cardDesc}>
                  {project.description || '📝 No description'}
                </p>
                <p style={styles.cardDate}>
                  📅 {new Date(project.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <div style={styles.btnRow}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => {
                      console.log('🔗 Navigating to versions:', project._id)
                      navigate(`/versions/${project._id}`)
                    }}
                  >
                    View Versions →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '16px 32px',
    backgroundColor: '#4f46e5', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  logo: { margin: 0, color: '#fff', fontSize: '24px', fontWeight: '700' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { color: '#fff', fontSize: '14px', fontWeight: '500' },
  analyticsBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  logoutBtn: {
    padding: '8px 16px', backgroundColor: '#fff',
    color: '#4f46e5', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
    transition: 'all 0.2s'
  },
  body: { padding: '32px', maxWidth: '1400px', margin: '0 auto' },
  topRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
    flexWrap: 'wrap', gap: '16px'
  },
  topActions: { display: 'flex', gap: '12px' },
  heading: { margin: 0, fontSize: '28px', color: '#333', fontWeight: '700' },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  searchBox: { marginBottom: '24px' },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  errorBox: {
    padding: '12px 20px',
    backgroundColor: '#fee',
    borderLeft: '4px solid #ef4444',
    marginBottom: '20px',
    borderRadius: '6px'
  },
  errorText: {
    margin: 0,
    color: '#c33',
    fontSize: '14px',
    fontWeight: '500'
  },
  empty: {
    textAlign: 'center', padding: '80px 40px',
    backgroundColor: '#fff', borderRadius: '12px',
    color: '#888', fontSize: '18px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #10b981',
    transition: 'all 0.2s',
    cursor: 'default'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px'
  },
  cardTitle: { margin: 0, color: '#333', fontSize: '18px', fontWeight: '600' },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#0284c7',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  cardDesc: { color: '#666', fontSize: '14px', margin: '0 0 10px', lineHeight: '1.5' },
  cardDate: { color: '#999', fontSize: '12px', margin: '0 0 12px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '16px' },
  viewBtn: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s'
  }
}

export default SharedProjects