import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import './Login.css';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token: urlToken } = useParams();
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [isManualTokenMode] = useState(urlToken === '0');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setApiError("");
      setSuccessMessage("");
      
      const finalToken = isManualTokenMode ? manualToken : urlToken;
      
      if (!finalToken) {
        setApiError("Please provide a reset token");
        return;
      }

      await axiosInstance.post('/auth/reset-password', {
        token: finalToken,
        password: data.password
      });
      
      setSuccessMessage("✅ Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      setApiError(error.message || "Failed to reset password. The link may have expired.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <h1 className="login-title">Create New Password</h1>
          <p className="login-subtitle">Enter your new password below</p>
        </div>

        {apiError && <div className="api-error">{apiError}</div>}
        {successMessage && <div className="api-success">{successMessage}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {isManualTokenMode && (
            <div className="form-group">
              <label htmlFor="manualToken">Reset Token (from email or development mode)</label>
              <input 
                id="manualToken"
                type="password" 
                placeholder="Paste your reset token here"
                className={!manualToken ? "input-error" : ""}
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                You can paste the long token you received from the previous step
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              className={errors.password ? "input-error" : ""}
              {...register('password')} 
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Minimum 8 characters, 1 uppercase letter, 1 number
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              className={errors.confirmPassword ? "input-error" : ""}
              {...register('confirmPassword')} 
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-link">
          Remember your password? <a href="/login" style={{ color: 'var(--accent-primary)' }}>Sign In</a>
        </p>
      </div>
    </div>
  );
}
