import API from "./axios";

// ── Portal Types ──
// Each portal (User, Kitchen, Admin, Rider) gets its own scoped
// localStorage keys so sessions never bleed across portals.

export type Portal = 'user' | 'kitchen' | 'admin' | 'rider';

const PORTAL_KEYS: Record<Portal, { token: string; user: string }> = {
  user:    { token: 'ktmbites_token',         user: 'ktmbites_user' },
  kitchen: { token: 'ktmbites_kitchen_token', user: 'ktmbites_kitchen_user' },
  admin:   { token: 'ktmbites_admin_token',   user: 'ktmbites_admin_user' },
  rider:   { token: 'ktmbites_rider_token',   user: 'ktmbites_rider_user' },
};

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ProfileData {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  bio: string;
  calorie_target: number | null;
  has_password: boolean;
  role?: string;
  rank: {
    order_count: number;
    current_rank: string;
    discount: number;
    color: string;
    next_rank: string;
    progress: number;
    orders_to_next: number;
  };
}

// ── Portal Detection ──

/** Detect the current portal based on the URL path */
export function detectPortal(): Portal {
  const path = window.location.pathname;
  if (path.startsWith('/kitchen')) return 'kitchen';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/rider')) return 'rider';
  return 'user';
}

function clearPortal(portal: Portal) {
  const keys = PORTAL_KEYS[portal];
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.user);
  sessionStorage.removeItem(keys.token);
  sessionStorage.removeItem(keys.user);
}

/** Clear ALL portal sessions */
export function clearAllPortals() {
  for (const p of Object.keys(PORTAL_KEYS) as Portal[]) {
    clearPortal(p);
  }
}

// ── Storage Helpers ──

export function saveAuth(data: AuthResponse, rememberMe: boolean = false, portal?: Portal) {
  const p = portal || detectPortal();
  const keys = PORTAL_KEYS[p];

  // Clear ALL other portal sessions to prevent cross-portal bleed
  for (const other of Object.keys(PORTAL_KEYS) as Portal[]) {
    if (other !== p) clearPortal(other);
  }

  if (rememberMe) {
    localStorage.setItem(keys.token, data.token);
    localStorage.setItem(keys.user, JSON.stringify(data.user));
    sessionStorage.removeItem(keys.token);
    sessionStorage.removeItem(keys.user);
  } else {
    sessionStorage.setItem(keys.token, data.token);
    sessionStorage.setItem(keys.user, JSON.stringify(data.user));
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.user);
  }
}

export function getStoredUser(portal?: Portal): AuthUser | null {
  const keys = PORTAL_KEYS[portal || detectPortal()];
  const raw = localStorage.getItem(keys.user) || sessionStorage.getItem(keys.user);
  return raw ? JSON.parse(raw) : null;
}

export function getToken(portal?: Portal): string | null {
  const keys = PORTAL_KEYS[portal || detectPortal()];
  return localStorage.getItem(keys.token) || sessionStorage.getItem(keys.token);
}

export function isLoggedIn(portal?: Portal): boolean {
  return !!getToken(portal);
}

/**
 * Persist the current session to localStorage before navigating to an
 * external payment gateway (Khalti, Kharcha, etc.).
 *
 * Problem: When "Remember Me" is unchecked, the token lives only in
 * sessionStorage. Some browsers lose sessionStorage during cross-origin
 * redirect chains (Frontend → Khalti → Backend → Frontend), causing the
 * user to be logged out after a successful payment.
 *
 * Solution: Copy the session to localStorage before the redirect so it
 * survives the round-trip. This is safe because the user is actively
 * completing a purchase — not closing the tab.
 */
export function persistSessionForRedirect(portal?: Portal) {
  const p = portal || detectPortal();
  const keys = PORTAL_KEYS[p];

  // If data is already in localStorage, nothing to do
  if (localStorage.getItem(keys.token)) return;

  // Copy from sessionStorage → localStorage
  const token = sessionStorage.getItem(keys.token);
  const user  = sessionStorage.getItem(keys.user);
  if (token) {
    localStorage.setItem(keys.token, token);
    localStorage.setItem(`ktmbites_session_is_temporary_${p}`, 'true');
  }
  if (user) {
    localStorage.setItem(keys.user, user);
  }
}

/**
 * Restore temporary session credentials from localStorage back to sessionStorage.
 * This runs when the app starts up so that redirect-saved sessions are not kept
 * permanently in localStorage.
 */
export function restoreSessionFromRedirect() {
  for (const p of Object.keys(PORTAL_KEYS) as Portal[]) {
    const tempKey = `ktmbites_session_is_temporary_${p}`;
    if (localStorage.getItem(tempKey) === 'true') {
      const keys = PORTAL_KEYS[p];
      const token = localStorage.getItem(keys.token);
      const user  = localStorage.getItem(keys.user);
      if (token) {
        sessionStorage.setItem(keys.token, token);
        localStorage.removeItem(keys.token);
      }
      if (user) {
        sessionStorage.setItem(keys.user, user);
        localStorage.removeItem(keys.user);
      }
      localStorage.removeItem(tempKey);
    }
  }
}

export function logout(redirectUrl: string | null = "/login") {
  clearAllPortals();

  // Ignore React SyntheticEvent objects passed by mistake when used directly in onClick
  let url: string | null = typeof redirectUrl === 'string' ? redirectUrl : "/login";
  if (redirectUrl === null) {
    url = null;
  }

  if (url) {
    window.location.href = url;
  }
}

// ── API Calls ──

export async function login(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> {
  const { data } = await API.post("/auth/login/", { email, password });
  saveAuth(data, rememberMe);
  return data;
}

export async function googleLogin(token: string, isAccessToken: boolean = false, role: string = 'USER', rememberMe: boolean = false, calorieTarget?: number | null): Promise<AuthResponse> {
  const payload = isAccessToken
    ? { access_token: token, role, calorie_target: calorieTarget }
    : { credential: token, role, calorie_target: calorieTarget };
  const { data } = await API.post("/auth/google/", payload);
  saveAuth(data, rememberMe);
  return data;
}

export interface RegisterData {
  full_name: string;
  email: string;
  phone?: string;
  password?: string;
  is_google?: boolean;
  role?: string;
  calorie_target?: number | null;
}

export async function register(payload: RegisterData, rememberMe: boolean = false): Promise<AuthResponse> {
  const { data } = await API.post("/auth/register/", payload);
  saveAuth(data, rememberMe);
  return data;
}

export async function getProfile(): Promise<ProfileData> {
  const { data } = await API.get("/auth/profile/");
  return data;
}

export async function updateProfile(
  payload: Partial<ProfileData>,
): Promise<ProfileData> {
  const { data } = await API.put("/auth/profile/", payload);
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string; token: string }> {
  const { data } = await API.post("/auth/change-password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  // Update stored token in the same storage it was originally in
  const keys = PORTAL_KEYS[detectPortal()];
  if (localStorage.getItem(keys.token)) {
    localStorage.setItem(keys.token, data.token);
  } else {
    sessionStorage.setItem(keys.token, data.token);
  }
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await API.post("/auth/forgot-password/", { email });
  return data;
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  const { data } = await API.post("/auth/reset-password/", { token, new_password });
  return data;
}

export async function riderRegister(payload: RegisterData, rememberMe: boolean = false): Promise<AuthResponse> {
  const { data } = await API.post("/rider/register/", payload);
  saveAuth(data, rememberMe);
  return data;
}

export async function riderLogin(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
  const { data } = await API.post("/rider/login/", { email, password });
  saveAuth(data, rememberMe);
  return data;
}
