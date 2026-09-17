import { axiosClient } from '../../../config/axios';

export const fetchActivities = async (page: number = 1, limit: number = 20) => {
  const response = await axiosClient.get(`/admin/logs/activities?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchLoginLogs = async (page: number = 1, limit: number = 20) => {
  const response = await axiosClient.get(`/admin/logs/login-logs?page=${page}&limit=${limit}`);
  return response.data;
};
