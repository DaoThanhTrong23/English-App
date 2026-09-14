import { axiosClient } from '../../../config/axios';
import type { StudentParams, StudentResponse } from '../types/student.types';

// API Lấy danh sách học viên
export const getStudents = async (params: StudentParams): Promise<StudentResponse> => {
  const response = await axiosClient.get('/admin/students', { params });
  return response.data;
};

// API Lấy chi tiết 1 học viên
export const getStudentDetail = async (id: number) => {
  const response = await axiosClient.get(`/admin/students/${id}`);
  return response.data;
};

export const getTotalStudents = async () => {
  const response = await axiosClient.get('/admin/students/totalStudent');
  return response.data.data.total; 
};