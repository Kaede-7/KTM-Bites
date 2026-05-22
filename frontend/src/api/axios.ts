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
//
// Portal-aware: picks the correct token based on current URL path
// (user, kitchen, admin, or rider portal).
// ============================================================

import axios from 'axios';

// Create an axios instance with default settings
// All API calls will go to: http://localhost:8000/api/...
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Helper: resolve the correct token key for the current portal ──
function getPortalTokenKey(): string {
  const path = window.location.pathname;
  if (path.startsWith('/kitchen')) return 'ktmbites_kitchen_token';
  if (path.startsWith('/admin'))   return 'ktmbites_admin_token';
  if (path.startsWith('/rider'))   return 'ktmbites_rider_token';
  return 'ktmbites_token';
}

// ── REQUEST INTERCEPTOR ──────────────────────────────────────
// Before every request, check if the user is logged in on the
// current portal. Attach the right token to the request header.
// Rider tokens (RIDER_TOKEN_*) are sent without the "Token " prefix
// because they use a custom auth scheme, not DRF's TokenAuthentication.
API.interceptors.request.use((config) => {
  const tokenKey = getPortalTokenKey();
  const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
  if (token) {
    if (token.startsWith('RIDER_TOKEN_')) {
      config.headers.Authorization = token;
    } else {
      config.headers.Authorization = `Token ${token}`;
    }
  }
  return config;
});

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// After every response, check if the server returned a 401 error.
// 401 means "you are not logged in" or "your session expired".
// Kitchen, Admin, and Rider portals manage their own auth state
// internally, so we only auto-clear tokens for the user portal.
API.interceptors.response.use(
  (response) => response, // If response is OK, just return it
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Kitchen, Admin, Rider manage their own auth — don't interfere
      if (currentPath.startsWith('/rider') ||
          currentPath.startsWith('/kitchen') ||
          currentPath.startsWith('/admin')) {
        return Promise.reject(error);
      }

      // Clear user portal token
      localStorage.removeItem('ktmbites_token');
      localStorage.removeItem('ktmbites_user');
      sessionStorage.removeItem('ktmbites_token');
      sessionStorage.removeItem('ktmbites_user');

      // Only redirect to login if user is on a protected page
      const protectedPaths = ['/profile', '/checkout', '/order-tracking'];

      if (protectedPaths.some(path => currentPath.startsWith(path))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
