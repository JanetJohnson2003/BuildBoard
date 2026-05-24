import { useState, useEffect } from 'react'
import axios from 'axios'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching admin dashboard data...')
      setLoading(true)
      setError(null)

      // ✅ Use admin endpoints instead
      const [dashRes, usersRes, projectsRes, activityRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/analytics/dashboard', {
          headers: { Authorization: token },
          timeout: 10000
        }),
        axios.get('http://localhost:5000/api/admin/analytics/users', {
          headers: { Authorization: token },
          timeout: 10000
        }),
        axios.get('http://localhost:5000/api/admin/analytics/projects', {
          headers: { Authorization: token },
          timeout: 10000
        }),
        axios.get('http://localhost:5000/api/admin/analytics/activities', {
          headers: { Authorization: token },
          timeout: 10000
        })
      ])

      console.log('✅ Dashboard data fetched')

      setStats({
        dashboard: dashRes.data,
        users: usersRes.data,
        projects: projectsRes.data,
        activity: activityRes.data
      })
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error.message)
      console.error('❌ Error details:', error.response?.data)
      setError(error.response?.data?.message || error.message)
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={styles.loading}>⏳ Loading dashboard...</div>
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>❌ Failed to load dashboard: {error}</p>
        <button 
          style={styles.retryBtn} 
          onClick={fetchDashboardData}
        >
          🔄 Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return <div style={styles.error}>❌ No data available</div>
  }

  const { dashboard, users, projects, activity } = stats

  return (
    <div style={styles.container}>
      {/* STATS CARDS */}
      <div style={styles.statsGrid}>
        <StatCard
          icon="👥"
          title="Total Users"
          value={dashboard?.stats?.totalUsers || 0}
          subtitle={`${users?.active || 0} active`}
          color="#4f46e5"
        />
        <StatCard
          icon="📁"
          title="Total Projects"
          value={dashboard?.stats?.totalProjects || 0}
          subtitle={`${projects?.active || 0} active`}
          color="#10b981"
        />
        <StatCard
          icon="📦"
          title="Total Versions"
          value={dashboard?.stats?.totalVersions || 0}
          subtitle="All versions"
          color="#f97316"
        />
        <StatCard
          icon="💬"
          title="Total Feedback"
          value={dashboard?.stats?.totalFeedback || 0}
          subtitle={`${dashboard?.stats?.activeBans || 0} flagged`}
          color="#ef4444"
        />
        <StatCard
          icon="🚫"
          title="Banned Users"
          value={dashboard?.stats?.activeBans || 0}
          subtitle="Active bans"
          color="#8b5cf6"
        />
      </div>

      {/* USERS BY ROLE */}
      <div style={styles.gridContainer}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>👥 Users by Role</h3>
          {dashboard?.usersByRole && dashboard.usersByRole.length > 0 ? (
            dashboard.usersByRole.map((role) => (
              <div key={role._id} style={styles.roleRow}>
                <span style={styles.roleName}>{role._id}</span>
                <span style={styles.roleCount}>{role.count}</span>
              </div>
            ))
          ) : (
            <p style={styles.noData}>No data available</p>
          )}
        </div>

        {/* RECENT ACTIVITY */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Recent Activities</h3>
          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
            <div style={styles.activityList}>
              {dashboard.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity._id} style={styles.activityItem}>
                  <span style={styles.activityAction}>{activity.action}</span>
                  <span style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noData}>No activities yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{ ...styles.statCard, borderLeftColor: color }}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <h4 style={styles.statTitle}>{title}</h4>
        <p style={styles.statValue}>{value || 0}</p>
        <p style={styles.statSubtitle}>{subtitle}</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start'
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
    margin: '0 0 5px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#333'
  },
  statSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  cardTitle: {
    margin: '0 0 15px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  roleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  },
  roleName: {
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize'
  },
  roleCount: {
    color: '#4f46e5',
    fontWeight: '700'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontSize: '13px'
  },
  activityAction: {
    fontWeight: '600',
    color: '#333'
  },
  activityTime: {
    color: '#999',
    fontSize: '12px'
  },
  noData: {
    color: '#999',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fee',
    borderRadius: '12px',
    color: '#c33',
    fontSize: '16px'
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
  }
}

export default AdminDashboard