import API from './axios';

export interface OrderItemData {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  subtotal: number;
}

export interface OrderData {
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
  items: OrderItemData[];
  created_at: string;
}

export interface PlaceOrderPayload {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  landmark?: string;
  notes?: string;
  payment_method: string;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<OrderData> {
  const { data } = await API.post('/orders/', payload);
  return data;
}

export async function getOrders(): Promise<OrderData[]> {
  const { data } = await API.get('/orders/');
  return data;
}

export async function getOrder(id: number): Promise<OrderData> {
  const { data } = await API.get(`/orders/${id}/`);
  return data;
}

export async function cancelOrder(id: number): Promise<{ message: string; order: OrderData }> {
  const { data } = await API.post(`/orders/${id}/cancel/`);
  return data;
}
