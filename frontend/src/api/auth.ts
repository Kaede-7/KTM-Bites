import API from "./axios";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_staff?: boolean;
  is_superuser?: boolean;
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
}

// ── Helpers ──

export function saveAuth(data: AuthResponse, rememberMe: boolean = true) {
  if (rememberMe) {
    localStorage.setItem("ktmbites_token", data.token);
    localStorage.setItem("ktmbites_user", JSON.stringify(data.user));
    sessionStorage.removeItem("ktmbites_token");
    sessionStorage.removeItem("ktmbites_user");
  } else {
    sessionStorage.setItem("ktmbites_token", data.token);
    sessionStorage.setItem("ktmbites_user", JSON.stringify(data.user));
    localStorage.removeItem("ktmbites_token");
    localStorage.removeItem("ktmbites_user");
  }
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("ktmbites_user") || sessionStorage.getItem("ktmbites_user");
  return raw ? JSON.parse(raw) : null;
}

export function getToken(): string | null {
  return localStorage.getItem("ktmbites_token") || sessionStorage.getItem("ktmbites_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("ktmbites_token");
  localStorage.removeItem("ktmbites_user");
  sessionStorage.removeItem("ktmbites_token");
  sessionStorage.removeItem("ktmbites_user");
  window.location.href = "/login";
}

// ── API Calls ──

export async function login(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<AuthResponse> {
  const { data } = await API.post("/auth/login/", { email, password });
  saveAuth(data, rememberMe);
  return data;
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const { data } = await API.post("/auth/google/", { credential });
  saveAuth(data);
  return data;
}

export async function register(payload: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await API.post("/auth/register/", payload);
  saveAuth(data);
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
  // Update stored token since the old one is invalidated
  localStorage.setItem("ktmbites_token", data.token);
  return data;
}
