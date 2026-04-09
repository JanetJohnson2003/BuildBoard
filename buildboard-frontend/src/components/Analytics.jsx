import { useState, useEffect } from 'react'
import axios from 'axios'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [analyticsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/dashboard', {
          headers: { Authorization: token }
        }),
        axios.get('http://localhost:5000/api/analytics/user-stats', {
          headers: { Authorization: token }
        })
      ])
      
      setAnalytics(analyticsRes.data)
      setUserStats(statsRes.data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading analytics...</div>
  }

  if (!analytics || !userStats) {
    return <div style={styles.loading}>No analytics data available</div>
  }

  // Pie chart data (Rating distribution)
  const ratingChartData = {
    labels: ['⭐ Poor', '⭐⭐ Fair', '⭐⭐⭐ Good', '⭐⭐⭐⭐ Very Good', '⭐⭐⭐⭐⭐ Excellent'],
    datasets: [{
      data: [
        analytics.ratingCounts[1],
        analytics.ratingCounts[2],
        analytics.ratingCounts[3],
        analytics.ratingCounts[4],
        analytics.ratingCounts[5]
      ],
      backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'],
      borderColor: '#fff',
      borderWidth: 2
    }]
  }

  // Line chart data (Versions progress)
  const versionChartData = {
    labels: userStats.months,
    datasets: [{
      label: 'Versions Created',
      data: userStats.versionCounts,
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#4f46e5',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 20
        }
      }
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📊 Dashboard Analytics</h2>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📁</div>
          <div>
            <p style={styles.statLabel}>Total Projects</p>
            <h3 style={styles.statValue}>{analytics.totalProjects}</h3>
            <p style={styles.statDetail}>
              {analytics.userProjects} owned • {analytics.sharedProjects} shared
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📤</div>
          <div>
            <p style={styles.statLabel}>Total Versions</p>
            <h3 style={styles.statValue}>{analytics.totalVersions}</h3>
            <p style={styles.statDetail}>All uploaded versions</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div>
            <p style={styles.statLabel}>Average Rating</p>
            <h3 style={styles.statValue}>{analytics.avgRating}</h3>
            <p style={styles.statDetail}>From {analytics.totalFeedback} feedback items</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💬</div>
          <div>
            <p style={styles.statLabel}>Total Feedback</p>
            <h3 style={styles.statValue}>{analytics.totalFeedback}</h3>
            <p style={styles.statDetail}>Comments & reviews</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>
        {/* Rating Distribution Pie Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Rating Distribution</h3>
          <div style={styles.chartContainer}>
            <Pie data={ratingChartData} options={chartOptions} />
          </div>
        </div>

        {/* Versions Progress Line Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📊 Versions Progress (Last 6 Months)</h3>
          <div style={styles.chartContainer}>
            <Line data={versionChartData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  position: 'top'
                }
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh'
  },
  heading: {
    margin: '0 0 24px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#333'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start'
  },
  statIcon: {
    fontSize: '32px',
    minWidth: '50px'
  },
  statLabel: {
    margin: '0 0 4px',
    fontSize: '12px',
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statValue: {
    margin: '0 0 4px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#4f46e5'
  },
  statDetail: {
    margin: '0',
    fontSize: '12px',
    color: '#888'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px'
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  chartTitle: {
    margin: '0 0 20px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  chartContainer: {
    position: 'relative',
    height: '300px'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#888',
    fontSize: '16px'
  }
}

export default Analytics