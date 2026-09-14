import { axiosClient } from '../../../config/axios';

export const getTotalWord = async () => {
  const response = await axiosClient.get('/admin/word/totalWord');
  return response.data.data; 
};