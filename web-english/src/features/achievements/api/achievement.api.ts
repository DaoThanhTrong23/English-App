import { axiosClient } from '../../../config/axios';

export const fetchAchievements = async () => {
  const response = await axiosClient.get('/admin/achievements');
  return response.data;
};

export const createAchievement = async (data: any) => {
  const response = await axiosClient.post('/admin/achievements', data);
  return response.data;
};

export const updateAchievement = async (id: number, data: any) => {
  const response = await axiosClient.put(`/admin/achievements/${id}`, data);
  return response.data;
};

export const deleteAchievement = async (id: number) => {
  const response = await axiosClient.delete(`/admin/achievements/${id}`);
  return response.data;
};
