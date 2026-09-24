import { axiosClient } from '../../../config/axios';

export const getTotalWord = async () => {
  const response = await axiosClient.get('/admin/word/totalWord');
  return response.data.data; 
};

export const fetchWords = async (page: number, limit: number, search?: string, cefrLevel?: string) => {
  const params: any = { page, limit };
  if (search) params.search = search;
  if (cefrLevel) params.cefrLevel = cefrLevel;
  const response = await axiosClient.get('/admin/word', { params });
  return response.data;
};

export const createWord = async (wordData: any) => {
  const response = await axiosClient.post('/admin/word', wordData);
  return response.data;
};

export const createBulkWords = async (wordsData: any[]) => {
  const response = await axiosClient.post('/admin/word/bulk', wordsData);
  return response.data;
};

export const updateWord = async (id: string, wordData: any) => {
  const response = await axiosClient.put(`/admin/word/${id}`, wordData);
  return response.data;
};

export const deleteWord = async (id: string) => {
  const response = await axiosClient.delete(`/admin/word/${id}`);
  return response.data;
};

export const fetchTopics = async () => {
  const response = await axiosClient.get('/admin/topics');
  return response.data;
};

