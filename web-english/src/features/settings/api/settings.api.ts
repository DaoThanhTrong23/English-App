import { axiosClient } from '../../../config/axios';

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await axiosClient.post('/auth/change-password', { oldPassword, newPassword });
  return response.data;
};
