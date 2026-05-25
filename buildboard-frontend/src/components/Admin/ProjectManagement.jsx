import { useState, useEffect } from 'react'
import axios from 'axios'

function ProjectManagement() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archivedFilter, setArchivedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchProjects()
  }, [search, archivedFilter, page])

  const fetchProjects = async () => {
    try {
      console.log('📁 Fetching projects...')
      setLoading(true)

      const res = await axios.get('http://localhost:5000/api/admin/projects', {
        params: {
          search: search || undefined,
          archived: archivedFilter || undefined,
          page,
          limit: 10
        },
        headers: { Authorization: token }
      })

      console.log('✅ Projects fetched:', res.data.projects.length)
      setProjects(res.data.projects)
      setTotalPages(res.data.pages)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      setLoading(false)
    }
  }

  const handleArchiveProject = async (projectId) => {
    try {
      console.log('📦 Archiving project...')

      await axios.put(
        `http://localhost:5000/api/admin/projects/${projectId}/archive`,
        {},
        { headers: { Authorization: token } }
      )

      alert('✅ Project archived successfully')
      fetchProjects()
    } catch (error) {
      alert('❌ Error archiving project')
    }
  }

  const handleRestoreProject = async (projectId) => {
    try {
      console.log('♻️ Restoring project...')

      await axios.put(
        `http://localhost:5000/api/admin/projects/${projectId}/restore`,
        {},
        { headers: { Authorization: token } }
      )

      alert('✅ Project restored successfully')
      fetchProjects()
    } catch (error) {
      alert('❌ Error restoring project')
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('⚠️ This will permanently delete the project and all versions. Continue?')) return

    try {
      console.log('🗑️ Deleting project...')

      await axios.delete(
        `http://localhost:5000/api/admin/projects/${projectId}`,
        { headers: { Authorization: token } }
      )

      alert('✅ Project deleted successfully')
      fetchProjects()
    } catch (error) {
      alert('❌ Error deleting project')
    }
  }

  if (loading) {
    return <div style={styles.loading}>⏳ Loading projects...</div>
  }

  return (
    <div style={styles.container}>
      {/* FILTERS */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={styles.searchInput}
        />

        <select
          value={archivedFilter}
          onChange={(e) => {
            setArchivedFilter(e.target.value)
            setPage(1)
          }}
          style={styles.select}
        >
          <option value="">All Projects</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
        </select>
      </div>

      {/* PROJECTS TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Owner</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project._id} style={styles.row}>
                <td style={styles.td}>{project.title}</td>
                <td style={styles.td}>{project.createdBy?.name}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: project.isArchived ? '#fee' : '#f0fdf4',
                    color: project.isArchived ? '#c33' : '#166534'
                  }}>
                    {project.isArchived ? '📦 Archived' : '✅ Active'}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    {project.isArchived ? (
                      <button
                        style={styles.restoreBtn}
                        onClick={() => handleRestoreProject(project._id)}
                      >
                        ♻️
                      </button>
                    ) : (
                      <button
                        style={styles.archiveBtn}
                        onClick={() => handleArchiveProject(project._id)}
                      >
                        📦
                      </button>
                    )}
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteProject(project._id)}
                    >
                      🗑️
                    </button>
                  </div>
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
  filters: {
    display: 'flex',
    gap: '15px'
  },
  searchInput: {
    flex: 1,
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px'
  },
  select: {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
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
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  archiveBtn: {
    padding: '6px 10px',
    backgroundColor: '#fef3c7',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  restoreBtn: {
    padding: '6px 10px',
    backgroundColor: '#dbeafe',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  deleteBtn: {
    padding: '6px 10px',
    backgroundColor: '#fee',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
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

export default ProjectManagement