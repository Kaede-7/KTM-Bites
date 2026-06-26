import API from './axios';

export interface GroupMember {
  id: number;
  user: number;
  name: string;
  email: string;
  calorie_target: number;
  kharcha_linked: boolean;
}

export interface GroupItem {
  id: number;
  menu_item: number;
  name: string;
  image: string;
  price: number;
  calories: number;
  quantity: number;
  added_by: number;
  owner_name: string;
  subtotal: number;
  total_calories: number;
}

export interface PaymentShare {
  id: number;
  user: number;
  name: string;
  amount: number;
  status: string;
  transaction_id: string;
  is_current_user: boolean;
  paid_by?: number | null;
  paid_by_name?: string | null;
  payment_payer?: number | null;
  payment_payer_name?: string | null;
}

export interface GroupOrderData {
  id: number;
  name: string;
  invite_code: string;
  status: 'open' | 'locked' | 'paying' | 'completed' | 'cancelled';
  split_mode: 'single' | 'equal' | 'items';
  single_payment_mode: 'treat' | 'settle_later';
  host: number;
  host_name: string;
  is_host: boolean;
  members: GroupMember[];
  items: GroupItem[];
  payment_shares: PaymentShare[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  total_calories: number;
  calorie_target: number;
  calorie_percentage: number;
  order?: number;
  kharcha_group_id?: string;
  kharcha_sync_status?: string;
  kharcha_missing_members: string[];
}

export const listGroups = async (): Promise<GroupOrderData[]> =>
  (await API.get('/groups/')).data;

export const createGroup = async (name: string): Promise<GroupOrderData> =>
  (await API.post('/groups/', { name })).data;

export const getGroup = async (code: string): Promise<GroupOrderData> =>
  (await API.get(`/groups/${code}/`)).data;

export const joinGroup = async (code: string): Promise<GroupOrderData> =>
  (await API.post(`/groups/${code}/join/`)).data;

export const addGroupItem = async (
  code: string,
  menuItemId: number,
  allowOverLimit = false,
): Promise<GroupOrderData> =>
  (await API.post(`/groups/${code}/items/`, {
    menu_item_id: menuItemId,
    quantity: 1,
    allow_over_limit: allowOverLimit,
  })).data;

export const updateGroupItem = async (
  code: string,
  itemId: number,
  quantity: number,
  allowOverLimit = false,
): Promise<GroupOrderData> =>
  (await API.put(`/groups/${code}/items/${itemId}/`, {
    quantity,
    allow_over_limit: allowOverLimit,
  })).data;

export const removeGroupItem = async (code: string, itemId: number): Promise<GroupOrderData> =>
  (await API.delete(`/groups/${code}/items/${itemId}/`)).data;

export const checkoutGroup = async (
  code: string,
  payload: Record<string, string>,
): Promise<GroupOrderData> =>
  (await API.post(`/groups/${code}/checkout/`, payload)).data;

export const initiateGroupPayment = async (code: string, targetUserId?: number) =>
  (await API.post(`/groups/${code}/pay/initiate/`, {
    target_user_id: targetUserId,
  })).data;

export const confirmGroupPayment = async (code: string, paymentId: string, otp: string) =>
  (await API.post(`/groups/${code}/pay/confirm/`, { payment_id: paymentId, otp })).data;
