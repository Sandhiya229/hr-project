import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import './Login.css';

const loginSchema = z.object({
  email: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // 'admin' or 'employee'
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
    setApiError("");
    setApiSuccess("");
    reset();
  };

  const onSubmit = async (data) => {
    try {
      setApiError("");
      setApiSuccess("");
      
      // Handle Regular Login
      const res = await login(data);
      if (res.data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }
    } catch (error) {
      const errorMessage = error.message || (typeof error === 'string' ? error : "Failed to process request. Please check your credentials.");
      setApiError(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <div className="mini-logo-container">
        <img src="/shatechx-mini.png" alt="SHATECHX Mini" className="mini-logo" />
      </div>

      <div className="bg-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      <div className="login-card-wrapper animate-fade-in">
        <div className="welcome-section">
          <div className="illustration-container">
            <img src="/working-boy.png" alt="Working Illustration" className="working-illustration" />
            <div className="illustration-glow"></div>
          </div>
        </div>

        <div className={`right-panel ${role ? 'login-active' : 'selection-active'}`}>
          {!role ? (
            <div className="role-selection-card glass-panel">
              <div className="selection-header">
                <h2>Select Your Portal</h2>
                <p>Choose your role to begin your productive journey</p>
              </div>
              
              <div className="role-selection-grid">
                <button 
                  className="role-portal admin-portal"
                  onClick={() => handleRoleSelection('admin')}
                >
                  <div className="portal-visual">
                    <div className="portal-icon">🛡️</div>
                    <div className="portal-glow"></div>
                  </div>
                  <div className="portal-info">
                    <h3>Administrator</h3>
                    <p>Full control over projects, employees, and system settings.</p>
                  </div>
                  <div className="portal-arrow">→</div>
                </button>

                <button 
                  className="role-portal employee-portal"
                  onClick={() => handleRoleSelection('employee')}
                >
                  <div className="portal-visual">
                    <div className="portal-icon">👥</div>
                    <div className="portal-glow"></div>
                  </div>
                  <div className="portal-info">
                    <h3>Team Member</h3>
                    <p>Access your tasks, track time, and update project status.</p>
                  </div>
                  <div className="portal-arrow">→</div>
                </button>
              </div>

              <div className="selection-footer">
                <p>Trusted by Elite Teams Worldwide</p>
              </div>
            </div>
          ) : (
            <div className="login-card glass-panel">
              <button className="back-button" onClick={() => setRole(null)}>
                ← Back to selection
              </button>

              <div className="login-header">
                <h1 className="login-title">
                  {role === 'admin' ? "Admin Login" : "Employee Login"}
                </h1>
                <p className="login-subtitle">
                  Sign in as {role}
                </p>
              </div>

              {apiError && <div className="api-error">{apiError}</div>}
              {apiSuccess && <div className="api-success">{apiSuccess}</div>}

              <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Username or Email</label>
                  <input 
                    id="email" 
                    type="text" 
                    placeholder=" "
                    autoComplete="username"
                    className={errors.email ? "input-error" : ""}
                    {...register('email')} 
                  />
                  {errors.email && <span className="error-text">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                    id="password" 
                    type="password" 
                    placeholder=" "
                    autoComplete="new-password"
                    className={errors.password ? "input-error" : ""}
                    {...register('password')} 
                  />
                  {errors.password && <span className="error-text">{errors.password.message}</span>}
                </div>

                <Link to="/forgot-password" size="sm" className="forgot-password-link">
                  Forgot Password?
                </Link>

                <button 
                  type="submit" 
                  className="login-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Sign In"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
