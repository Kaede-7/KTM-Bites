// ============================================================
// axios.ts — The base HTTP client for ALL API calls
// ============================================================
// Every API file (auth.ts, menu.ts, orders.ts, etc.) imports
// this file to make requests to the backend.
//
// It does 3 important things:
// 1. Sets the base URL so you don't have to type it every time
// 2. Automatically attaches the auth token to every request
// 3. Handles 401 (unauthorized) errors globally
// ============================================================

import axios from 'axios';

// Create an axios instance with default settings
// All API calls will go to: http://localhost:8000/api/...
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────
// Before every request, check if the user is logged in.
// If they have a token saved, attach it to the request header.
// This is how the backend knows WHO is making the request.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ktmbites_token') || sessionStorage.getItem('ktmbites_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// After every response, check if the server returned a 401 error.
// 401 means "you are not logged in" or "your session expired".
// If so, clear the saved token and redirect to the login page.
API.interceptors.response.use(
  (response) => response, // If response is OK, just return it
  (error) => {
    if (error.response?.status === 401) {
      // Clear all saved login data
      localStorage.removeItem('ktmbites_token');
      localStorage.removeItem('ktmbites_user');
      sessionStorage.removeItem('ktmbites_token');
      sessionStorage.removeItem('ktmbites_user');

      // Only redirect to login if user is on a protected page
      const currentPath = window.location.pathname;
      const protectedPaths = ['/profile', '/checkout', '/order-tracking'];
      
      if (protectedPaths.some(path => currentPath.startsWith(path))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
