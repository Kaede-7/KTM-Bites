import API from './axios';
import { AxiosError } from 'axios';

export interface CartItemData {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  subtotal: number;
  calories: number;
  total_calories: number;
}

export interface CartData {
  id: number;
  items: CartItemData[];
  total: number;
  item_count: number;
  total_calories: number;
  calorie_target: number | null;
  calorie_percentage: number;
  calorie_exceeded: boolean;
}

interface CalorieLimitResponse {
  code: string;
  message: string;
}

async function retryIfCalorieApproved(
  error: unknown,
  retry: () => Promise<CartData>,
): Promise<CartData> {
  const axiosError = error as AxiosError<CalorieLimitResponse>;
  const data = axiosError.response?.data;
  if (
    axiosError.response?.status === 409 &&
    data?.code === 'calorie_limit_exceeded' &&
    window.confirm(data.message)
  ) {
    return retry();
  }
  throw error;
}

export async function getCart(): Promise<CartData> {
  const { data } = await API.get('/cart/');
  return data;
}

export async function addToCart(menuItemId: number, quantity: number = 1): Promise<CartData> {
  try {
    const { data } = await API.post('/cart/add/', { menu_item_id: menuItemId, quantity });
    return data;
  } catch (error) {
    return retryIfCalorieApproved(error, async () => {
      const { data } = await API.post('/cart/add/', {
        menu_item_id: menuItemId,
        quantity,
        allow_over_limit: true,
      });
      return data;
    });
  }
}

export async function updateCartItem(cartItemId: number, quantity: number): Promise<CartData> {
  try {
    const { data } = await API.put(`/cart/update/${cartItemId}/`, { quantity });
    return data;
  } catch (error) {
    return retryIfCalorieApproved(error, async () => {
      const { data } = await API.put(`/cart/update/${cartItemId}/`, {
        quantity,
        allow_over_limit: true,
      });
      return data;
    });
  }
}

export async function removeFromCart(cartItemId: number): Promise<CartData> {
  const { data } = await API.delete(`/cart/remove/${cartItemId}/`);
  return data;
}
