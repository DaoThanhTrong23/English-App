import { axiosClient } from '../../../config/axios';

export interface AdminNotification {
  id: number;
  userId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async () => {
  const response = await axiosClient.get<{ success: boolean; data: AdminNotification[]; unreadCount: number }>('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await axiosClient.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosClient.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: number) => {
  const response = await axiosClient.delete(`/notifications/${id}`);
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await axiosClient.delete('/notifications/clear-all');
  return response.data;
};
