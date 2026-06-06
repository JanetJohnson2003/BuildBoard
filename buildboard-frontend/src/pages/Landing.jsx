import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { NeonButton, GlassCard } from '../components/ui';
import { ParticleField, AuroraBackground, ScrollReveal } from '../components/effects';
import { useAuth } from '../context/AuthContext';
import { Terminal, Zap, Cpu, Globe, Rocket, Layers, GitBranch } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-[#0a0a0f]">
      {/* Dynamic Backgrounds */}
      <AuroraBackground />
      <ParticleField count={60} />
      
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-[var(--glass-border)] bg-[var(--bg-main)]/50 backdrop-blur-xl">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-30" />
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-purple)] text-[#0a0a0f] font-display font-bold shadow-[0_0_15px_rgba(0,212,255,0.5)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.8)] transition-all duration-300">
              BB
            </div>
            <span className="font-display font-bold text-xl tracking-widest text-[var(--text-main)] group-hover:text-white transition-colors">
              BUILDBOARD<span className="text-[var(--brand-primary)]">+</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--brand-primary)] transition-colors">Features</a>
            <a href="#tech" className="hover:text-[var(--brand-primary)] transition-colors">Tech Stack</a>
            <a href="#community" className="hover:text-[var(--brand-primary)] transition-colors">Community</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <NeonButton variant="primary">Enter Nexus <Terminal size={16} /></NeonButton>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors hidden sm:block">
                  Initialize Login
                </Link>
                <Link to="/register">
                  <NeonButton variant="primary">Access Terminal</NeonButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <motion.div style={{ y: y1, opacity }} className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[40rem] h-[40rem] bg-[var(--brand-primary)]/10 rounded-full blur-[120px]" />
          <div className="absolute top-[30%] right-[10%] w-[30rem] h-[30rem] bg-[var(--brand-purple)]/10 rounded-full blur-[100px]" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-sm font-mono mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-primary)]"></span>
              </span>
              SYSTEMS ONLINE • V2.0 ACTIVE
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-8">
              The Next-Gen <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-purple)] to-[var(--brand-success)] neon-text">
                Developer Nexus
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              Experience the future of collaborative software development. 
              BuildBoard+ combines the power of Git with a breathtaking cyberpunk-inspired interface and 3D data visualization.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to={user ? "/dashboard" : "/register"}>
                <NeonButton variant="primary" className="h-14 px-8 text-lg w-full sm:w-auto">
                  Initialize Workspace <Zap size={20} />
                </NeonButton>
              </Link>
              <Link to="/explore">
                <NeonButton variant="secondary" className="h-14 px-8 text-lg w-full sm:w-auto">
                  Explore Nodes <Globe size={20} />
                </NeonButton>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Code Preview */}
        <motion.div 
          style={{ y: y2 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative max-w-5xl mx-auto mt-24 px-6 z-10"
        >
          <div className="glass-panel p-2 rounded-2xl shadow-[0_0_100px_rgba(168,85,247,0.15)] border-t-[var(--brand-purple)]">
            <div className="bg-[#0a0a0f] rounded-xl overflow-hidden border border-[var(--glass-border)]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--glass-border)] bg-[#111118]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto text-xs font-mono text-[var(--text-muted)]">buildboard-core / main.rs</div>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto cyber-scrollbar">
                <pre>
                  <span className="text-[#ff7b72]">fn</span> <span className="text-[#d2a8ff]">initialize_nexus</span>() -{'>'} <span className="text-[#79c0ff]">Result</span>{'<'}<span className="text-[#79c0ff]">NexusCore</span>, <span className="text-[#79c0ff]">SystemError</span>{'>'} {'{'}
                  {'\n    '}let mut core = <span className="text-[#79c0ff]">NexusCore</span>::new();
                  {'\n    '}core.<span className="text-[#d2a8ff]">boot_sequence</span>(<span className="text-[#a5d6ff]">"CYBER_MODE"</span>)?;
                  {'\n'}
                  {'\n    '}<span className="text-[#8b949e]">// Establish neural link with developers</span>
                  {'\n    '}core.network.<span className="text-[#d2a8ff]">establish_connection</span>(<span className="text-[#79c0ff]">Protocol</span>::Quantum)?;
                  {'\n'}
                  {'\n    '}<span className="text-[#ff7b72]">match</span> core.status {'{'}
                  {'\n        '}<span className="text-[#79c0ff]">Status</span>::Online ={'>'} <span className="text-[#79c0ff]">Ok</span>(core),
                  {'\n        '}_ ={'>'} <span className="text-[#79c0ff]">Err</span>(<span className="text-[#79c0ff]">SystemError</span>::InitializationFailed),
                  {'\n    }'}
                  {'\n}'}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Core Capabilities</h2>
              <p className="text-[var(--text-muted)] max-w-2xl mx-auto">Advanced toolsets designed for high-velocity engineering teams navigating complex codebases.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={0.1}>
              <GlassCard interactive glowColor="var(--brand-primary)" className="h-full p-8">
                <div className="w-12 h-12 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] mb-6">
                  <GitBranch size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Quantum Version Control</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">Lightning-fast git operations with real-time sync across all connected nodes. Never deal with merge conflicts in the dark again.</p>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <GlassCard interactive glowColor="var(--brand-purple)" className="h-full p-8 border-t-[var(--brand-purple)]">
                <div className="w-12 h-12 rounded-lg bg-[var(--brand-purple)]/10 flex items-center justify-center text-[var(--brand-purple)] mb-6">
                  <Cpu size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">AI-Augmented Reviews</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">Automated code analysis and reviewer assignment. Let the system handle the boilerplate while you focus on architecture.</p>
              </GlassCard>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <GlassCard interactive glowColor="var(--brand-success)" className="h-full p-8 border-t-[var(--brand-success)]">
                <div className="w-12 h-12 rounded-lg bg-[var(--brand-success)]/10 flex items-center justify-center text-[var(--brand-success)] mb-6">
                  <Layers size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Holographic Architecture</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">Visualize your entire codebase dependency graph in stunning 3D. Understand system architecture at a glance.</p>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--brand-primary)]/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <div className="glass-panel p-12 rounded-3xl border border-[var(--brand-primary)]/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--brand-primary)]/5 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 relative z-10">Ready to Upgrade?</h2>
              <p className="text-xl text-[var(--text-muted)] mb-10 relative z-10">Join the next generation of developers building the future on BuildBoard+.</p>
              <Link to="/register" className="relative z-10 inline-block">
                <NeonButton variant="primary" className="h-16 px-10 text-xl shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                  Execute Onboarding Protocol <Rocket size={24} />
                </NeonButton>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--glass-border)] bg-[#050508] pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 opacity-80">
              <div className="grid h-8 w-8 place-items-center rounded bg-[var(--brand-primary)] text-[#0a0a0f] font-display font-bold">
                BB
              </div>
              <span className="font-display font-bold tracking-widest text-[var(--text-main)]">
                BUILDBOARD<span className="text-[var(--brand-primary)]">+</span>
              </span>
            </div>
            
            <div className="text-sm text-[var(--text-muted)] font-mono">
              SYSTEM_STATUS: <span className="text-[var(--brand-success)]">OPTIMAL</span> // {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
