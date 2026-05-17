import api from "./axios";

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  order_id: number | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unread_count: number;
};

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const { data } = await api.get("/notifications/");
  return data;
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await api.post(`/notifications/${id}/read/`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post("/notifications/read-all/");
};
