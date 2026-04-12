import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ktmbites_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Handle 401 errors globally — redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ktmbites_token');
      localStorage.removeItem('ktmbites_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup') && !window.location.pathname.includes('/admin') && !window.location.pathname.includes('/kitchen')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
