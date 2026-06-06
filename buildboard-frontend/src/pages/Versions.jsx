import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { GlassCard, NeonButton, CyberInput, CyberBadge, CyberSkeleton } from '../components/ui';
import { 
  Package, Upload, Download, Trash2, MessageSquare, 
  ChevronLeft, Plus, X, AlertCircle, FileText, Calendar, User as UserIcon
} from 'lucide-react';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';

function Versions() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    versionNumber: '',
    releaseNotes: '',
    file: null
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch Versions
  const { data: versions, isLoading, error } = useQuery({
    queryKey: ['versions', projectId],
    queryFn: async () => {
      const res = await axios.get(
        `/api/versions/${projectId}`,
        {
          headers: { Authorization: token }
        }
      );
      return res.data;
    },
    enabled: !!projectId
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file: file }));
    }
  };

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const uploadFormData = new FormData();
      uploadFormData.append('versionNumber', formData.versionNumber);
      uploadFormData.append('releaseNotes', formData.releaseNotes);
      uploadFormData.append('file', formData.file);

      const res = await axios.post(
        `/api/versions/${projectId}`,
        uploadFormData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['versions', projectId]);
      setFormData({ versionNumber: '', releaseNotes: '', file: null });
      setShowForm(false);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (versionId) => {
      await axios.delete(`/api/versions/${versionId}`, {
        headers: { Authorization: token }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['versions', projectId]);
    }
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!formData.versionNumber.trim() || !formData.file) return;
    uploadMutation.mutate();
  };

  const handleDelete = (versionId) => {
    if (window.confirm('Delete this version? This action cannot be reversed.')) {
      deleteMutation.mutate(versionId);
    }
  };

  const handleDownload = async (versionId, fileName) => {
    try {
      const res = await axios.get(
        `/api/versions/download/${versionId}`,
        {
          headers: { Authorization: token },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'file');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      console.error('Download error:', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <CyberSkeleton className="w-10 h-10 rounded-lg" />
          <CyberSkeleton className="w-64 h-8" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <CyberSkeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <AlertCircle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">SYSTEM_ERROR</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Failed to access version matrix.</p>
          <NeonButton variant="ghost" onClick={() => navigate('/projects')}>RETURN_TO_PROJECTS</NeonButton>
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
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--brand-primary)] transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3 text-white">
              <Package className="text-[var(--brand-primary)]" />
              VERSION_MATRIX
            </h1>
            <p className="text-sm font-mono text-[var(--text-muted)] mt-1">
              Project Identifier: <span className="text-[var(--brand-primary)]">{projectId}</span>
            </p>
          </div>
        </div>
        
        <NeonButton 
          variant={showForm ? 'ghost' : 'primary'}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          {showForm ? <><X size={16} /> ABORT_UPLOAD</> : <><Plus size={16} /> INITIALIZE_UPLOAD</>}
        </NeonButton>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6 md:p-8 border-t-[var(--brand-success)] shadow-[0_10px_30px_rgba(0,255,136,0.1)] mb-8">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <Upload className="text-[var(--brand-success)]" size={20} />
                UPLOAD_NEW_BUILD
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <CyberInput
                  label="Version Identifier"
                  name="versionNumber"
                  value={formData.versionNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 1.0.0, v2.1-beta"
                  className="font-mono"
                />
                
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block uppercase tracking-wider">
                    Deployment Package
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.tar.gz"
                    />
                    <label 
                      htmlFor="file-upload"
                      className={`flex items-center justify-between w-full p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-main)]/50 cursor-pointer transition-all hover:border-[var(--brand-success)] hover:bg-[var(--brand-success)]/10 ${formData.file ? 'border-[var(--brand-success)] bg-[var(--brand-success)]/5' : ''}`}
                    >
                      <span className="font-mono text-sm truncate pr-4 text-[var(--text-main)]">
                        {formData.file ? formData.file.name : 'Select file to upload...'}
                      </span>
                      <Upload size={16} className={formData.file ? 'text-[var(--brand-success)]' : 'text-[var(--text-muted)]'} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block uppercase tracking-wider">
                  Release Diagnostics
                </label>
                <textarea
                  name="releaseNotes"
                  value={formData.releaseNotes}
                  onChange={handleInputChange}
                  placeholder="Detail the updates, patches, and features included in this build..."
                  className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-4 text-sm font-mono text-[#c9d1d9] min-h-[120px] focus:border-[var(--brand-success)] focus:ring-1 focus:ring-[var(--brand-success)]/50 outline-none transition-all resize-y cyber-scrollbar leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                <NeonButton variant="ghost" onClick={() => setShowForm(false)}>
                  CANCEL
                </NeonButton>
                <NeonButton 
                  variant="success" 
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !formData.versionNumber || !formData.file}
                >
                  {uploadMutation.isPending ? 'TRANSMITTING...' : 'EXECUTE_UPLOAD'}
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={listVariants} initial="hidden" animate="visible">
        {(!versions || versions.length === 0) ? (
          <GlassCard className="p-16 text-center flex flex-col items-center justify-center border-dashed">
            <Package size={64} className="text-[var(--text-muted)] opacity-20 mb-6" />
            <h3 className="text-2xl font-display font-bold mb-2">NO_BUILDS_FOUND</h3>
            <p className="text-sm font-mono text-[var(--text-muted)] mb-8 max-w-md">
              The version matrix is empty. Initialize an upload to deploy the first build for this project.
            </p>
            <NeonButton variant="primary" onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Upload size={16} /> INITIALIZE_UPLOAD
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {versions.map((version) => (
              <motion.div key={version._id} variants={itemVariants}>
                <GlassCard className="h-full flex flex-col p-0 overflow-hidden group hover:border-[var(--brand-primary)]/50 transition-colors">
                  {/* Card Header */}
                  <div className="p-5 border-b border-[var(--glass-border)] bg-black/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-primary)]/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                        <Package className="text-[var(--brand-primary)]" size={18} />
                        {version.versionNumber}
                      </h3>
                      <CyberBadge variant="success" size="sm" className="font-mono">DEPLOYED</CyberBadge>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-4 text-xs font-mono text-[var(--text-muted)] relative z-10">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--brand-purple)]" />
                        {new Date(version.uploadedAt).toLocaleString()}
                      </div>
                      {version.uploadedBy && (
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-[var(--brand-warning)]" />
                          {version.uploadedBy.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex-1">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Release Diagnostics</h4>
                      <p className="text-sm text-[var(--text-main)] line-clamp-3 leading-relaxed">
                        {version.releaseNotes || 'No diagnostics provided for this build.'}
                      </p>
                    </div>

                    {version.file && (
                      <div className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-3 flex items-center justify-between group-hover:border-[var(--brand-primary)]/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={16} className="text-[var(--brand-primary)] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-bold text-[var(--text-main)] truncate">{version.file.fileName}</p>
                            <p className="text-[10px] font-mono text-[var(--text-muted)]">{(version.file.fileSize / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 border-t border-[var(--glass-border)] flex items-center gap-2 bg-black/20">
                    <NeonButton 
                      variant="primary" 
                      className="flex-1 py-1.5 text-xs flex justify-center items-center gap-1.5"
                      onClick={() => handleDownload(version._id, version.file?.fileName)}
                      disabled={!version.file}
                    >
                      <Download size={14} /> GET
                    </NeonButton>
                    <NeonButton 
                      variant="purple" 
                      className="flex-1 py-1.5 text-xs flex justify-center items-center gap-1.5"
                      onClick={() => navigate(`/feedback/${version._id}`)}
                    >
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