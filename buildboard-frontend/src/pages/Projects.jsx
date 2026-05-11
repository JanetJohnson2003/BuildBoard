import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import Notifications from '../components/Notifications'

function Projects() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUser, setFilterUser] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

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

  const fetchProjects = useCallback(async () => {
    try {
      console.log('📥 Fetching projects...')
      const res = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: token }
      })
      setProjects(res.data)
      console.log('✅ Projects fetched:', res.data.length)
    } catch (err) {
      showToast('Failed to load projects', 'error')
      console.error('Error:', err.message)
    }
  }, [token])

  useEffect(() => {
    if (!token || !user) {
      navigate('/')
    }
  }, [token, user, navigate])

  useEffect(() => {
    if (token && user) {
      fetchProjects()
    }
  }, [token, user, fetchProjects])

  useEffect(() => {
    applyFilters()
  }, [projects, searchQuery, filterUser, filterDate])

  const applyFilters = () => {
    let filtered = [...projects]

    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (filterUser === 'owned') {
      filtered = filtered.filter(p => p.createdBy._id === user._id)
    }

    if (filterDate !== 'all') {
      const now = new Date()
      filtered = filtered.filter(p => {
        const createdDate = new Date(p.createdAt)
        let daysAgo = 0
        if (filterDate === 'week') daysAgo = 7
        else if (filterDate === 'month') daysAgo = 30
        else if (filterDate === 'year') daysAgo = 365
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        return createdDate >= cutoffDate
      })
    }

    setFilteredProjects(filtered)
  }

  const handleCreate = async () => {
    if (!title) return showToast('Please enter project title', 'error')
    try {
      await axios.post(
        'http://localhost:5000/api/projects',
        { title, description },
        { headers: { Authorization: token } }
      )
      setTitle('')
      setDescription('')
      setShowForm(false)
      fetchProjects()
      showToast('Project created successfully!', 'success')
    } catch (err) {
      showToast('Failed to create project', 'error')
      console.log(err)
    }
  }

  const handleShare = (projectId) => {
    const link = `${window.location.origin}/versions/${projectId}`
    navigator.clipboard.writeText(link)
    showToast('Link copied to clipboard! 📋', 'success')
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterUser('all')
    setFilterDate('all')
    setShowFilters(false)
  }

  const hasActiveFilters = searchQuery || filterUser !== 'all' || filterDate !== 'all'

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
          <h3 style={styles.heading}>My Projects</h3>
          <div style={styles.topActions}>
            <button 
              style={{
                ...styles.filterToggleBtn,
                ...(hasActiveFilters ? styles.filterToggleBtnActive : {})
              }} 
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}
              {hasActiveFilters && <span style={styles.filterBadge}>●</span>}
            </button>
            <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '+ New Project'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={styles.filterPanel}>
            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>🔍 Search Projects</label>
                <input
                  style={styles.searchInput}
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>👤 Project Type</label>
                <select
                  style={styles.filterSelect}
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                >
                  <option value="all">All Projects</option>
                  <option value="owned">📋 My Projects</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>📅 Date Range</label>
                <select
                  style={styles.filterSelect}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <button style={styles.resetBtn} onClick={resetFilters}>
                  ✕ Clear All
                </button>
              </div>
            </div>

            <div style={styles.resultsInfo}>
              📊 Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects
              {hasActiveFilters && ' (filtered)'}
            </div>
          </div>
        )}

        {showForm && (
          <div style={styles.form}>
            <h4 style={styles.formTitle}>✏️ Create New Project</h4>
            <input
              style={styles.input}
              placeholder="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <textarea
              style={styles.textarea}
              placeholder="Project Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div style={styles.formActions}>
              <button style={styles.submitBtn} onClick={handleCreate}>
                ✓ Create Project
              </button>
              <button 
                style={styles.cancelBtn} 
                onClick={() => {
                  setShowForm(false)
                  setTitle('')
                  setDescription('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div style={styles.empty}>
            <p>
              {projects.length === 0
                ? '📭 No projects yet. Click "+ New Project" to start! 🚀'
                : '🔍 No projects match your filters. Try adjusting your search!'}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProjects.map((project) => (
              <div key={project._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.cardTitle}>{project.title}</h4>
                  <span style={styles.badge}>👤 Owned</span>
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
                    onClick={() => navigate(`/versions/${project._id}`)}
                  >
                    View Versions →
                  </button>
                  <button
                    style={styles.shareBtn}
                    onClick={() => handleShare(project._id)}
                    title="Copy project link"
                  >
                    Share 🔗
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
  topActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  heading: { margin: 0, fontSize: '28px', color: '#333', fontWeight: '700' },
  filterToggleBtn: {
    padding: '10px 20px',
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    position: 'relative'
  },
  filterToggleBtnActive: {
    backgroundColor: '#ea580c',
    boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.2)'
  },
  filterBadge: { display: 'inline-block', marginLeft: '6px', color: '#fef3c7' },
  addBtn: {
    padding: '10px 20px', backgroundColor: '#4f46e5',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    transition: 'all 0.2s'
  },
  filterPanel: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    border: '2px solid #f97316'
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  filterLabel: { fontSize: '13px', fontWeight: '600', color: '#333' },
  searchInput: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  resetBtn: {
    padding: '10px 12px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    alignSelf: 'flex-end',
    transition: 'all 0.2s'
  },
  resultsInfo: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '600',
    padding: '8px 0',
    borderTop: '1px solid #eee',
    marginTop: '12px',
    paddingTop: '12px'
  },
  form: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px', marginBottom: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    border: '2px solid #4f46e5'
  },
  formTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    width: '100%', padding: '10px 14px',
    marginBottom: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%', padding: '10px 14px',
    marginBottom: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px',
    boxSizing: 'border-box', height: '100px', resize: 'vertical'
  },
  formActions: { display: 'flex', gap: '12px' },
  submitBtn: {
    padding: '10px 24px', backgroundColor: '#4f46e5',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600'
  },
  cancelBtn: {
    padding: '10px 24px', backgroundColor: '#e5e7eb',
    color: '#666', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px'
  },
  empty: {
    textAlign: 'center', padding: '80px 40px',
    backgroundColor: '#fff', borderRadius: '12px',
    color: '#888', fontSize: '18px'
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
    borderLeft: '4px solid #4f46e5',
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
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  cardDesc: { color: '#666', fontSize: '14px', margin: '0 0 10px', lineHeight: '1.5' },
  cardDate: { color: '#999', fontSize: '12px', margin: '0 0 8px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '16px' },
  viewBtn: {
    padding: '8px 12px', backgroundColor: '#eef2ff',
    color: '#4f46e5', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
    flex: 1, transition: 'all 0.2s'
  },
  shareBtn: {
    padding: '8px 12px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    flex: 1,
    transition: 'all 0.2s'
  }
}

export default Projects