import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Crucial for sending HttpOnly cookies
});

// Response interceptor to catch auth errors globally
api.interceptors.response.use(
  (response) => {
    return response.data; // Return the ApiResponse `data` part usually
  },
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, could clear local state or redirect
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
export const axiosInstance = api;
