import { axiosClient } from '../../../config/axios';

export const fetchTopics = async (cefrLevel?: string) => {
  const params = cefrLevel ? { cefrLevel } : {};
  const response = await axiosClient.get('/admin/topics', { params });
  return response.data;
};

export const createTopic = async (data: any) => {
  const response = await axiosClient.post('/admin/topics', data);
  return response.data;
};

export const updateTopic = async (id: number, data: any) => {
  const response = await axiosClient.put(`/admin/topics/${id}`, data);
  return response.data;
};

export const deleteTopic = async (id: number) => {
  const response = await axiosClient.delete(`/admin/topics/${id}`);
  return response.data;
};
