import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"

function Versions() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [versions, setVersions] = useState([])
  const [description, setDescription] = useState("")
  const [file, setFile] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    fetchVersions()
  }, [projectId])

  const fetchVersions = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/versions/${projectId}`,
        {
          headers: { Authorization: token },
        }
      )
      setVersions(res.data)
      setError("")
    } catch (err) {
      setError("Failed to load versions")
      console.log(err)
    }
  }

  const handleAddVersion = async () => {
    if (!description.trim()) {
      setError("Please enter a description")
      return
    }
    if (!file) {
      setError("Please select a file")
      return
    }

    try {
      setUploading(true)
      setError("")
      const formData = new FormData()
      formData.append("projectId", projectId)
      formData.append("description", description)
      formData.append("file", file)

      await axios.post(
        "http://localhost:5000/api/versions",
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      setDescription("")
      setFile(null)
      setShowForm(false)
      fetchVersions()
    } catch (err) {
      setError("Failed to upload version. Please try again.")
      console.log(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Back to Projects
        </button>
        <h1 style={styles.title}>Project Versions</h1>
      </div>

      {/* Error Message */}
      {error && <div style={styles.errorMsg}>{error}</div>}

      {/* Top Row */}
      <div style={styles.topRow}>
        <h3 style={styles.heading}>All Versions</h3>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Version"}
        </button>
      </div>

      {/* Add Version Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>📤 Upload New Version</h4>
          
          <input
            style={styles.input}
            placeholder="Version Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />

          <div style={styles.fileInputContainer}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.fileInput}
              disabled={uploading}
            />
            {file && <p style={styles.fileName}>✓ {file.name}</p>}
          </div>

          <button 
            style={styles.submitBtn} 
            onClick={handleAddVersion}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Add Version"}
          </button>
        </div>
      )}

      {/* Versions List */}
      {versions.length === 0 ? (
        <div style={styles.empty}>
          <p>📭 No versions yet. Upload your first version above!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {versions.map((version, index) => (
            <div key={version._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h4 style={styles.versionTitle}>
                  Version {versions.length - index}
                </h4>
                <span style={styles.date}>
                  {new Date(version.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p style={styles.desc}>{version.description}</p>

              {version.file && (
                <p style={styles.fileInfo}>
                  📎 {version.file}
                </p>
              )}

              <div style={styles.btnGroup}>
                {/* Download Button */}
                {version.file && (
                  <a
                    href={`http://localhost:5000/uploads/${version.file}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadBtn}
                  >
                    ⬇️ Download File
                  </a>
                )}

                {/* Feedback Button */}
                <button
                  style={styles.feedbackBtn}
                  onClick={() => navigate(`/feedback/${version._id}`)}
                >
                  💬 View Feedback →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  },
  title: {
    margin: "0",
    fontSize: "28px",
    color: "#333",
  },
  errorMsg: {
    padding: "12px 16px",
    backgroundColor: "#fee",
    color: "#c33",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  heading: {
    margin: "0",
    fontSize: "20px",
    color: "#333",
  },
  addBtn: {
    padding: "8px 16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  form: {
    marginBottom: "20px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  formTitle: {
    margin: "0 0 16px",
    fontSize: "16px",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    marginBottom: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  fileInputContainer: {
    marginBottom: "12px",
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    marginBottom: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  fileName: {
    margin: "0",
    fontSize: "13px",
    color: "#10b981",
  },
  submitBtn: {
    padding: "10px 24px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    padding: "60px 24px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    color: "#888",
    marginTop: "20px",
  },
  grid: {
    display: "grid",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    borderLeft: "4px solid #4f46e5",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  versionTitle: {
    margin: "0",
    fontSize: "16px",
    color: "#333",
  },
  date: {
    fontSize: "12px",
    color: "#777",
  },
  desc: {
    margin: "0 0 10px",
    color: "#666",
    fontSize: "14px",
  },
  fileInfo: {
    margin: "0 0 14px",
    color: "#4f46e5",
    fontSize: "13px",
  },
  btnGroup: {
    display: "flex",
    gap: "10px",
  },
  downloadBtn: {
    flex: 1,
    padding: "8px 12px",
    backgroundColor: "#eef2ff",
    color: "#4f46e5",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "bold",
  },
  feedbackBtn: {
    flex: 1,
    padding: "8px 12px",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
}

export default Versions