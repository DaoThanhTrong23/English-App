import { axiosClient } from '../../../config/axios';

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await axiosClient.post('/auth/change-password', { oldPassword, newPassword });
  return response.data;
};

export const getTopicSettings = async () => {
  const response = await axiosClient.get('/admin/topic-settings');
  return response.data;
};

export const updateTopicSettings = async (data: { defaultLimit?: number; groups?: Record<string, number>; levels?: Record<string, number> }) => {
  const response = await axiosClient.put('/admin/topic-settings', data);
  return response.data;
};
