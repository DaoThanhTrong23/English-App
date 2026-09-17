import { axiosClient } from '../../../config/axios';

export const getDashboardStats = async () => {
  const response = await axiosClient.get('/admin/dashboard/stats');
  return response.data;
};
