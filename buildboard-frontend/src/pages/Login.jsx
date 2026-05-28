import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard, NeonButton, CyberInput, CyberToast } from '../components/ui'
import { ParticleField, AuroraBackground } from '../components/effects'
import { Terminal, Lock, Mail, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.email.trim()) {
      setError('Email protocol requires valid address')
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError('Authentication key required')
      setLoading(false)
      return
    }

    try {
      console.log('🔐 Initiating secure handshake...')

      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          email: formData.email,
          password: formData.password
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      )

      console.log('✅ Handshake accepted:', response.data)

      // Save token and user to context/localStorage
      login(response.data.user, response.data.token)
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ Connection refused:', err)
      
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 401) {
        setError('Invalid credentials. Access denied.')
      } else if (err.message === 'Network Error') {
        setError('Nexus offline. Establish connection to central server.')
      } else {
        setError(err.response?.data?.message || 'Authentication failed. Please retry.')
      }
      
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[var(--brand-primary)] selection:text-[#0a0a0f]">
      <AuroraBackground />
      <ParticleField count={40} />
      
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-purple)] text-[#0a0a0f] font-display font-bold shadow-[0_0_15px_rgba(0,212,255,0.5)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.8)] transition-all duration-300">
            BB
          </div>
          <span className="font-display font-bold tracking-widest text-[var(--text-main)] group-hover:text-white transition-colors">
            BUILDBOARD<span className="text-[var(--brand-primary)]">+</span>
          </span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8 sm:p-10 border-t-[var(--brand-primary)]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
              <Terminal size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">System Login</h1>
            <p className="text-sm text-[var(--text-muted)] font-mono">AUTHENTICATION PROTOCOL v2.0</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <CyberInput
                icon={Mail}
                label="Email Identity"
                type="email"
                name="email"
                placeholder="operative@nexus.net"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoFocus
              />

              <CyberInput
                icon={Lock}
                label="Access Key"
                type="password"
                name="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/30 text-[var(--brand-danger)] text-sm font-mono flex items-start gap-2"
              >
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
              </motion.div>
            )}

            <NeonButton
              type="submit"
              variant="primary"
              className="w-full h-12 text-base mt-4"
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Authenticating...' : 'Initialize Session'} <ArrowRight size={18} />
            </NeonButton>
          </form>

          <div className="mt-8 text-center border-t border-[var(--glass-border)] pt-6">
            <p className="text-sm text-[var(--text-muted)]">
              Unregistered operative?{' '}
              <Link to="/register" className="text-[var(--brand-primary)] hover:text-white font-medium transition-colors hover:underline underline-offset-4">
                Request Clearance
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default Login