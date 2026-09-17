import { axiosClient } from '../../../config/axios';

export const loginWithEmail = async (identifier: string, password: string) => {
  const response = await axiosClient.post('/auth/login', { identifier, password });
  return response.data.data;
};

export const loginWithGoogle = async (idToken: string) => {
  const response = await axiosClient.post('/auth/google', { idToken, deviceInfo: "Trình duyệt Web" });
  return response.data.data;
};

export const loginWithFacebook = async (accessToken: string) => {
  const response = await axiosClient.post('/auth/facebook', { accessToken, deviceInfo: "Trình duyệt Web" });
  return response.data.data;
};
