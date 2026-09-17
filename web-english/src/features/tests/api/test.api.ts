import { axiosClient } from '../../../config/axios';

export const fetchTests = async (ceftLevel?: string, search?: string, lessonId?: number) => {
  const params: any = {};
  if (ceftLevel) params.ceftLevel = ceftLevel;
  if (search) params.search = search;
  if (lessonId !== undefined) params.lessonId = lessonId;
  const response = await axiosClient.get('/admin/tests', { params });
  return response.data;
};

export const createTest = async (data: any) => {
  const response = await axiosClient.post('/admin/tests', data);
  return response.data;
};

export const updateTest = async (id: number | string, data: any) => {
  const response = await axiosClient.put(`/admin/tests/${id}`, data);
  return response.data;
};

export const deleteTest = async (id: number | string) => {
  const response = await axiosClient.delete(`/admin/tests/${id}`);
  return response.data;
};

export const fetchQuestions = async (testId: number | string) => {
  const response = await axiosClient.get(`/admin/tests/${testId}/questions`);
  return response.data;
};

export const createQuestion = async (testId: number | string, data: any) => {
  const response = await axiosClient.post(`/admin/tests/${testId}/questions`, data);
  return response.data;
};

export const updateQuestion = async (testId: number | string, questionId: number | string, data: any) => {
  const response = await axiosClient.put(`/admin/tests/${testId}/questions/${questionId}`, data);
  return response.data;
};

export const deleteQuestion = async (testId: number | string, questionId: number | string) => {
  const response = await axiosClient.delete(`/admin/tests/${testId}/questions/${questionId}`);
  return response.data;
};

export const importQuestionsFromExcel = async (testId: number | string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosClient.post(`/admin/tests/${testId}/questions/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
};

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosClient.post('/admin/tests/upload-media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
};
