import { axiosClient } from '../../../config/axios';

// Đăng nhập bằng Email/Username
export const loginWithEmail = async (identifier: string, password: string) => {
  const response = await axiosClient.post('/auth/login', {
    identifier,
    password,
  });
  return response.data.data;
};

//Đăng nhập bằng Google
export const loginWithGoogle = async (idToken: string) => {
  const response = await axiosClient.post('/auth/google', {
    idToken,
    deviceInfo: "Trình duyệt Web",
  });
  return response.data.data;
};

//Đăng nhập bằng Facebook
export const loginWithFacebook = async (accessToken: string) => {
  const response = await axiosClient.post('/auth/facebook', {
    accessToken,
    deviceInfo: "Trình duyệt Web",
  });
  return response.data.data;
};