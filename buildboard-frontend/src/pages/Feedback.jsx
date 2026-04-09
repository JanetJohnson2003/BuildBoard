import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import FeedbackThread from "../components/FeedbackThread"

function Feedback() {
  const { versionId } = useParams()
  const navigate = useNavigate()

  const [feedbacks, setFeedbacks] = useState([])
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState("5")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    fetchFeedback()
  }, [versionId])

  const fetchFeedback = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/feedback/${versionId}`,
        {
          headers: { Authorization: token },
        }
      )
      setFeedbacks(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const handleAddFeedback = async (e) => {
    e.preventDefault()

    if (!comment.trim()) {
      setError("Please enter feedback")
      return
    }

    if (!rating) {
      setError("Please select a rating")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      await axios.post(
        "http://localhost:5000/api/feedback",
        {
          versionId,
          comment,
          rating: parseInt(rating),
        },
        {
          headers: { Authorization: token },
        }
      )

      setComment("")
      setRating("5")
      fetchFeedback()
      alert("Feedback submitted successfully!")
    } catch (err) {
      setError("Failed to submit feedback. Please try again.")
      console.log(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle feedback update (when replies are added)
  const handleFeedbackUpdate = (updatedFeedback) => {
    setFeedbacks(feedbacks.map(f => f._id === updatedFeedback._id ? updatedFeedback : f))
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>💬 Feedback & Reviews</h1>
      </div>

      {/* Add Feedback Form */}
      <div style={styles.form}>
        <h3 style={styles.formTitle}>📝 Add Your Feedback</h3>

        {error && <div style={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleAddFeedback}>
          <textarea
            style={styles.textarea}
            placeholder="Enter your feedback/comments..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
          />

          <div style={styles.ratingContainer}>
            <label style={styles.label}>Rating:</label>
            <select
              style={styles.select}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              disabled={submitting}
            >
              <option value="1">⭐ Poor</option>
              <option value="2">⭐⭐ Fair</option>
              <option value="3">⭐⭐⭐ Good</option>
              <option value="4">⭐⭐⭐⭐ Very Good</option>
              <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
            </select>
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={submitting || !comment.trim()}
          >
            {submitting ? "Submitting..." : "✓ Submit Feedback"}
          </button>
        </form>
      </div>

      {/* Feedback List with Threading */}
      <div style={styles.feedbackSection}>
        <h3 style={styles.sectionTitle}>All Feedback ({feedbacks.length})</h3>

        {feedbacks.length === 0 ? (
          <div style={styles.empty}>
            <p>No feedback yet. Be the first to review!</p>
          </div>
        ) : (
          <div style={styles.feedbackList}>
            {feedbacks.map((fb) => (
              <FeedbackThread
                key={fb._id}
                feedback={fb}
                token={token}
                onUpdate={handleFeedbackUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  header: {
    marginBottom: "32px",
  },
  backBtn: {
    padding: "8px 16px",
    backgroundColor: "#eef2ff",
    color: "#4f46e5",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "16px",
    fontWeight: "bold",
  },
  title: {
    margin: "0",
    fontSize: "28px",
    color: "#333",
  },
  form: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "32px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  formTitle: {
    margin: "0 0 16px",
    fontSize: "18px",
    color: "#333",
  },
  errorMsg: {
    padding: "12px 16px",
    backgroundColor: "#fee",
    color: "#c33",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    marginBottom: "16px",
    boxSizing: "border-box",
    minHeight: "120px",
    resize: "vertical",
  },
  ratingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 24px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  feedbackSection: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    margin: "0 0 20px",
    fontSize: "18px",
    color: "#333",
  },
  empty: {
    textAlign: "center",
    padding: "40px 24px",
    color: "#888",
    fontSize: "15px",
  },
  feedbackList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
}

export default Feedback