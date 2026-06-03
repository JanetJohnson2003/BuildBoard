import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

const ForgotPassword = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetLink, setResetLink] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      setStatusMessage('');
      setResetLink('');
      const res = await api.post('/auth/forgot-password', { email: data.email });
      setStatusMessage(res.data.message || 'If that email exists, a reset link has been generated.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to request password reset.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--text-main)] flex items-center justify-center mb-6">
          <span className="text-[var(--bg-main)] font-bold text-2xl">D</span>
        </div>
        <h2 className="text-center text-2xl font-light tracking-tight text-[var(--text-main)]">
          Reset your password
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="panel py-6 px-4 sm:px-10">
          {errorMsg && (
            <div className="mb-4 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/20 text-[var(--brand-danger)] px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{errorMsg}</span>
            </div>
          )}
          {statusMessage && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{statusMessage}</span>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                {...register('email')}
                className={`input-field ${errors.email ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.email.message}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
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

export default ForgotPassword;
