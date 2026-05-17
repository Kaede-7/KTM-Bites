import API from "./axios";
import { AxiosError } from "axios";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface KitchenOrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  subtotal: number;
}

export interface KitchenOrder {
  id: number;
  order_id: string;
  status: string;
  status_display: string;
  payment_method: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  landmark: string;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  rider?: number;
  items: KitchenOrderItem[];
  created_at: string;
}

// ═══════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════

interface ErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: any;
}

const handleError = (error: AxiosError<ErrorResponse>) => {
  const message =
    error.response?.data?.error ||
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";
  throw new Error(message);
};

// ═══════════════════════════════════════════
// KITCHEN API CALLS
// ═══════════════════════════════════════════

export const fetchKitchenOrders = async (status?: string): Promise<KitchenOrder[]> => {
  try {
    const url = status ? `/admin/orders/?status=${status}` : "/admin/orders/";
    const response = await API.get(url);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
    return [];
  }
};

export const updateOrderStatus = async (
  id: number,
  status: string
): Promise<KitchenOrder> => {
  try {
    const response = await API.patch(`/admin/orders/${id}/`, { status });
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
    throw error;
  }
};

export const fetchOrderDetail = async (id: number): Promise<KitchenOrder> => {
  try {
    const response = await API.get(`/admin/orders/${id}/`);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
    throw error;
  }
};
