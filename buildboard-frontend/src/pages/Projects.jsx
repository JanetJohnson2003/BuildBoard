import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Projects() {
  const [projects, setProjects] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: token }
      })
      setProjects(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const handleCreate = async () => {
    if (!title) return alert('Please enter project title')
    try {
      await axios.post(
        'http://localhost:5000/api/projects',
        { title, description },
        { headers: { Authorization: token } }
      )
      setTitle('')
      setDescription('')
      setShowForm(false)
      fetchProjects()
    } catch (err) {
      console.log(err)
    }
  }

  const handleShare = async (projectId) => {
    const userId = prompt('Enter reviewer user ID to share with:')
    if (!userId) return
    try {
      await axios.post(
        'http://localhost:5000/api/projects/share',
        { projectId, userId },
        { headers: { Authorization: token } }
      )
      alert('Project shared successfully!')
    } catch (err) {
      alert('Sharing failed. Check the user ID.')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div style={styles.container}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        <div style={styles.navRight}>
          <span style={styles.username}>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <h3 style={styles.heading}>My Projects</h3>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={styles.form}>
            <input
              style={styles.input}
              placeholder="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              style={styles.textarea}
              placeholder="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button style={styles.submitBtn} onClick={handleCreate}>
              Create Project
            </button>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div style={styles.empty}>
            <p>No projects yet. Click "+ New Project" to start! 🚀</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {projects.map((project) => (
              <div key={project._id} style={styles.card}>
                <h4 style={styles.cardTitle}>{project.title}</h4>
                <p style={styles.cardDesc}>
                  {project.description || 'No description'}
                </p>
                <p style={styles.cardDate}>
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
                <div style={styles.btnRow}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => navigate(`/versions/${project._id}`)}
                  >
                    View Versions →
                  </button>
                  <button
                    style={styles.shareBtn}
                    onClick={() => handleShare(project._id)}
                  >
                    Share 🔗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '16px 32px',
    backgroundColor: '#4f46e5'
  },
  logo: { margin: 0, color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { color: '#fff', fontSize: '14px' },
  logoutBtn: {
    padding: '6px 16px', backgroundColor: '#fff',
    color: '#4f46e5', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
  },
  body: { padding: '32px' },
  topRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px'
  },
  heading: { margin: 0, fontSize: '22px', color: '#333' },
  addBtn: {
    padding: '10px 20px', backgroundColor: '#4f46e5',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px'
  },
  form: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px', marginBottom: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },
  input: {
    width: '100%', padding: '10px 14px',
    marginBottom: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%', padding: '10px 14px',
    marginBottom: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px',
    boxSizing: 'border-box', height: '80px'
  },
  submitBtn: {
    padding: '10px 24px', backgroundColor: '#4f46e5',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px'
  },
  empty: {
    textAlign: 'center', padding: '60px',
    backgroundColor: '#fff', borderRadius: '12px',
    color: '#888', fontSize: '16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #4f46e5'
  },
  cardTitle: { margin: '0 0 8px', color: '#333', fontSize: '17px' },
  cardDesc: { color: '#888', fontSize: '14px', margin: '0 0 8px' },
  cardDate: { color: '#bbb', fontSize: '12px', margin: '0 0 14px' },
  btnRow: { display: 'flex', gap: '10px' },
  viewBtn: {
    padding: '6px 14px', backgroundColor: '#eef2ff',
    color: '#4f46e5', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
  },
  shareBtn: {
    padding: '6px 14px', backgroundColor: '#10b981',
    color: '#fff', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
  }
}

export default Projects
