import { useState, useEffect } from 'react'
import axios from 'axios'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) return

    fetchNotifications()
    
    // Poll for new notifications every 15 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 15000)

    return () => clearInterval(interval)
  }, [token])

  const fetchNotifications = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const res = await axios.get(
        '/api/notifications',
        { 
          headers: { Authorization: token },
          timeout: 5000
        }
      )
      setNotifications(res.data || [])
      setUnreadCount(res.data.filter(n => !n.read).length)
    } catch (err) {
      console.log('Failed to load notifications (this is ok if disabled):', err.message)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (!token) return
    
    try {
      const res = await axios.get(
        '/api/notifications/unread-count',
        { 
          headers: { Authorization: token },
          timeout: 5000
        }
      )
      setUnreadCount(res.data.unreadCount || 0)
    } catch (err) {
      console.log('Failed to load unread count:', err.message)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: token } }
      )
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark as read', err)
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(
        `/api/notifications/${notificationId}`,
        { headers: { Authorization: token } }
      )
      fetchNotifications()
    } catch (err) {
      console.error('Failed to delete notification', err)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'project_shared':
        return '📤'
      case 'feedback_added':
        return '💬'
      case 'version_uploaded':
        return '📁'
      default:
        return '🔔'
    }
  }

  return (
    <div style={styles.container}>
      {/* Bell Icon Button */}
      <button
        style={styles.bellBtn}
        onClick={() => setShowPanel(!showPanel)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Notifications Panel */}
      {showPanel && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Notifications</h3>
            <button
              style={styles.closeBtn}
              onClick={() => setShowPanel(false)}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div style={styles.empty}>
              <p>Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.empty}>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div style={styles.notificationsList}>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  style={{
                    ...styles.notificationItem,
                    ...(notif.read ? styles.notificationItemRead : styles.notificationItemUnread)
                  }}
                >
                  <div style={styles.notifContent}>
                    <div style={styles.notifIcon}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={styles.notifText}>
                      <h5 style={styles.notifTitle}>{notif.title}</h5>
                      <p style={styles.notifMessage}>{notif.message}</p>
                      <span style={styles.notifDate}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={styles.notifActions}>
                    {!notif.read && (
                      <button
                        style={styles.markReadBtn}
                        onClick={() => handleMarkAsRead(notif._id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(notif._id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    position: 'relative'
  },
  bellBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px'
  },
  badge: {
    position: 'absolute',
    top: '0',
    right: '0',
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  panel: {
    position: 'absolute',
    top: '50px',
    right: '-20px',
    width: '400px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxHeight: '500px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f9fa'
  },
  panelTitle: {
    margin: '0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#999'
  },
  empty: {
    padding: '40px 24px',
    textAlign: 'center',
    color: '#999'
  },
  notificationsList: {
    overflowY: 'auto',
    maxHeight: '400px'
  },
  notificationItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    transition: 'background-color 0.2s'
  },
  notificationItemUnread: {
    backgroundColor: '#eef2ff'
  },
  notificationItemRead: {
    backgroundColor: '#fff'
  },
  notifContent: {
    display: 'flex',
    gap: '12px',
    flex: 1
  },
  notifIcon: {
    fontSize: '20px',
    minWidth: '20px'
  },
  notifText: {
    flex: 1
  },
  notifTitle: {
    margin: '0 0 4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  notifMessage: {
    margin: '0 0 6px',
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.4'
  },
  notifDate: {
    fontSize: '11px',
    color: '#999'
  },
  notifActions: {
    display: 'flex',
    gap: '6px'
  },
  markReadBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#4f46e5',
    padding: '4px 8px'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#ef4444',
    padding: '4px 8px'
  }
}

export default Notifications