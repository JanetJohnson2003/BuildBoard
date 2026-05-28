import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, NeonButton, CyberInput } from '../components/ui'
import { ParticleField, AuroraBackground } from '../components/effects'
import { Terminal, Lock, Mail, User, Shield, Eye, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { twMerge } from 'tailwind-merge'

function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
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
    setFormData(prev => ({ ...prev, role }))
    setStep(2)
  }

  // Handle back to role selection
  const handleBackToRoles = () => {
    setStep(1)
    setError(null)
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.name.trim()) return setError('Name identity required') || setLoading(false)
    if (!formData.email.trim()) return setError('Email protocol requires valid address') || setLoading(false)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setError('Invalid email signature') || setLoading(false)
    if (!formData.password) return setError('Encryption key required') || setLoading(false)
    if (formData.password.length < 6) return setError('Key must exceed 6 bytes (characters)') || setLoading(false)
    if (formData.password !== formData.confirmPassword) return setError('Encryption keys do not match') || setLoading(false)

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      )

      // Save token and user via context
      login(response.data.user, response.data.token)
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 409) {
        setError('Identity already registered in Nexus. Please login.')
      } else if (err.message === 'Network Error') {
        setError('Nexus offline. Establish connection to central server.')
      } else {
        setError(err.response?.data?.message || 'Registration failed. Check network link.')
      }
      setLoading(false)
    }
  }

  const roleConfigs = [
    { id: 'user', icon: User, title: 'Operative', desc: 'Standard node access', color: 'var(--brand-primary)' },
    { id: 'reviewer', icon: Eye, title: 'Reviewer', desc: 'Code inspection rights', color: 'var(--brand-purple)' },
    { id: 'admin', icon: Shield, title: 'Admin', desc: 'Root system override', color: 'var(--brand-danger)' }
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[var(--brand-primary)] selection:text-[#0a0a0f]">
      <AuroraBackground />
      <ParticleField count={40} />
      
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-3 group z-20 relative">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-purple)] text-[#0a0a0f] font-display font-bold shadow-[0_0_15px_rgba(0,212,255,0.5)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.8)] transition-all duration-300">
            BB
          </div>
          <span className="font-display font-bold tracking-widest text-[var(--text-main)] group-hover:text-white transition-colors">
            BUILDBOARD<span className="text-[var(--brand-primary)]">+</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8 sm:p-10 border-t-[var(--brand-purple)]">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-display font-bold mb-2">Clearance Level</h1>
                  <p className="text-sm text-[var(--text-muted)] font-mono">SELECT CLEARANCE DESIGNATION</p>
                </div>

                <div className="grid gap-4 mb-8">
                  {roleConfigs.map((r, idx) => (
                    <motion.button
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleRoleSelect(r.id)}
                      className={twMerge(
                        "flex items-center gap-4 p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-tertiary)]/50 hover:bg-[var(--glass-highlight)] transition-all group text-left",
                        formData.role === r.id ? `border-[${r.color}] bg-[${r.color}]/10` : ""
                      )}
                      style={{ 
                        '--hover-color': r.color,
                        borderColor: formData.role === r.id ? r.color : undefined
                      }}
                    >
                      <div className="w-12 h-12 rounded-lg bg-[var(--bg-main)] flex items-center justify-center border border-[var(--glass-border)] group-hover:border-[var(--hover-color)] transition-colors text-[var(--text-muted)] group-hover:text-[var(--hover-color)]">
                        <r.icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[var(--text-main)] group-hover:text-white transition-colors">{r.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{r.desc}</p>
                      </div>
                      <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:text-[var(--hover-color)] transition-colors transform group-hover:translate-x-1" />
                    </motion.button>
                  ))}
                </div>

                <div className="text-center border-t border-[var(--glass-border)] pt-6">
                  <p className="text-sm text-[var(--text-muted)]">
                    Existing operative?{' '}
                    <Link to="/login" className="text-[var(--brand-primary)] hover:text-white font-medium transition-colors hover:underline underline-offset-4">
                      Authenticate
                    </Link>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8 sm:p-10 border-t-[var(--brand-primary)]">
                <button 
                  onClick={handleBackToRoles}
                  className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors mb-6 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> RE-SELECT CLEARANCE
                </button>

                <div className="mb-8">
                  <h1 className="text-2xl font-display font-bold mb-2">Operative Profile</h1>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-mono">
                    {roleConfigs.find(r => r.id === formData.role)?.icon && (() => {
                      const Icon = roleConfigs.find(r => r.id === formData.role).icon;
                      return <Icon size={12} />;
                    })()}
                    DESIGNATION: {formData.role.toUpperCase()}
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  <CyberInput
                    icon={User}
                    label="Public Identity"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    autoFocus
                  />
                  <CyberInput
                    icon={Mail}
                    label="Email Protocol"
                    type="email"
                    name="email"
                    placeholder="operative@nexus.net"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <CyberInput
                      icon={Lock}
                      label="Encryption Key"
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <CyberInput
                      icon={Lock}
                      label="Confirm Key"
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-lg bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/30 text-[var(--brand-danger)] text-sm font-mono flex items-start gap-2 mt-2"
                    >
                      <div className="mt-0.5">⚠️</div>
                      <div>{error}</div>
                    </motion.div>
                  )}

                  <NeonButton
                    type="submit"
                    variant="primary"
                    className="w-full h-12 text-base mt-6"
                    disabled={loading}
                    loading={loading}
                  >
                    {loading ? 'Initializing Node...' : 'Register Identity'} <ArrowRight size={18} />
                  </NeonButton>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Register