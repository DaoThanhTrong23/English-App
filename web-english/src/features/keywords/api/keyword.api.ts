import { axiosClient } from '../../../config/axios';

export interface KeywordGroup {
  id: string;
  group: string;
  keywords: string[];
}

export const fetchKeywords = async () => {
  const response = await axiosClient.get('/admin/keywords');
  return response.data;
};

export const createKeyword = async (data: { group: string; keywords: string[] | string }) => {
  const response = await axiosClient.post('/admin/keywords', data);
  return response.data;
};

export const updateKeyword = async (id: string, data: { group: string; keywords: string[] | string }) => {
  const response = await axiosClient.put(`/admin/keywords/${encodeURIComponent(id)}`, data);
  return response.data;
};

export const deleteKeyword = async (id: string) => {
  const response = await axiosClient.delete(`/admin/keywords/${encodeURIComponent(id)}`);
  return response.data;
};

export const downloadKeywordCsv = async () => {
  const response = await axiosClient.get('/admin/keywords/download', {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'synonyms.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
