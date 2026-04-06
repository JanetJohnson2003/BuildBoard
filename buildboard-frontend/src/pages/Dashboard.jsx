import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>BuildBoard+</h2>
        <div style={styles.navRight}>
          <span style={styles.username}>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <h3 style={styles.welcome}>Welcome, {user?.name}! 🎉</h3>
        <p style={styles.sub}>Your dashboard is ready. Projects coming next!</p>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '16px 32px',
    backgroundColor: '#4f46e5', color: '#fff'
  },
  logo: { margin: 0, color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { color: '#fff', fontSize: '14px' },
  logoutBtn: {
    padding: '6px 16px', backgroundColor: '#fff',
    color: '#4f46e5', border: 'none',
    borderRadius: '6px', cursor: 'pointer'
  },
  body: { padding: '40px', textAlign: 'center' },
  welcome: { fontSize: '24px', color: '#333' },
  sub: { color: '#888' }
}

export default Dashboard