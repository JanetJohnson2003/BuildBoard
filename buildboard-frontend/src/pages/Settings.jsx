import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Save, MapPin, Briefcase, Code, Link as LinkIcon, Camera, Globe } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GlassCard, NeonButton, CyberSkeleton, CyberInput } from '../components/ui';
import { pageVariants, itemVariants, listVariants } from '../utils/animations';

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    company: '',
    skills: '',
    avatar: '',
    socialLinks: {
      github: '',
      twitter: '',
      linkedin: '',
      website: ''
    }
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.username],
    queryFn: async () => {
      const { data } = await api.get(`/users/${user?.username}`);
      return data;
    },
    enabled: !!user?.username,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        company: profile.company || '',
        skills: profile.skills ? profile.skills.join(', ') : '',
        avatar: profile.avatar || '',
        socialLinks: {
          github: profile.socialLinks?.github || '',
          twitter: profile.socialLinks?.twitter || '',
          linkedin: profile.socialLinks?.linkedin || '',
          website: profile.socialLinks?.website || ''
        }
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const { data } = await api.put('/users/profile/update', updatedData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.username], (old) => ({
        ...old,
        ...data,
      }));
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['github', 'twitter', 'linkedin', 'website'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
    };
    updateProfileMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <CyberSkeleton className="w-48 h-10 rounded-lg" />
        <GlassCard className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <CyberSkeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <CyberSkeleton className="w-full h-12 rounded-lg" />
              <CyberSkeleton className="w-full h-24 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CyberSkeleton className="w-full h-12 rounded-lg" />
                <CyberSkeleton className="w-full h-12 rounded-lg" />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-20"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded-xl border border-[var(--brand-primary)]/30">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">System Settings</h1>
          <p className="text-sm font-mono text-[var(--text-muted)]">Configure your operative parameters and identity.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div variants={listVariants} className="space-y-6">
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8 border-t-2 border-t-[var(--brand-primary)]">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <User size={20} className="text-[var(--brand-primary)]" />
                Identity Configuration
              </h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--glass-border)] bg-[var(--bg-tertiary)] flex items-center justify-center">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm border border-[var(--brand-primary)]/50 pointer-events-none">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  <CyberInput
                    label="Avatar URL"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full text-xs"
                  />
                </div>

                <div className="flex-1 space-y-5">
                  <CyberInput
                    label="Display Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="E.g. John Doe"
                    required
                  />
                  
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[var(--brand-primary)] uppercase tracking-wider pl-1">Biography</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about your directives..."
                      className="w-full bg-black/40 border border-[var(--glass-border)] rounded-lg p-3 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:bg-black/60 transition-all font-mono resize-y min-h-[100px] cyber-scrollbar"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-[var(--brand-secondary)]" />
                Operative Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <CyberInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="E.g. Neo-Tokyo, Sector 4"
                  />
                  <MapPin size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>
                
                <div className="relative">
                  <CyberInput
                    label="Company / Affiliation"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="E.g. CyberDyne Systems"
                  />
                  <Briefcase size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>

                <div className="col-span-1 md:col-span-2 relative">
                  <CyberInput
                    label="Skills & Technologies (comma separated)"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, Cybernetics..."
                  />
                  <Code size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <LinkIcon size={20} className="text-[var(--brand-warning)]" />
                External Networks
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <CyberInput
                    label="GitHub Username"
                    name="github"
                    value={formData.socialLinks.github}
                    onChange={handleChange}
                    placeholder="octocat"
                  />
                  <Code size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>
                
                <div className="relative">
                  <CyberInput
                    label="Twitter / X Handle"
                    name="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleChange}
                    placeholder="@handle"
                  />
                  <LinkIcon size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>

                <div className="relative">
                  <CyberInput
                    label="LinkedIn Profile"
                    name="linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleChange}
                    placeholder="in/username"
                  />
                  <Briefcase size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>
                
                <div className="relative">
                  <CyberInput
                    label="Personal Website"
                    name="website"
                    value={formData.socialLinks.website}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                  <Globe size={16} className="absolute right-3 top-[34px] text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end gap-4 mt-8">
            <NeonButton type="button" variant="ghost" onClick={() => window.history.back()}>
              CANCEL
            </NeonButton>
            <NeonButton 
              type="submit" 
              variant="primary" 
              className="flex items-center gap-2"
              disabled={updateProfileMutation.isPending}
            >
              <Save size={18} />
              {updateProfileMutation.isPending ? 'UPLOADING...' : 'SAVE_PARAMETERS'}
            </NeonButton>
          </motion.div>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default Settings;
