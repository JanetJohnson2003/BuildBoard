import { useState, useEffect } from 'react'
import axios from 'axios'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const token = localStorage.getItem('token')



  const fetchUsers = async () => {
    try {
      console.log('👥 Fetching users...')
      setLoading(true)

      const res = await axios.get('/api/admin/users', {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          page,
          limit: 10
        },
        headers: { Authorization: token }
      })

      console.log('✅ Users fetched:', res.data.users.length)
      setUsers(res.data.users)
      setTotalPages(res.data.pages)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      setLoading(false)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      console.log('🔄 Changing role...')

      await axios.put(
        `/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: token } }
      )

      alert('✅ Role changed successfully')
      fetchUsers()
    } catch (error) {
      alert('❌ Error changing role: ' + error.response?.data?.message)
    }
  }

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return

    try {
      console.log('🚫 Banning user...')

      await axios.put(
        `/api/admin/users/${userId}/ban`,
        {},
        { headers: { Authorization: token } }
      )

      alert('✅ User banned successfully')
      fetchUsers()
    } catch (error) {
      alert('❌ Error banning user')
    }
  }

  const handleUnbanUser = async (userId) => {
    try {
      console.log('✅ Unbanning user...')

      await axios.put(
        `/api/admin/users/${userId}/unban`,
        {},
        { headers: { Authorization: token } }
      )

      alert('✅ User unbanned successfully')
      fetchUsers()
    } catch (error) {
      alert('❌ Error unbanning user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ This will permanently delete the user and all their projects. Continue?')) return

    try {
      console.log('🗑️ Deleting user...')

      await axios.delete(
        `/api/admin/users/${userId}`,
        { headers: { Authorization: token } }
      )

      alert('✅ User deleted successfully')
      fetchUsers()
    } catch (error) {
      alert('❌ Error deleting user')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, page])

  useEffect(() => {
    fetchUserDetails()
  }, [])

  if (loading) {
    return <div style={styles.loading}>⏳ Loading users...</div>
  }

  return (
    <div style={styles.container}>
      {/* FILTERS */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={styles.searchInput}
        />

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          style={styles.select}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="reviewer">Reviewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* USERS TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={styles.row}>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                    style={styles.roleSelect}
                  >
                    <option value="user">User</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: user.isBanned ? '#fee' : '#eef2ff',
                    color: user.isBanned ? '#c33' : '#4f46e5'
                  }}>
                    {user.isBanned ? '🚫 Banned' : '✅ Active'}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => {
                        setSelectedUser(user)
                        setShowModal(true)
                      }}
                    >
                      👁️
                    </button>
                    {user.isBanned ? (
                      <button
                        style={styles.unbanBtn}
                        onClick={() => handleUnbanUser(user._id)}
                      >
                        ✅
                      </button>
                    ) : (
                      <button
                        style={styles.banBtn}
                        onClick={() => handleBanUser(user._id)}
                      >
                        🚫
                      </button>
                    )}
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteUser(user._id)}
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

      {/* USER DETAILS MODAL */}
      {showModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowModal(false)}
          token={token}
        />
      )}
    </div>
  )
}

// User Details Modal
function UserDetailsModal({ user, onClose, token }) {
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)



  const fetchUserDetails = async () => {
    try {
      const res = await axios.get(
        `/api/admin/users/${user._id}`,
        { headers: { Authorization: token } }
      )
      setUserDetails(res.data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching user details:', error)
      setLoading(false)
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {loading ? (
          <p>Loading...</p>
        ) : userDetails ? (
          <>
            <h2 style={styles.modalTitle}>{user.name}</h2>
            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <span style={styles.label}>Email:</span>
                <span>{user.email}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Role:</span>
                <span style={styles.badge}>{user.role}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Status:</span>
                <span style={styles.badge}>{user.isBanned ? '🚫 Banned' : '✅ Active'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Projects:</span>
                <span>{userDetails.stats?.projectCount || 0}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Versions:</span>
                <span>{userDetails.stats?.versionCount || 0}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Feedback:</span>
                <span>{userDetails.stats?.feedbackCount || 0}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Joined:</span>
                <span>{new Date(user.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </>
        ) : null}
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
  roleSelect: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
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
  viewBtn: {
    padding: '6px 10px',
    backgroundColor: '#e3f2fd',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  banBtn: {
    padding: '6px 10px',
    backgroundColor: '#fee',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  unbanBtn: {
    padding: '6px 10px',
    backgroundColor: '#f0fdf4',
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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer'
  },
  modalTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#333'
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  },
  label: {
    fontWeight: '600',
    color: '#666'
  }
}

export default UserManagement