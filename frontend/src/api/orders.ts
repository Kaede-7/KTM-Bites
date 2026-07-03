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
// Rider's live GPS coordinates
export interface RiderLocation {
  lat: number;
  lng: number;
}

// Rider's contact info for the driver card
export interface RiderInfo {
  id?: number;
  name: string;
  phone: string;
  vehicle_type: string;
  rating?: number;
  rating_count?: number;
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
  discount_amount?: number;
  rank_applied?: string;
  total: number;
  items: OrderItemData[];  // List of items in this order
  created_at: string;      // When the order was placed (ISO date string)
  rider_location?: RiderLocation | null;  // Live GPS coordinates of rider
  rider_info?: RiderInfo | null;          // Rider name and phone
  has_reviewed_rider?: boolean;           // True if user has rated this rider for this order
  can_manage?: boolean;                   // Host/owner-only order actions
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

/** Re-initiate payment for an existing order */
export async function reinitiatePayment(id: number): Promise<{ pidx?: string; payment_url?: string; checkout_url?: string; order_id: number }> {
  const { data } = await API.post(`/orders/${id}/reinitiate-payment/`);
  return data;
}

/** Update an existing order (only works before payment is completed) */
export async function updateOrder(id: number, payload: Partial<PlaceOrderPayload>): Promise<OrderData> {
  const { data } = await API.patch(`/orders/${id}/update/`, payload);
  return data;
}

/** Update rider's GPS location (called by riders during delivery) */
export async function updateRiderLocation(lat: number, lng: number): Promise<void> {
  await API.put('/rider/location/', { lat, lng });
}

/** Rate and review a rider for a delivered order */
export async function rateRider(orderId: number, rating: number, comment: string = ""): Promise<{ message: string; has_reviewed_rider: boolean; rider_info: RiderInfo }> {
  const { data } = await API.post(`/orders/${orderId}/rate-rider/`, { rating, comment });
  return data;
}

