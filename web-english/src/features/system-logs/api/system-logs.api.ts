import { axiosClient } from '../../../config/axios';

export const fetchActivities = async (page: number = 1, limit: number = 20, search?: string, actionType?: string) => {
  let url = `/admin/logs/activities?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (actionType) url += `&actionType=${encodeURIComponent(actionType)}`;
  const response = await axiosClient.get(url);
  return response.data;
};

export const fetchLoginLogs = async (page: number = 1, limit: number = 20, search?: string) => {
  let url = `/admin/logs/login-logs?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const response = await axiosClient.get(url);
  return response.data;
};
