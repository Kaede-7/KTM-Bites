import API from './axios';

export interface CartItemData {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  subtotal: number;
}

export interface CartData {
  id: number;
  items: CartItemData[];
  total: number;
  item_count: number;
}

export async function getCart(): Promise<CartData> {
  const { data } = await API.get('/cart/');
  return data;
}

export async function addToCart(menuItemId: number, quantity: number = 1): Promise<CartData> {
  const { data } = await API.post('/cart/add/', { menu_item_id: menuItemId, quantity });
  return data;
}

export async function updateCartItem(cartItemId: number, quantity: number): Promise<CartData> {
  const { data } = await API.put(`/cart/update/${cartItemId}/`, { quantity });
  return data;
}

export async function removeFromCart(cartItemId: number): Promise<CartData> {
  const { data } = await API.delete(`/cart/remove/${cartItemId}/`);
  return data;
}
