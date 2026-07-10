// ============================================================
// cashier.ts — Frontend API for the physical-store POS portal
// ============================================================
// Talks to the /api/cashier/* endpoints. All requests made while
// on a /cashier* route automatically carry the cashier token
// (see axios.ts getPortalTokenKey).
// ============================================================

import API from "./axios";
import { saveAuth, type AuthResponse } from "./auth";

// ── Types ────────────────────────────────────────────────────

export interface CashierUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  store_name: string;
  counter_name: string;
  employee_id: string;
}

export interface CashierOrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  subtotal: number;
}

export interface CashierOrder {
  id: number;
  order_id: string;
  status: string;
  status_display: string;
  order_type: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  full_name: string;
  phone: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  amount_tendered?: number | null;
  change_due?: number | null;
  served_by_name?: string | null;
  items: CashierOrderItem[];
  created_at: string;
}

export interface CashierOrdersResponse {
  active: CashierOrder[];
  past: CashierOrder[];
}

export interface NewOrderLine {
  menu_item_id: number;
  quantity: number;
}

export interface QrSession {
  success: boolean;
  order_id: number;
  session_id: string;
  qr_payload: string;
  amount: number;
  expires_at: string | null;
  merchant?: string;
}

// ── Auth ─────────────────────────────────────────────────────

export async function cashierLogin(
  email: string,
  password: string,
  rememberMe = false
): Promise<AuthResponse> {
  const { data } = await API.post("/cashier/login/", { email, password });
  saveAuth(data, rememberMe, "cashier");
  return data;
}

export async function getCashierMe(): Promise<CashierUser> {
  const { data } = await API.get("/cashier/me/");
  return data;
}

// ── Orders ───────────────────────────────────────────────────

export async function createCashierOrder(payload: {
  items: NewOrderLine[];
  order_type: "dine_in" | "pickup";
  customer_name?: string;
  customer_phone?: string;
}): Promise<CashierOrder> {
  const { data } = await API.post("/cashier/orders/create/", payload);
  return data;
}

export async function getCashierOrders(): Promise<CashierOrdersResponse> {
  const { data } = await API.get("/cashier/orders/");
  return data;
}

export async function markCollected(order_id: number): Promise<{ order: CashierOrder }> {
  const { data } = await API.post("/cashier/orders/collect/", { order_id });
  return data;
}

// ── Payments ─────────────────────────────────────────────────

// A hard timeout on every payment request so the register can never hang
// on a spinner if the backend or Kharcha is unreachable.
const PAY_TIMEOUT = 20000;

export type PaidMethod = "cash" | "kharcha_qr" | "kharcha_card";

export async function payCash(
  order_id: number,
  amount_tendered: number
): Promise<{ success: boolean; change_due: number; order: CashierOrder }> {
  const { data } = await API.post(
    "/cashier/pay/cash/",
    { order_id, amount_tendered },
    { timeout: PAY_TIMEOUT }
  );
  return data;
}

/** Open a Kharcha dynamic-QR session the customer scans in the Kharcha app. */
export async function kharchaQrCreate(order_id: number): Promise<QrSession> {
  const { data } = await API.post(
    "/cashier/pay/kharcha-qr/create/",
    { order_id },
    { timeout: PAY_TIMEOUT }
  );
  return data;
}

/** Poll the dynamic-QR session ("pending" until paid, then "success"). */
export async function kharchaQrStatus(
  order_id: number
): Promise<{ status: string; paid: boolean; order?: CashierOrder }> {
  const { data } = await API.get("/cashier/pay/kharcha-qr/status/", {
    params: { order_id },
    timeout: PAY_TIMEOUT,
  });
  return data;
}

/** Open a Kharcha POS card payment session (customer taps card + PIN on the terminal). */
export async function kharchaCardCreate(
  order_id: number
): Promise<{ success: boolean; session_id: string; status: string; amount: number }> {
  const { data } = await API.post(
    "/cashier/pay/kharcha-card/create/",
    { order_id },
    { timeout: PAY_TIMEOUT }
  );
  return data;
}

/** Poll the card session until the terminal authorizes it ("paid"). */
export async function kharchaCardStatus(
  order_id: number
): Promise<{ status: string; paid: boolean; failed?: boolean; order?: CashierOrder }> {
  const { data } = await API.get("/cashier/pay/kharcha-card/status/", {
    params: { order_id },
    timeout: PAY_TIMEOUT,
  });
  return data;
}

/** Manual fallback: cashier confirms payment was received. */
export async function confirmPayment(
  order_id: number,
  method: PaidMethod
): Promise<{ success: boolean; order: CashierOrder }> {
  const { data } = await API.post(
    "/cashier/pay/confirm/",
    { order_id, method },
    { timeout: PAY_TIMEOUT }
  );
  return data;
}
