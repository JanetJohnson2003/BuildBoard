import { useState } from 'react'
import axios from 'axios'

function FeedbackThread({ feedback, token, onUpdate }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddReply = async () => {
    if (!replyText.trim()) return

    try {
      setLoading(true)
      const res = await axios.post(
        `http://localhost:5000/api/feedback/${feedback._id}/reply`,
        { comment: replyText },
        { headers: { Authorization: token } }
      )
      setReplyText('')
      setShowReplyForm(false)
      onUpdate(res.data)
    } catch (err) {
      console.error('Failed to add reply:', err)
      alert('Failed to add reply')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/feedback/${feedback._id}/reply/${replyId}`,
        { headers: { Authorization: token } }
      )
      onUpdate(res.data)
    } catch (err) {
      console.error('Failed to delete reply:', err)
      alert('Failed to delete reply')
    }
  }

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating)
  }

  return (
    <div style={styles.threadContainer}>
      {/* Main Feedback */}
      <div style={styles.mainFeedback}>
        <div style={styles.feedbackHeader}>
          <div style={styles.avatarName}>
            <div style={styles.avatar}>
              {feedback.reviewer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 style={styles.reviewerName}>{feedback.reviewer.name}</h4>
              <span style={styles.email}>{feedback.reviewer.email}</span>
            </div>
          </div>
          <span style={styles.date}>
            {new Date(feedback.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div style={styles.feedbackContent}>
          <div style={styles.rating}>
            {getRatingStars(feedback.rating)}
          </div>
          <p style={styles.comment}>{feedback.comment}</p>
        </div>

        <button
          style={styles.replyBtn}
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          💬 Reply
        </button>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div style={styles.replyFormContainer}>
          <textarea
            style={styles.replyInput}
            placeholder="Write your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows="3"
          />
          <div style={styles.formActions}>
            <button
              style={styles.submitBtn}
              onClick={handleAddReply}
              disabled={loading}
            >
              {loading ? 'Posting...' : '✓ Post Reply'}
            </button>
            <button
              style={styles.cancelBtn}
              onClick={() => {
                setShowReplyForm(false)
                setReplyText('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {feedback.replies && feedback.replies.length > 0 && (
        <div style={styles.repliesContainer}>
          {feedback.replies.map((reply) => (
            <div key={reply._id} style={styles.reply}>
              <div style={styles.replyHeader}>
                <div style={styles.avatarName}>
                  <div style={styles.replyAvatar}>
                    {reply.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 style={styles.replyAuthor}>{reply.author.name}</h5>
                    <span style={styles.email}>{reply.author.email}</span>
                  </div>
                </div>
                <span style={styles.date}>
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p style={styles.replyComment}>{reply.comment}</p>

              <button
                style={styles.deleteReplyBtn}
                onClick={() => handleDeleteReply(reply._id)}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  threadContainer: {
    marginBottom: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #4f46e5'
  },
  mainFeedback: {
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  avatarName: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  reviewerName: {
    margin: '0 0 4px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  email: {
    fontSize: '12px',
    color: '#888'
  },
  date: {
    fontSize: '12px',
    color: '#bbb'
  },
  feedbackContent: {
    marginBottom: '12px'
  },
  rating: {
    fontSize: '16px',
    marginBottom: '8px'
  },
  comment: {
    margin: '0',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6'
  },
  replyBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    padding: '0'
  },
  replyFormContainer: {
    padding: '16px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #eee'
  },
  replyInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: '12px',
    resize: 'vertical'
  },
  formActions: {
    display: 'flex',
    gap: '8px'
  },
  submitBtn: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#eee',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  repliesContainer: {
    padding: '0'
  },
  reply: {
    padding: '16px 20px 16px 48px',
    borderLeft: '2px solid #10b981',
    backgroundColor: '#f9fafb'
  },
  replyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  replyAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  replyAuthor: {
    margin: '0 0 2px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  replyComment: {
    margin: '0 0 8px',
    fontSize: '13px',
    color: '#555',
    lineHeight: '1.5'
  },
  deleteReplyBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '0'
  }
}

export default FeedbackThread