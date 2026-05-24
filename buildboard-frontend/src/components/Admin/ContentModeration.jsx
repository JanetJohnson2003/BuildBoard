import { useState, useEffect } from 'react'
import axios from 'axios'

function ContentModeration() {
  const [flaggedFeedback, setFlaggedFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchFlaggedFeedback()
  }, [])

  const fetchFlaggedFeedback = async () => {
    try {
      console.log('🚩 Fetching flagged feedback...')
      setLoading(true)

      const res = await axios.get('http://localhost:5000/api/admin/moderation/feedback', {
        headers: { Authorization: token }
      })

      console.log('✅ Flagged feedback fetched:', res.data.length)
      setFlaggedFeedback(res.data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching flagged feedback:', error)
      setLoading(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return

    try {
      console.log('🗑️ Deleting feedback...')

      await axios.delete(
        `http://localhost:5000/api/admin/feedback/${feedbackId}`,
        { headers: { Authorization: token } }
      )

      alert('✅ Feedback deleted successfully')
      fetchFlaggedFeedback()
    } catch (error) {
      alert('❌ Error deleting feedback')
    }
  }

  if (loading) {
    return <div style={styles.loading}>⏳ Loading flagged content...</div>
  }

  if (flaggedFeedback.length === 0) {
    return (
      <div style={styles.empty}>
        <p>✅ No flagged feedback. Your platform is clean!</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🚩 Flagged Feedback ({flaggedFeedback.length})</h2>

      <div style={styles.feedbackList}>
        {flaggedFeedback.map((feedback) => (
          <div key={feedback._id} style={styles.feedbackCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.reviewer}>👤 {feedback.reviewerId?.name}</p>
                <p style={styles.email}>{feedback.reviewerId?.email}</p>
              </div>
              <span style={styles.flag}>🚩 Flagged</span>
            </div>

            <div style={styles.cardBody}>
              <p style={styles.comment}>{feedback.comment}</p>
              <p style={styles.reason}>
                <strong>Reason:</strong> {feedback.flagReason || 'No reason provided'}
              </p>
            </div>

            <div style={styles.cardFooter}>
              <p style={styles.date}>
                📅 {new Date(feedback.createdAt).toLocaleString()}
              </p>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDeleteFeedback(feedback._id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
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
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#333'
  },
  feedbackList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    borderLeft: '4px solid #ef4444'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '15px',
    backgroundColor: '#fef2f2'
  },
  reviewer: {
    margin: '0 0 5px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  email: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  flag: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  cardBody: {
    padding: '15px',
    borderBottom: '1px solid #eee'
  },
  comment: {
    margin: '0 0 10px',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5'
  },
  reason: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px'
  },
  date: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  deleteBtn: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#666',
    fontSize: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
}

export default ContentModeration