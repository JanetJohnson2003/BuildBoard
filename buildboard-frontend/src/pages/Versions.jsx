import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'

function Versions() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    versionNumber: '',
    releaseNotes: '',
    file: null
  })

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ✅ Fetch versions on mount
  useEffect(() => {
    if (!projectId) {
      setError('No project ID provided')
      setLoading(false)
      return
    }

    fetchVersions()
  }, [projectId])

  // ✅ Fetch all versions for this project
  const fetchVersions = async () => {
    try {
      console.log('📥 Fetching versions for project:', projectId)
      setLoading(true)
      setError(null)

      const res = await axios.get(
        `http://localhost:5000/api/versions/${projectId}`,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      console.log('✅ Versions fetched:', res.data.length)
      setVersions(res.data)
      setLoading(false)
    } catch (err) {
      console.error('❌ Error fetching versions:', err.message)
      setError(`Failed to load versions: ${err.message}`)
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

  // ✅ Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('📄 File selected:', file.name)
      setFormData(prev => ({
        ...prev,
        file: file
      }))
    }
  }

  // ✅ Handle version upload - CORRECTED ENDPOINT!
  const handleUpload = async (e) => {
    e.preventDefault()

    if (!formData.versionNumber.trim()) {
      alert('Please enter version number')
      return
    }

    if (!formData.file) {
      alert('Please select a file')
      return
    }

    try {
      console.log('📦 Uploading version...')
      console.log('📦 Version number:', formData.versionNumber)
      console.log('📦 File name:', formData.file.name)
      console.log('📦 Project ID:', projectId)

      // ✅ Create FormData
      const uploadFormData = new FormData()
      uploadFormData.append('versionNumber', formData.versionNumber)
      uploadFormData.append('releaseNotes', formData.releaseNotes)
      uploadFormData.append('file', formData.file)

      // ✅ CORRECT ENDPOINT - Include projectId in URL path!
      const res = await axios.post(
        `http://localhost:5000/api/versions/${projectId}`,
        uploadFormData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      )

      console.log('✅ Version uploaded:', res.data)
      alert('✅ Version uploaded successfully!')

      // Reset form
      setFormData({
        versionNumber: '',
        releaseNotes: '',
        file: null
      })
      setShowForm(false)

      // Refresh versions list
      fetchVersions()
    } catch (err) {
      console.error('❌ Upload error:', err.message)
      console.error('❌ Error response:', err.response?.data)
      alert(`Upload failed: ${err.response?.data?.message || err.message}`)
    }
  }

  // ✅ Handle delete version
  const handleDelete = async (versionId) => {
    if (!window.confirm('Are you sure you want to delete this version?')) {
      return
    }

    try {
      console.log('🗑️ Deleting version:', versionId)

      await axios.delete(
        `http://localhost:5000/api/versions/${versionId}`,
        {
          headers: {
            Authorization: token
          }
        }
      )

      console.log('✅ Version deleted')
      alert('✅ Version deleted successfully!')
      fetchVersions()
    } catch (err) {
      console.error('❌ Delete error:', err.message)
      alert(`Delete failed: ${err.message}`)
    }
  }

  // ✅ Handle download
  const handleDownload = async (versionId, fileName) => {
    try {
      console.log('⬇️ Downloading version:', versionId)

      const res = await axios.get(
        `http://localhost:5000/api/versions/download/${versionId}`,
        {
          headers: {
            Authorization: token
          },
          responseType: 'blob'
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName || 'file')
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)

      console.log('✅ Download complete')
    } catch (err) {
      console.error('❌ Download error:', err.message)
      alert(`Download failed: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.navbar}>
          <h2 style={styles.logo}>BuildBoard+</h2>
          <button style={styles.backBtn} onClick={() => navigate('/projects')}>
            ← Back to Projects
          </button>
        </div>
        <div style={styles.body}>
          <p style={{ textAlign: 'center', marginTop: '40px' }}>⏳ Loading versions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.navbar}>
          <h2 style={styles.logo}>BuildBoard+</h2>
          <button style={styles.backBtn} onClick={() => navigate('/projects')}>
            ← Back to Projects
          </button>
        </div>
        <div style={styles.body}>
          <div style={styles.errorBox}>
            <p>❌ {error}</p>
            <button style={styles.retryBtn} onClick={fetchVersions}>
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
            onClick={() => navigate('/projects')}
          >
            ← Back to Projects
          </button>
        </div>
      </div>

      {/* ✅ BODY */}
      <div style={styles.body}>
        <div style={styles.topRow}>
          <h1 style={styles.title}>📦 Project Versions</h1>
          <button
            style={styles.addBtn}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '📤 Upload New Version'}
          </button>
        </div>

        {/* ✅ UPLOAD FORM */}
        {showForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>📤 Upload New Version</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Version Number *</label>
              <input
                type="text"
                name="versionNumber"
                placeholder="e.g., 1.0.0 or v2.1"
                value={formData.versionNumber}
                onChange={handleInputChange}
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Release Notes</label>
              <textarea
                name="releaseNotes"
                placeholder="What's new in this version?"
                value={formData.releaseNotes}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="4"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select File *</label>
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <button 
                  style={styles.chooseFileBtn}
                  onClick={() => document.querySelector('input[type="file"]').click()}
                >
                  Choose File
                </button>
              </div>
              {formData.file && (
                <p style={styles.fileName}>✅ {formData.file.name}</p>
              )}
            </div>

            <div style={styles.formActions}>
              <button
                style={styles.submitBtn}
                onClick={handleUpload}
              >
                ✓ Upload Version
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    versionNumber: '',
                    releaseNotes: '',
                    file: null
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ✅ VERSIONS LIST */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 All Versions ({versions.length})</h2>

          {versions.length === 0 ? (
            <div style={styles.empty}>
              <p>📭 No versions uploaded yet. Click "📤 Upload New Version" to start!</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {versions.map((version) => (
                <div key={version._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>📦 Version {version.versionNumber}</h3>
                    <span style={styles.badge}>Uploaded</span>
                  </div>

                  <p style={styles.cardDesc}>
                    {version.releaseNotes || '📝 No release notes'}
                  </p>

                  {version.file && (
                    <div style={styles.fileInfo}>
                      <p style={styles.fileName}>
                        📄 {version.file.fileName}
                      </p>
                      <p style={styles.fileSize}>
                        Size: {(version.file.fileSize / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}

                  <p style={styles.cardDate}>
                    📅 Uploaded: {new Date(version.uploadedAt).toLocaleString()}
                  </p>

                  {version.uploadedBy && (
                    <p style={styles.uploadedBy}>
                      👤 By: {version.uploadedBy.name}
                    </p>
                  )}

                  <div style={styles.cardActions}>
                    {version.file && (
                      <button
                        style={styles.downloadBtn}
                        onClick={() => handleDownload(version._id, version.file.fileName)}
                      >
                        ⬇️ Download
                      </button>
                    )}
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(version._id)}
                    >
                      🗑️ Delete
                    </button>
                    <button
                      style={styles.feedbackBtn}
                      onClick={() => navigate(`/feedback/${version._id}`)}
                    >
                      💬 Feedback
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
    fontWeight: '600',
    transition: 'all 0.2s'
  },

  body: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    flex: 1
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
    fontWeight: '600',
    transition: 'all 0.2s'
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
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
    transition: 'border-color 0.2s'
  },
  fileInputWrapper: {
    display: 'flex',
    gap: '10px'
  },
  fileInput: {
    display: 'none'
  },
  chooseFileBtn: {
    padding: '10px 20px',
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  fileName: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600'
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
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#e5e7eb',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },

  section: { marginBottom: '32px' },
  sectionTitle: { margin: '0 0 16px', fontSize: '20px', fontWeight: '600', color: '#333' },

  empty: {
    backgroundColor: '#fff',
    padding: '60px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },

  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #4f46e5',
    transition: 'all 0.2s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px'
  },
  cardTitle: { margin: 0, color: '#333', fontSize: '16px', fontWeight: '600' },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  cardDesc: { color: '#666', fontSize: '13px', margin: '0 0 12px', lineHeight: '1.5' },

  fileInfo: {
    backgroundColor: '#f9fafb',
    padding: '10px 12px',
    borderRadius: '6px',
    marginBottom: '12px'
  },
  fileSize: { color: '#999', fontSize: '12px', margin: '4px 0 0' },

  cardDate: { color: '#999', fontSize: '12px', margin: '8px 0' },
  uploadedBy: { color: '#666', fontSize: '12px', margin: '0' },

  cardActions: { display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' },
  downloadBtn: {
    padding: '8px 12px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    flex: 1,
    minWidth: '80px',
    transition: 'all 0.2s'
  },
  deleteBtn: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    flex: 1,
    minWidth: '80px',
    transition: 'all 0.2s'
  },
  feedbackBtn: {
    padding: '8px 12px',
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    flex: 1,
    minWidth: '80px',
    transition: 'all 0.2s'
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
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
}

export default Versions