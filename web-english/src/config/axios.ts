import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Tự động đính kèm Token vào mọi Request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
