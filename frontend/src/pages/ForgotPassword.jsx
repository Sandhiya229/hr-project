import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import './Login.css';

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devToken, setDevToken] = useState("");
  const [showDevToken, setShowDevToken] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setApiError("");
      setSuccessMessage("");
      setDevToken("");
      const response = await axiosInstance.post('/auth/forgot-password', data);
      
      // Check for development token
      if (response.data.devToken) {
        setDevToken(response.data.devToken);
        setShowDevToken(true);
        setSuccessMessage("✅ Development Mode: Reset token generated. Check below or your email inbox.");
      } else {
        setSuccessMessage("✅ " + response.message);
      }
      
      setTimeout(() => {
        if (!response.data.devToken) {
          navigate('/login', { replace: true });
        }
      }, 4000);
    } catch (error) {
      setApiError(error.response?.data?.message || error.message || "Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Enter your email to receive a password reset link</p>
        </div>

        {apiError && <div className="api-error">{apiError}</div>}
        {successMessage && <div className="api-success">{successMessage}</div>}

        {!showDevToken ? (
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                id="email" 
                type="email" 
                placeholder="name@company.com"
                className={errors.email ? "input-error" : ""}
                {...register('email')} 
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="dev-token-display">
            <div className="dev-token-header">
              <h3>🔐 Development Mode - Reset Token</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Use this token to complete your password reset:
              </p>
            </div>
            
            <div className="dev-token-box">
              <code style={{ 
                wordBreak: 'break-all', 
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}>
                {devToken}
              </code>
              <button 
                type="button"
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(devToken);
                  alert('Token copied to clipboard!');
                }}
              >
                Copy Token
              </button>
            </div>

            <p style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              ⏰ This token expires in 15 minutes
            </p>

            <Link to="/reset-password/0" className="auth-link" style={{ marginTop: '1rem' }}>
              Continue with token manually →
            </Link>
          </div>
        )}

        <p className="auth-link" style={{ marginTop: '1.5rem' }}>
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
