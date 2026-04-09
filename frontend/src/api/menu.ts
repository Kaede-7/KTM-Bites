import API from './axios';

export interface CategoryData {
  id: number;
  name: string;
  icon: string;
  count: number;
}

export interface MenuItemData {
  id: number;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  rating: number;
  reviews: number;
  time: string;
  image: string;
  description: string;
  badge: string;
  is_available: boolean;
}

export interface MenuItemDetailData extends MenuItemData {
  related: MenuItemData[];
}

export async function getCategories(): Promise<CategoryData[]> {
  const { data } = await API.get('/categories/');
  return data;
}

export async function getMenuItems(params?: {
  category?: string;
  search?: string;
  sort?: string;
}): Promise<MenuItemData[]> {
  const { data } = await API.get('/menu/', { params });
  return data;
}

export async function getMenuItem(id: number): Promise<MenuItemDetailData> {
  const { data } = await API.get(`/menu/${id}/`);
  return data;
}
