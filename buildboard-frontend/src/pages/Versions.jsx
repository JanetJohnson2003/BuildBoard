import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import Toast from "../components/Toast"

function Versions() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [versions, setVersions] = useState([])
  const [versionNumber, setVersionNumber] = useState("")
  const [releaseNotes, setReleaseNotes] = useState("")
  const [file, setFile] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    fetchVersions()
  }, [projectId])

  const fetchVersions = async () => {
    try {
      console.log('📥 Fetching versions for project:', projectId)
      const res = await axios.get(
        `http://localhost:5000/api/versions/${projectId}`,
        {
          headers: { Authorization: token },
        }
      )
      setVersions(res.data)
      console.log('✅ Versions fetched:', res.data.length)
    } catch (err) {
      showToast('Failed to load versions', 'error')
      console.error('Error:', err.message)
    }
  }

  const handleAddVersion = async () => {
    if (!versionNumber.trim()) {
      showToast('Please enter version number (e.g., 1.0)', 'error')
      return
    }
    if (!file) {
      showToast('Please select a file', 'error')
      return
    }

    try {
      setUploading(true)
      console.log('📤 Uploading version...')
      
      const formData = new FormData()
      formData.append("projectId", projectId)
      formData.append("versionNumber", versionNumber)  // ← CORRECT field name
      formData.append("releaseNotes", releaseNotes)    // ← CORRECT field name
      formData.append("file", file)

      console.log('Form data:', {
        projectId,
        versionNumber,
        releaseNotes,
        fileName: file.name
      })

      const res = await axios.post(
        "http://localhost:5000/api/versions",
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      console.log('✅ Version uploaded successfully:', res.data)
      
      setVersionNumber("")
      setReleaseNotes("")
      setFile(null)
      setShowForm(false)
      fetchVersions()
      showToast('Version uploaded successfully! 🎉', 'success')
    } catch (err) {
      console.error('❌ Upload error:', err.response?.data || err.message)
      showToast(err.response?.data?.message || 'Failed to upload version', 'error')
    } finally {
      setUploading(false)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Back to Projects
        </button>
        <h1 style={styles.title}>Project Versions</h1>
      </div>

      {/* Top Row */}
      <div style={styles.topRow}>
        <h3 style={styles.heading}>All Versions</h3>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "⬆️ Upload New Version"}
        </button>
      </div>

      {/* Add Version Form */}
      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>📤 Upload New Version</h4>
          
          <input
            style={styles.input}
            placeholder="Version Number (e.g., 1.0, 2.0)"
            value={versionNumber}
            onChange={(e) => setVersionNumber(e.target.value)}
            disabled={uploading}
            autoFocus
          />

          <textarea
            style={styles.textarea}
            placeholder="Release Notes (optional)"
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            disabled={uploading}
          />

          <div style={styles.fileInputContainer}>
            <label style={styles.fileLabel}>
              Select File:
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.fileInput}
              disabled={uploading}
            />
            {file && <p style={styles.fileName}>✓ {file.name}</p>}
          </div>

          <button 
            style={{
              ...styles.submitBtn,
              opacity: uploading ? 0.6 : 1,
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
            onClick={handleAddVersion}
            disabled={uploading}
          >
            {uploading ? "⏳ Uploading..." : "✓ Upload Version"}
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
                  Version {version.versionNumber}
                </h4>
                <span style={styles.date}>
                  {new Date(version.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {version.releaseNotes && (
                <p style={styles.desc}>{version.releaseNotes}</p>
              )}

              {version.file && (
                <p style={styles.fileInfo}>
                  📎 {version.file.filename || version.file}
                </p>
              )}

              <div style={styles.btnGroup}>
                {/* Download Button */}
                {version.file && (
                  <a
                    href={`http://localhost:5000/uploads/${version.file.filename || version.file}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadBtn}
                  >
                    ⬇️ Download
                  </a>
                )}

                {/* Feedback Button */}
                <button
                  style={styles.feedbackBtn}
                  onClick={() => navigate(`/feedback/${version._id}`)}
                >
                  💬 Feedback →
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
    fontWeight: "600",
    transition: "all 0.2s",
  },
  title: {
    margin: "0",
    fontSize: "28px",
    color: "#333",
    fontWeight: "700",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  heading: {
    margin: "0",
    fontSize: "20px",
    color: "#333",
    fontWeight: "600",
  },
  addBtn: {
    padding: "10px 20px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  form: {
    marginBottom: "24px",
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    border: "2px solid #4f46e5",
  },
  formTitle: {
    margin: "0 0 16px",
    fontSize: "16px",
    color: "#333",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    marginBottom: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    marginBottom: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    height: "80px",
    resize: "vertical",
  },
  fileInputContainer: {
    marginBottom: "12px",
  },
  fileLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
    display: "block",
    marginBottom: "8px",
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    marginBottom: "8px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "13px",
  },
  fileName: {
    margin: "0",
    fontSize: "13px",
    color: "#10b981",
    fontWeight: "600",
  },
  submitBtn: {
    width: "100%",
    padding: "12px 24px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  empty: {
    textAlign: "center",
    padding: "80px 24px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    color: "#888",
    marginTop: "20px",
    fontSize: "16px",
  },
  grid: {
    display: "grid",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    borderLeft: "4px solid #4f46e5",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    transition: "all 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  versionTitle: {
    margin: "0",
    fontSize: "18px",
    color: "#333",
    fontWeight: "600",
  },
  date: {
    fontSize: "12px",
    color: "#999",
  },
  desc: {
    margin: "0 0 10px",
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  fileInfo: {
    margin: "0 0 14px",
    color: "#4f46e5",
    fontSize: "13px",
    fontWeight: "600",
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
    fontWeight: "600",
    transition: "all 0.2s",
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
    fontWeight: "600",
    transition: "all 0.2s",
  },
}

export default Versions