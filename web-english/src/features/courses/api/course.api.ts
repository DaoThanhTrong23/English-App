import { axiosClient } from '../../../config/axios';

export const getTotalCourse = async () => {
  const response = await axiosClient.get('/admin/courses/totalCourse');
  return response.data.data.total;
};

export const fetchCourses = async (page: number, limit: number, search?: string, cefrLevel?: string) => {
  const params: any = { page, limit };
  if (search) params.search = search;
  if (cefrLevel) params.cefrLevel = cefrLevel;
  
  const response = await axiosClient.get('/admin/courses', { params });
  return response.data;
};

export const createCourse = async (courseData: any) => {
  const response = await axiosClient.post('/admin/courses', courseData);
  return response.data;
};

export const updateCourse = async (id: string | number, courseData: any) => {
  const response = await axiosClient.put(`/admin/courses/${id}`, courseData);
  return response.data;
};

export const deleteCourse = async (id: string | number) => {
  const response = await axiosClient.delete(`/admin/courses/${id}`);
  return response.data;
};

export const restoreCourse = async (id: string | number) => {
  const response = await axiosClient.patch(`/admin/courses/${id}/restore`);
  return response.data;
};

export const addWordsToCourse = async (id: string | number, wordIds: number[]) => {
  const response = await axiosClient.post(`/admin/courses/${id}/words`, { wordIds });
  return response.data;
};

export const removeWordFromCourse = async (courseId: string | number, wordId: string | number) => {
  const response = await axiosClient.delete(`/admin/courses/${courseId}/words/${wordId}`);
  return response.data;
};
