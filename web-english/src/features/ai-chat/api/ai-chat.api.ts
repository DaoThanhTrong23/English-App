import { axiosClient } from '../../../config/axios';

export const getAiSessions = async () => {
  const response = await axiosClient.get('/ai/admin/sessions');
  return response.data;
};

export const getAiSessionMessages = async (sessionId: number) => {
  const response = await axiosClient.get('/ai/admin/sessions/' + sessionId + '/messages');
  return response.data;
};
