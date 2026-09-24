import { axiosClient } from '../../../config/axios';

export const fetchGames = async () => {
  const response = await axiosClient.get('/games/admin');
  return response.data;
};

export const updateGameSettings = async (id: number, settings: any[]) => {
  const response = await axiosClient.put(`/games/admin/${id}/settings`, { settings });
  return response.data;
};
