// ============================================================
// kharcha.ts — Frontend API for Kharcha payment integration
// ============================================================

import API from './axios';

// ── Types ──────────────────────────────────────────────────────

export interface KharchaLinkStatus {
  linked: boolean;
  linked_at?: string;
}

export interface KharchaPortalInitResponse {
  order_id: number;
  session_id: string;
  checkout_url: string;
  amount: number;
}

export interface KharchaLinkedInitResponse {
  success: boolean;
  order_id: number;
  payment_id: string;
  masked_email?: string;
  amount: number;
  message: string;
}

export interface KharchaConfirmResponse {
  success: boolean;
  order_id: number;
  transaction_id?: string;
  amount?: number;
  message: string;
  attempts_remaining?: number;
}

export interface PlaceOrderPayload {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  landmark?: string;
  notes?: string;
}

// ── Linked Account ─────────────────────────────────────────────

/** Check if the current user has a linked Kharcha account */
export async function getKharchaLinkStatus(): Promise<KharchaLinkStatus> {
  const { data } = await API.get('/kharcha/link/status/');
  return data;
}

/** Returns the URL to redirect the user to begin OAuth linking */
export function getKharchaLinkUrl(): string {
  const token =
    localStorage.getItem('ktmbites_token') ??
    sessionStorage.getItem('ktmbites_token') ??
    '';
  return `${API.defaults.baseURL}/kharcha/link/start/?token=${token}`;
}

/** Remove the linked Kharcha account */
export async function removeKharchaLink(): Promise<{ success: boolean; message: string }> {
  const { data } = await API.delete('/kharcha/link/remove/');
  return data;
}

// ── Pay with Linked Account (OTP flow) ────────────────────────

/** Initiate payment using linked account — creates order + sends OTP */
export async function initiateKharchaLinkedPayment(
  payload: PlaceOrderPayload
): Promise<KharchaLinkedInitResponse> {
  const { data } = await API.post('/kharcha/pay/initiate/', payload);
  return data;
}

/** Confirm payment with OTP */
export async function confirmKharchaPayment(
  payment_id: string,
  otp: string
): Promise<KharchaConfirmResponse> {
  const { data } = await API.post('/kharcha/pay/confirm/', { payment_id, otp });
  return data;
}

// ── Pay Portal (hosted checkout redirect) ─────────────────────

/** Create a Kharcha portal session — backend returns a checkout_url to redirect to */
export async function initiateKharchaPortalPayment(
  payload: PlaceOrderPayload
): Promise<KharchaPortalInitResponse> {
  const { data } = await API.post('/kharcha/portal/initiate/', payload);
  return data;
}