// ============================================================
// orders.ts — Frontend API for order operations
// ============================================================
// This file handles all communication with the backend
// related to orders: placing, viewing, and cancelling.
// ============================================================

import API from './axios';

// --- Type Definitions ---

// A single item inside an order
export interface OrderItemData {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  subtotal: number;  // price × quantity
}

// A complete order with all its details
export interface OrderData {
  id: number;
  order_id: string;        // Human-readable order ID (e.g. "KTM-001")
  status: string;          // "placed", "preparing", "on_way", "delivered", "cancelled"
  status_display: string;  // Formatted status for display
  payment_method: string;  // "khalti"
  payment_status?: string; // "pending", "completed", "failed"
  transaction_id?: string; // Khalti transaction ID
  full_name: string;
  phone: string;
  address: string;
  city: string;
  landmark: string;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: OrderItemData[];  // List of items in this order
  created_at: string;      // When the order was placed (ISO date string)
}

// Data needed to place a new order
export interface PlaceOrderPayload {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  landmark?: string;  // Optional
  notes?: string;     // Optional
  payment_method: string;
}

// --- API Functions ---

/** Place a new order (moves cart items into an order) */
export async function placeOrder(payload: PlaceOrderPayload): Promise<OrderData> {
  const { data } = await API.post('/orders/', payload);
  return data;
}

/** Initiate Khalti payment (creates order and gets payment URL) */
export async function initiatePayment(payload: PlaceOrderPayload & { return_url?: string; website_url?: string }): Promise<{ pidx: string; payment_url: string; order_id: number }> {
  const { data } = await API.post('/payments/initiate/', payload);
  return data;
}

/** Get all orders for the logged-in user (most recent first) */
export async function getOrders(): Promise<OrderData[]> {
  const { data } = await API.get('/orders/');
  return data;
}

/** Get a single order by its ID */
export async function getOrder(id: number): Promise<OrderData> {
  const { data } = await API.get(`/orders/${id}/`);
  return data;
}

/** Cancel an order (only works within 5 minutes of placing it) */
export async function cancelOrder(id: number): Promise<{ message: string; order: OrderData }> {
  const { data } = await API.post(`/orders/${id}/cancel/`);
  return data;
}

