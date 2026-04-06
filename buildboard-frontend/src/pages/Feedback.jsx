import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function Feedback() {
  const { versionId } = useParams();

  const [feedbacks, setFeedbacks] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/feedback/${versionId}`,
        {
          headers: { Authorization: token },
        }
      );
      setFeedbacks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddFeedback = async () => {
    if (!comment || !rating) {
      return alert("Enter comment and rating");
    }

    try {
      await axios.post(
        "http://localhost:5000/api/feedback",
        {
          version: versionId,
          comment,
          rating,
        },
        {
          headers: { Authorization: token },
        }
      );

      setComment("");
      setRating("");
      fetchFeedback();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Feedback</h2>

      {/* Add Feedback (ONLY REVIEWER) */}
      {role === "reviewer" && (
        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Enter comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Rating (1-5)"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />

          <button style={styles.addBtn} onClick={handleAddFeedback}>
            Add Feedback
          </button>
        </div>
      )}

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <p>No feedback yet</p>
      ) : (
        <div style={styles.grid}>
          {feedbacks.map((fb) => (
            <div key={fb._id} style={styles.card}>
              <p style={styles.comment}>{fb.comment}</p>
              <p style={styles.rating}>⭐ {fb.rating}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  heading: {
    marginBottom: "20px",
  },
  form: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  addBtn: {
    padding: "8px 16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gap: "15px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "10px",
  },
  comment: {
    marginBottom: "8px",
  },
  rating: {
    color: "#f59e0b",
  },
};

export default Feedback;