import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // Step 1: Role, Step 2: Details
  const [formData, setFormData] = useState({
    role: '', // 'user', 'reviewer', 'admin'
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Handle role selection
  const handleRoleSelect = (role) => {
    console.log('👤 Role selected:', role)
    setFormData(prev => ({
      ...prev,
      role
    }))
    setStep(2) // Move to details step
  }

  // Handle back to role selection
  const handleBackToRoles = () => {
    setStep(1)
    setError(null)
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email')
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      console.log('📝 Registering user...')
      console.log('👤 Role:', formData.role)

      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role // Send role to backend
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      console.log('✅ Registration successful:', response.data)

      // Save token and user
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      alert(`✅ Registration successful as ${formData.role}! Redirecting to dashboard...`)
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ Registration error:', err)
      
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 409) {
        setError('Email already registered. Please login or use a different email.')
      } else if (err.message === 'Network Error') {
        setError('Network error. Make sure backend is running on http://localhost:5000')
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.')
      }
      
      setLoading(false)
    }
  }

  // ===== STEP 1: ROLE SELECTION =====
  if (step === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <h1 style={styles.title}>BuildBoard+</h1>
          <p style={styles.subtitle}>Choose your account type</p>

          <div style={styles.rolesContainer}>
            {/* User Role */}
            <div
              style={{
                ...styles.roleCard,
                borderColor: formData.role === 'user' ? '#4f46e5' : '#ddd',
                backgroundColor: formData.role === 'user' ? '#eef2ff' : '#fff',
                cursor: 'pointer'
              }}
              onClick={() => handleRoleSelect('user')}
            >
              <div style={styles.roleIcon}>👤</div>
              <h3 style={styles.roleName}>User</h3>
              <p style={styles.roleDesc}>Create and manage projects</p>
              <p style={styles.roleFeatures}>• Upload versions</p>
              <p style={styles.roleFeatures}>• Receive feedback</p>
              <p style={styles.roleFeatures}>• View analytics</p>
            </div>

            {/* Reviewer Role */}
            <div
              style={{
                ...styles.roleCard,
                borderColor: formData.role === 'reviewer' ? '#4f46e5' : '#ddd',
                backgroundColor: formData.role === 'reviewer' ? '#eef2ff' : '#fff',
                cursor: 'pointer'
              }}
              onClick={() => handleRoleSelect('reviewer')}
            >
              <div style={styles.roleIcon}>👁️</div>
              <h3 style={styles.roleName}>Reviewer</h3>
              <p style={styles.roleDesc}>Review and provide feedback</p>
              <p style={styles.roleFeatures}>• View shared projects</p>
              <p style={styles.roleFeatures}>• Add feedback</p>
              <p style={styles.roleFeatures}>• Comment on versions</p>
            </div>

            {/* Admin Role */}
            <div
              style={{
                ...styles.roleCard,
                borderColor: formData.role === 'admin' ? '#4f46e5' : '#ddd',
                backgroundColor: formData.role === 'admin' ? '#eef2ff' : '#fff',
                cursor: 'pointer'
              }}
              onClick={() => handleRoleSelect('admin')}
            >
              <div style={styles.roleIcon}>🔐</div>
              <h3 style={styles.roleName}>Admin</h3>
              <p style={styles.roleDesc}>Full platform access</p>
              <p style={styles.roleFeatures}>• Manage all projects</p>
              <p style={styles.roleFeatures}>• User management</p>
              <p style={styles.roleFeatures}>• System analytics</p>
            </div>
          </div>

          {/* Login Link */}
          <p style={styles.loginLink}>
            Already have an account? <Link to="/" style={styles.link}>Login</Link>
          </p>
        </div>
      </div>
    )
  }

  // ===== STEP 2: DETAILS FORM =====
  if (step === 2) {
    return (
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <h1 style={styles.title}>BuildBoard+</h1>
          <p style={styles.subtitle}>
            Complete your {formData.role} profile
          </p>

          <div style={styles.roleTag}>
            {formData.role === 'user' && '👤 User'}
            {formData.role === 'reviewer' && '👁️ Reviewer'}
            {formData.role === 'admin' && '🔐 Admin'}
          </div>

          <form onSubmit={handleRegister} style={styles.form}>
            {/* Name Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Email Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter a password (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Confirm Password Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBox}>
                ❌ {error}
              </div>
            )}

            {/* Buttons */}
            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={{
                  ...styles.backButton,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onClick={handleBackToRoles}
                disabled={loading}
              >
                ← Back
              </button>
              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading}
              >
                {loading ? '⏳ Creating account...' : '✓ Register'}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p style={styles.loginLink}>
            Already have an account? <Link to="/" style={styles.link}>Login</Link>
          </p>
        </div>
      </div>
    )
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px'
  },
  formWrapper: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  title: {
    margin: '0 0 10px',
    fontSize: '32px',
    fontWeight: '700',
    color: '#4f46e5',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 30px',
    fontSize: '14px',
    color: '#666',
    textAlign: 'center'
  },
  
  // Role Selection Styles
  rolesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  roleCard: {
    padding: '20px',
    border: '2px solid #ddd',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s',
    backgroundColor: '#fff'
  },
  roleIcon: {
    fontSize: '40px',
    marginBottom: '10px'
  },
  roleName: {
    margin: '10px 0 5px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  roleDesc: {
    margin: '0 0 10px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic'
  },
  roleFeatures: {
    margin: '4px 0',
    fontSize: '11px',
    color: '#999',
    textAlign: 'left'
  },

  // Role Tag
  roleTag: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '20px',
    width: '100%',
    textAlign: 'center'
  },

  // Form Styles
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px'
  },
  button: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  backButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f0f2f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  loginLink: {
    margin: '20px 0 0',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center'
  },
  link: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '600',
    cursor: 'pointer'
  }
}

export default Register