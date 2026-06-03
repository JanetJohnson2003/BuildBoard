import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/api';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setSuccessMsg(res.data.message || 'Password reset successful');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--text-main)] flex items-center justify-center mb-6">
          <span className="text-[var(--bg-main)] font-bold text-2xl">D</span>
        </div>
        <h2 className="text-center text-2xl font-light tracking-tight text-[var(--text-main)]">
          Create new password
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="panel py-6 px-4 sm:px-10">
          {errorMsg && (
            <div className="mb-4 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/20 text-[var(--brand-danger)] px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{successMsg}</span>
              <p className="text-xs mt-1">Redirecting to login...</p>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                {...register('password')}
                className={`input-field ${errors.password ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
              />
              {errors.password && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.password.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`input-field ${errors.confirmPassword ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.confirmPassword.message}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || successMsg}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          
          <div className="mt-4 flex justify-center">
            <Link to="/login" className="text-sm text-[var(--brand-primary)] hover:underline">
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
