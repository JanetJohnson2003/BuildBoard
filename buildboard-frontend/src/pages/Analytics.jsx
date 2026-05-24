import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Analytics() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!userData || !userData.id || !token) {
      setError('Not logged in')
      setLoading(false)
      return
    }

    setUser(userData)
    fetchAnalytics()
  }, [token])

  const fetchAnalytics = async () => {
    try {
      console.log('📊 Fetching analytics...')
      setLoading(true)
      setError(null)

      const res = await axios.get('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      console.log('✅ Analytics fetched:', res.data)
      setStats(res.data)
      setLoading(false)
    } catch (err) {
      console.error('❌ Error fetching analytics:', err.message)
      console.error('❌ Error response:', err.response?.data)
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setTimeout(() => navigate('/'), 2000)
      } else {
        setError(err.response?.data?.message || 'Failed to load analytics')
      }
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.navbar}>
          <h2 style={styles.logo}>BuildBoard+</h2>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>
        <div style={styles.body}>
          <div style={styles.errorBox}>
            <p>❌ {error}</p>
            <button style={styles.retryBtn} onClick={fetchAnalytics}>
              🔄 Retry
            </button>
            <button 
              style={{ ...styles.retryBtn, backgroundColor: '#666', marginLeft: '10px' }}
              onClick={() => navigate('/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.navbar}>
          <h2 style={styles.logo}>BuildBoard+</h2>
        </div>
        <div style={styles.body}>
          <p style={styles.loading}>⏳ Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
      </div>

      {/* BODY */}
      <div style={styles.body}>
        <h1 style={styles.title}>📊 Analytics Dashboard</h1>

        {/* STATS CARDS */}
        <div style={styles.statsGrid}>
          <StatCard
            icon="📁"
            title="Total Projects"
            value={stats?.projects || 0}
            color="#4f46e5"
          />
          <StatCard
            icon="📦"
            title="Total Versions"
            value={stats?.versions || 0}
            color="#10b981"
          />
          <StatCard
            icon="💬"
            title="Total Feedback"
            value={stats?.feedback || 0}
            color="#f97316"
          />
          <StatCard
            icon="👥"
            title="Active Users"
            value={stats?.users || 0}
            color="#8b5cf6"
          />
        </div>

        {/* RECENT ACTIVITIES */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Recent Activities</h2>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div style={styles.activityList}>
              {stats.recentActivities.slice(0, 10).map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <span style={styles.activityIcon}>📌</span>
                  <div>
                    <p style={styles.activityTitle}>{activity.title}</p>
                    <p style={styles.activityDate}>
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noData}>No recent activities</p>
          )}
        </div>

        {/* TOP REVIEWERS */}
        {stats?.topReviewers && stats.topReviewers.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>👥 Top Reviewers</h2>
            <div style={styles.reviewerList}>
              {stats.topReviewers.map((reviewer, index) => (
                <div key={index} style={styles.reviewerItem}>
                  <span style={styles.reviewerRank}>#{index + 1}</span>
                  <div>
                    <p style={styles.reviewerName}>{reviewer.name}</p>
                    <p style={styles.reviewerStats}>{reviewer.feedbackCount} feedbacks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOST COMMENTED PROJECTS */}
        {stats?.mostCommentedProjects && stats.mostCommentedProjects.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔥 Most Commented Projects</h2>
            <div style={styles.projectList}>
              {stats.mostCommentedProjects.map((project, index) => (
                <div key={index} style={styles.projectItem}>
                  <p style={styles.projectName}>{project.title}</p>
                  <p style={styles.projectStats}>{project.commentCount} comments</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderLeftColor: color }}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <h3 style={styles.statTitle}>{title}</h3>
        <p style={styles.statValue}>{value}</p>
      </div>
    </div>
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  logo: {
    margin: 0,
    color: '#fff',
    fontSize: '24px',
    fontWeight: '700'
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  body: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  title: {
    margin: '0 0 30px',
    fontSize: '32px',
    fontWeight: '700',
    color: '#333'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  statIcon: {
    fontSize: '32px'
  },
  statTitle: {
    margin: '0 0 5px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#666'
  },
  statValue: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#333'
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  },
  cardTitle: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#333'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  activityItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    alignItems: 'flex-start'
  },
  activityIcon: {
    fontSize: '20px'
  },
  activityTitle: {
    margin: '0 0 5px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  activityDate: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  reviewerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  reviewerItem: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  reviewerRank: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#4f46e5'
  },
  reviewerName: {
    margin: '0 0 5px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  reviewerStats: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  projectList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px'
  },
  projectItem: {
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  projectName: {
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  projectStats: {
    margin: 0,
    fontSize: '13px',
    color: '#4f46e5',
    fontWeight: '600'
  },
  errorBox: {
    backgroundColor: '#fee',
    border: '2px solid #fcc',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    color: '#c33'
  },
  retryBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  },
  noData: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px'
  }
}

export default Analytics