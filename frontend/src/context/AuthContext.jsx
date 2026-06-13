import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const user = data?.data?.user || null;

  useEffect(() => {
    const handleUnauthorized = () => {
      // Invalidate query to clear user
      qc.invalidateQueries(['authUser']);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    // After login, we refetch the user data
    await refetch();
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all queries and set authUser to null to force UI update
      qc.setQueryData(['authUser'], null);
      qc.invalidateQueries(['authUser']);
      qc.clear();
      navigate('/login');
    }
  };

  if (isLoading) {
    return <div className="loading-screen">Loading application...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
