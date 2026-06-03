import { useState, useEffect } from 'react'
import axios from 'axios'

function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchLogs()
  }, [action, page])

  const fetchLogs = async () => {
    try {
      console.log('📋 Fetching activity logs...')
      setLoading(true)

      const res = await axios.get('/api/admin/logs', {
        params: {
          action: action || undefined,
          page,
          limit: 20
        },
        headers: { Authorization: token }
      })

      console.log('✅ Logs fetched:', res.data.logs.length)
      setLogs(res.data.logs)
      setTotalPages(res.data.pages)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching logs:', error)
      setLoading(false)
    }
  }

  const handleExportLogs = async () => {
    try {
      console.log('📥 Exporting logs...')

      const res = await axios.get('/api/admin/logs/export', {
        headers: { Authorization: token },
        responseType: 'blob'
      })

      // Download CSV
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `logs-${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)

      alert('✅ Logs exported successfully')
    } catch (error) {
      alert('❌ Error exporting logs')
    }
  }

  if (loading) {
    return <div style={styles.loading}>⏳ Loading logs...</div>
  }

  return (
    <div style={styles.container}>
      {/* CONTROLS */}
      <div style={styles.controls}>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
          style={styles.select}
        >
          <option value="">All Actions</option>
          <option value="VIEW_ALL_USERS">View Users</option>
          <option value="CHANGE_USER_ROLE">Change Role</option>
          <option value="BAN_USER">Ban User</option>
          <option value="DELETE_USER">Delete User</option>
          <option value="DELETE_PROJECT">Delete Project</option>
          <option value="FLAG_FEEDBACK">Flag Feedback</option>
          <option value="DELETE_FEEDBACK">Delete Feedback</option>
        </select>

        <button style={styles.exportBtn} onClick={handleExportLogs}>
          📥 Export as CSV
        </button>
      </div>

      {/* LOGS TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Admin</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} style={styles.row}>
                <td style={styles.td}>
                  <span style={styles.action}>{log.action}</span>
                </td>
                <td style={styles.td}>{log.userId?.email}</td>
                <td style={styles.td}>
                  <code style={styles.code}>
                    {JSON.stringify(log.details).substring(0, 50)}...
                  </code>
                </td>
                <td style={styles.td}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div style={styles.pagination}>
        <button
          style={styles.pageBtn}
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          ← Previous
        </button>
        <span style={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>
        <button
          style={styles.pageBtn}
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  controls: {
    display: 'flex',
    gap: '15px'
  },
  select: {
    flex: 1,
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  exportBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#f0f2f5',
    borderBottom: '2px solid #ddd'
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  row: {
    borderBottom: '1px solid #eee'
  },
  td: {
    padding: '15px',
    fontSize: '14px',
    color: '#333'
  },
  action: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600'
  },
  code: {
    backgroundColor: '#f5f5f5',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#333'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '20px'
  },
  pageBtn: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  pageInfo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
}

export default ActivityLogs