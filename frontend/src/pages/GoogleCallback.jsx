import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
          setError(`Authorization failed: ${errorParam}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          setError('No authorization code received. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Send authorization code to backend for token exchange
        const response = await axiosInstance.post('/auth/google', { code });

        // Successful login - redirect based on role
        if (response.data.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/employee', { replace: true });
        }
      } catch (err) {
        console.error('Google OAuth error:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to authenticate with Google';
        setError(errorMsg);
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Authenticating with Google...</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Please wait while we verify your credentials
            </p>
          </div>
        )}
        {error && !isLoading && (
          <div className="error-state">
            <p className="api-error">{error}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Redirecting to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
