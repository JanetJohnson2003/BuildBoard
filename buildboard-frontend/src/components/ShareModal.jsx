import { useState, useEffect } from 'react';
import axios from 'axios';

function ShareModal({ projectId, onClose, onShare }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // ✅ FIXED: Fetch users on mount only
  useEffect(() => {
    fetchUsers();
  }, []); // ✅ EMPTY dependency array - fetch only once

  // ✅ FIXED: Fetch users with increased timeout
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📥 Fetching users...');
      
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { 
          Authorization: token,
          'Content-Type': 'application/json'
        },
        timeout: 10000  // ✅ CHANGED FROM 5000 to 10000
      });
      
      console.log('✅ Users fetched:', res.data.length);
      setUsers(res.data);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching users:', err.message);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      setSharing(true);
      console.log('📤 Sharing project with users:', selectedUsers);

      const res = await axios.post(
        `http://localhost:5000/api/projects/${projectId}/share`,
        { sharedWith: selectedUsers },
        { 
          headers: { 
            Authorization: token,
            'Content-Type': 'application/json'
          },
          timeout: 10000  // ✅ INCREASED TIMEOUT for share endpoint too
        }
      );

      console.log('✅ Project shared successfully');
      console.log(res.data);

      if (onShare) {
        onShare();
      }

      onClose();
    } catch (err) {
      console.error('❌ Share error:', err);
      setError(err.response?.data?.message || 'Failed to share project');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <div style={styles.header}>
          <h2 style={styles.title}>📤 Add More Reviewers</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <div style={styles.searchBox}>
          <label style={styles.label}>Search Reviewers:</label>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div style={styles.usersContainer}>
          {loading ? (
            <p style={styles.loadingText}>⏳ Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={styles.noUsersText}>❌ No users found</p>
          ) : (
            filteredUsers.map(user => (
              <div key={user._id} style={styles.userItem}>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleSelectUser(user._id)}
                  style={styles.checkbox}
                  id={`user-${user._id}`}
                />
                <label htmlFor={`user-${user._id}`} style={styles.userLabel}>
                  <div>
                    <p style={styles.userName}>{user.name}</p>
                    <p style={styles.userEmail}>{user.email}</p>
                  </div>
                </label>
                <span style={styles.userRole}>{user.role}</span>
              </div>
            ))
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div style={styles.selectedBox}>
            <p style={styles.selectedLabel}>
              📋 To Be Shared ({selectedUsers.length})
            </p>
            <div style={styles.selectedTags}>
              {selectedUsers.map(userId => {
                const user = users.find(u => u._id === userId);
                return (
                  <div key={userId} style={styles.tag}>
                    <span>{user?.name}</span>
                    <button
                      style={styles.tagCloseBtn}
                      onClick={() => handleSelectUser(userId)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.actions}>
          <button
            style={{
              ...styles.shareBtn,
              opacity: sharing || selectedUsers.length === 0 ? 0.6 : 1,
              cursor: sharing ? 'not-allowed' : 'pointer'
            }}
            onClick={handleShare}
            disabled={sharing || selectedUsers.length === 0}
          >
            {sharing ? '⏳ Sharing...' : `✓ Share with ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
          </button>
          <button
            style={styles.cancelBtn}
            onClick={onClose}
            disabled={sharing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    width: '30px',
    height: '30px'
  },
  errorBox: {
    padding: '12px 20px',
    backgroundColor: '#fee',
    borderLeft: '4px solid #ef4444'
  },
  errorText: {
    margin: 0,
    color: '#c33',
    fontSize: '14px',
    fontWeight: '500'
  },
  searchBox: {
    padding: '16px 20px',
    borderBottom: '1px solid #eee'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  usersContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  },
  loadingText: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px',
    margin: 0
  },
  noUsersText: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px',
    margin: 0
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '8px',
    border: '1px solid #eee',
    cursor: 'pointer',
    backgroundColor: '#fafafa'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    marginRight: '12px',
    accentColor: '#4f46e5'
  },
  userLabel: {
    flex: 1,
    cursor: 'pointer',
    margin: 0
  },
  userName: {
    margin: '0 0 2px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  userEmail: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  userRole: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  selectedBox: {
    padding: '16px 20px',
    backgroundColor: '#f0fdf4',
    borderTop: '1px solid #dcfce7'
  },
  selectedLabel: {
    margin: '0 0 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#166534'
  },
  selectedTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  tagCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0
  },
  actions: {
    padding: '16px 20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '12px'
  },
  shareBtn: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#e5e7eb',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default ShareModal;