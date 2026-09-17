import { axiosClient } from '../../../config/axios';

// API gọi endpoint đếm tổng số học viên
export const getTotalStudents = async () => {
  const response = await axiosClient.get('/admin/students/totalStudent');
  // BE của bạn trả về: { success: true, message: "...", data: result }
  // Nên ta return response.data.data để lấy đúng con số
  return response.data.data.total; 
};
