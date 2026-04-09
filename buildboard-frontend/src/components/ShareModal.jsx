import { useState, useEffect } from 'react'
import axios from 'axios'

function ShareModal({ projectId, projectTitle, token, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [sharedWithUsers, setSharedWithUsers] = useState([])
  const [searchUser, setSearchUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Load data only once per projectId
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        console.log('📥 Loading reviewers and shared users...')
        
        // Fetch reviewers
        const usersRes = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: token },
          timeout: 5000
        })
        
        setUsers(usersRes.data || [])
        console.log('✅ Reviewers loaded:', usersRes.data?.length)

        // Fetch project to get currently shared users
        try {
          const projectRes = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
            headers: { Authorization: token },
            timeout: 5000
          })
          
          const sharedUsers = projectRes.data.sharedWith || []
          const filteredSharedUsers = sharedUsers.filter(u => u.role === 'reviewer')
          setSharedWithUsers(filteredSharedUsers)
          console.log('✅ Shared reviewers loaded:', filteredSharedUsers.length)
        } catch (projectErr) {
          console.warn('⚠️ Could not load shared users:', projectErr.message)
          setSharedWithUsers([])
        }
        
        setError('')
      } catch (err) {
        console.error('❌ Load error:', err.message)
        setError('Failed to load reviewers')
        setUsers([])
        setSharedWithUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    if (token && projectId) {
      loadData()
    }
  }, [projectId, token])

  // Filter users: search + exclude already shared
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchUser.toLowerCase())
    const alreadyShared = sharedWithUsers.some(su => su._id === user._id)
    return matchesSearch && !alreadyShared
  })

  const handleSelectUser = (userId) => {
    if (!selectedUsers.includes(userId)) {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleRemoveSelected = (userId) => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId))
  }

  const handleShareWithMultiple = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one reviewer')
      return
    }

    try {
      setLoading(true)
      setError('')
      const shareCount = selectedUsers.length

      console.log('🔄 Sharing with users:', selectedUsers)

      // Share with each selected user
      for (const userId of selectedUsers) {
        await axios.post(
          'http://localhost:5000/api/projects/share',
          { projectId, userId },
          { headers: { Authorization: token }, timeout: 5000 }
        )
      }

      console.log('✅ All shares completed!')
      setSelectedUsers([])
      setSearchUser('')
      onSuccess(`Project shared with ${shareCount} user(s)!`)
      
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share project')
      console.error('Share error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAccess = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user\'s access?')) return

    try {
      console.log('🗑️ Removing access for user:', userId)

      await axios.post(
        'http://localhost:5000/api/projects/remove-access',
        { projectId, userId },
        { headers: { Authorization: token }, timeout: 5000 }
      )

      // Reload shared users after removal
      const projectRes = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { Authorization: token }
      })
      
      const sharedUsers = projectRes.data.sharedWith || []
      const filteredSharedUsers = sharedUsers.filter(u => u.role === 'reviewer')
      setSharedWithUsers(filteredSharedUsers)
      
      console.log('✅ Access removed!')
      onSuccess('User access removed successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove access')
      console.error('Remove error:', err)
    }
  }

  const selectedUserData = users.filter(u => selectedUsers.includes(u._id))

  if (isLoading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p style={{ textAlign: 'center', color: '#999', padding: '24px' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>📤 Share Project</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={styles.subtitle}>"{projectTitle}"</p>

        {error && <div style={styles.errorMsg}>{error}</div>}

        {/* Currently Shared With Section */}
        {sharedWithUsers.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👥 Currently Shared With ({sharedWithUsers.length})</h3>
            <div style={styles.sharedUsersList}>
              {sharedWithUsers.map((user) => (
                <div key={user._id} style={styles.sharedUserItem}>
                  <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={styles.userName}>{user.name}</p>
                      <p style={styles.userEmail}>{user.email}</p>
                    </div>
                  </div>
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemoveAccess(user._id)}
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add More Reviewers Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🔗 Add More Reviewers</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Search Reviewers:</label>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by name or email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>

          <div style={styles.availableUsers}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  style={styles.userOption}
                  onClick={() => handleSelectUser(user._id)}
                >
                  <div style={styles.userCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      readOnly
                      style={styles.checkbox}
                    />
                  </div>
                  <div style={styles.userOptionInfo}>
                    <p style={styles.optionName}>{user.name}</p>
                    <p style={styles.optionEmail}>{user.email}</p>
                  </div>
                  <span style={styles.reviewerBadge}>Reviewer</span>
                </div>
              ))
            ) : (
              <p style={styles.noUsers}>
                {users.length === 0 ? '📭 No reviewers available' : '✅ All reviewers already have access'}
              </p>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div style={styles.selectedSection}>
              <h4 style={styles.selectedTitle}>
                📝 To Be Shared ({selectedUsers.length})
              </h4>
              <div style={styles.selectedList}>
                {selectedUserData.map((user) => (
                  <div key={user._id} style={styles.selectedItem}>
                    <span>{user.name}</span>
                    <button
                      style={styles.removeSelectedBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSelected(user._id)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button
            style={{
              ...styles.shareBtn,
              opacity: selectedUsers.length === 0 || loading ? 0.6 : 1,
              cursor: selectedUsers.length === 0 || loading ? 'not-allowed' : 'pointer'
            }}
            onClick={handleShareWithMultiple}
            disabled={selectedUsers.length === 0 || loading}
          >
            {loading ? 'Sharing...' : `✓ Share with ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
          </button>
          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#333'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999'
  },
  subtitle: {
    margin: '16px 0 24px',
    fontSize: '14px',
    color: '#888',
    fontStyle: 'italic'
  },
  errorMsg: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#c3103b',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: '600'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  sharedUsersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sharedUserItem: {
    padding: '12px 16px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flex: 1
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  userName: {
    margin: '0 0 4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  userEmail: {
    margin: 0,
    fontSize: '12px',
    color: '#888'
  },
  removeBtn: {
    padding: '6px 12px',
    backgroundColor: '#fee2e2',
    color: '#c3103b',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  availableUsers: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    maxHeight: '250px',
    overflowY: 'auto',
    marginBottom: '16px'
  },
  userOption: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'background-color 0.2s'
  },
  userCheckbox: {
    display: 'flex',
    alignItems: 'center'
  },
  checkbox: {
    cursor: 'pointer'
  },
  userOptionInfo: {
    flex: 1
  },
  optionName: {
    margin: '0 0 4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  optionEmail: {
    margin: 0,
    fontSize: '12px',
    color: '#888'
  },
  reviewerBadge: {
    padding: '2px 8px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  noUsers: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontSize: '13px',
    margin: 0
  },
  selectedSection: {
    padding: '12px 16px',
    backgroundColor: '#eef2ff',
    borderRadius: '8px',
    border: '1px solid #c7d2fe'
  },
  selectedTitle: {
    margin: '0 0 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4f46e5'
  },
  selectedList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  selectedItem: {
    padding: '6px 12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  removeSelectedBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '16px'
  },
  shareBtn: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#e5e7eb',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  }
}

export default ShareModal