import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'

function Feedback() {
  const { versionId } = useParams()
  const navigate = useNavigate()

  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    comment: '',
    status: 'pending'
  })

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ✅ Fetch feedback on mount
  useEffect(() => {
    if (!versionId) {
      setError('No version ID provided')
      setLoading(false)
      return
    }

    fetchFeedback()
  }, [versionId])

  // ✅ Fetch all feedback for this version
  const fetchFeedback = async () => {
    try {
      console.log('📥 Fetching feedback for version:', versionId)
      setLoading(true)
      setError(null)

      const res = await axios.get(
        `http://localhost:5000/api/feedback/version/${versionId}`,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      console.log('✅ Feedback fetched:', res.data.length)
      setFeedback(res.data)
      setLoading(false)
    } catch (err) {
      console.error('❌ Error fetching feedback:', err.message)
      setError(`Failed to load feedback: ${err.message}`)
      setLoading(false)
    }
  }

  // ✅ Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ✅ Handle submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.comment.trim()) {
      alert('Please enter a comment')
      return
    }

    try {
      console.log('💬 Submitting feedback...')

      const res = await axios.post(
        `http://localhost:5000/api/feedback`,
        {
          versionId,
          comment: formData.comment,
          status: formData.status
        },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('✅ Feedback submitted:', res.data)
      alert('✅ Feedback submitted successfully!')

      // Reset form
      setFormData({
        comment: '',
        status: 'pending'
      })
      setShowForm(false)

      // Refresh feedback list
      fetchFeedback()
    } catch (err) {
      console.error('❌ Submit error:', err.message)
      alert(`Submit failed: ${err.response?.data?.message || err.message}`)
    }
  }

  // ✅ Handle delete feedback
  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return
    }

    try {
      console.log('🗑️ Deleting feedback:', feedbackId)

      await axios.delete(
        `http://localhost:5000/api/feedback/${feedbackId}`,
        {
          headers: {
            Authorization: token
          }
        }
      )

      console.log('✅ Feedback deleted')
      alert('✅ Feedback deleted successfully!')
      fetchFeedback()
    } catch (err) {
      console.error('❌ Delete error:', err.message)
      alert(`Delete failed: ${err.message}`)
    }
  }

  // ✅ Handle mark as resolved
  const handleResolve = async (feedbackId) => {
    try {
      console.log('✅ Resolving feedback:', feedbackId)

      await axios.put(
        `http://localhost:5000/api/feedback/${feedbackId}`,
        { status: 'resolved' },
        {
          headers: {
            Authorization: token
          }
        }
      )

      console.log('✅ Feedback resolved')
      fetchFeedback()
    } catch (err) {
      console.error('❌ Resolve error:', err.message)
      alert(`Failed to resolve: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.navbar}>
          <h2 style={styles.logo}>BuildBoard+</h2>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div style={styles.body}>
          <p style={{ textAlign: 'center', marginTop: '40px' }}>⏳ Loading feedback...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.navbar}>
          <h2 style={styles.logo}>BuildBoard+</h2>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div style={styles.body}>
          <div style={styles.errorBox}>
            <p>❌ {error}</p>
            <button style={styles.retryBtn} onClick={fetchFeedback}>
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* ✅ NAVBAR */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        <div style={styles.navRight}>
          <span style={styles.username}>👋 {user?.name}</span>
          <button 
            style={styles.backBtn} 
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* ✅ BODY */}
      <div style={styles.body}>
        <div style={styles.topRow}>
          <h1 style={styles.title}>💬 Feedback</h1>
          <button
            style={styles.addBtn}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '➕ Add Feedback'}
          </button>
        </div>

        {/* ✅ ADD FEEDBACK FORM */}
        {showForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>💬 Add New Feedback</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Comment *</label>
              <textarea
                name="comment"
                placeholder="Enter your feedback..."
                value={formData.comment}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="4"
                autoFocus
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="pending">⏳ Pending</option>
                <option value="in_progress">🔄 In Progress</option>
                <option value="resolved">✅ Resolved</option>
              </select>
            </div>

            <div style={styles.formActions}>
              <button
                style={styles.submitBtn}
                onClick={handleSubmit}
              >
                ✓ Submit Feedback
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    comment: '',
                    status: 'pending'
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ✅ FEEDBACK LIST */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 All Feedback ({feedback.length})</h2>

          {feedback.length === 0 ? (
            <div style={styles.empty}>
              <p>📭 No feedback yet. Click "➕ Add Feedback" to start!</p>
            </div>
          ) : (
            <div style={styles.list}>
              {feedback.map((item) => (
                <div key={item._id} style={styles.feedbackItem}>
                  <div style={styles.feedbackHeader}>
                    <div>
                      <p style={styles.feedbackAuthor}>
                        👤 {item.reviewerId?.name || 'Anonymous'}
                      </p>
                      <p style={styles.feedbackDate}>
                        📅 {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      ...(item.status === 'resolved' ? styles.resolvedBadge :
                         item.status === 'in_progress' ? styles.progressBadge :
                         styles.pendingBadge)
                    }}>
                      {item.status === 'resolved' ? '✅ Resolved' :
                       item.status === 'in_progress' ? '🔄 In Progress' :
                       '⏳ Pending'}
                    </span>
                  </div>

                  <p style={styles.feedbackComment}>
                    {item.comment}
                  </p>

                  <div style={styles.feedbackActions}>
                    {item.status !== 'resolved' && (
                      <button
                        style={styles.resolveBtn}
                        onClick={() => handleResolve(item._id)}
                      >
                        ✅ Mark Resolved
                      </button>
                    )}
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(item._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#4f46e5',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexShrink: 0
  },
  logo: { margin: 0, color: '#fff', fontSize: '24px', fontWeight: '700' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { color: '#fff', fontSize: '14px', fontWeight: '500' },
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
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%'
  },

  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: { margin: 0, fontSize: '32px', color: '#333', fontWeight: '700' },
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },

  form: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '32px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    border: '2px solid #4f46e5'
  },
  formTitle: {
    margin: '0 0 20px',
    fontSize: '18px',
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
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#e5e7eb',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },

  section: { marginBottom: '32px' },
  sectionTitle: { margin: '0 0 16px', fontSize: '20px', fontWeight: '600', color: '#333' },

  empty: {
    backgroundColor: '#fff',
    padding: '40px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#999'
  },

  list: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },

  feedbackItem: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    transition: 'all 0.2s'
  },

  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  feedbackAuthor: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' },
  feedbackDate: { margin: '4px 0 0', fontSize: '12px', color: '#999' },

  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309'
  },
  progressBadge: {
    backgroundColor: '#dbeafe',
    color: '#0369a1'
  },
  resolvedBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },

  feedbackComment: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5'
  },

  feedbackActions: {
    display: 'flex',
    gap: '8px'
  },
  resolveBtn: {
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },

  errorBox: {
    backgroundColor: '#fee',
    border: '2px solid #ef4444',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    color: '#dc2626'
  },
  retryBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default Feedback