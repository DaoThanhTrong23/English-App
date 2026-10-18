import { axiosClient } from '../../../config/axios';

export interface AiSession {
  id: number;
  userId: number;
  title?: string | null;
  startedAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string | null;
    cefrLevel?: string | null;
  };
  _count?: {
    messages: number;
  };
  messages?: {
    messageText: string;
    sender: 'user' | 'ai';
    createdAt: string;
  }[];
}

export interface AiMessage {
  id: number;
  sessionId: number;
  sender: 'user' | 'ai';
  messageText: string;
  createdAt: string;
}

export interface AiChatStats {
  totalSessions: number;
  totalMessages: number;
  activeUsers: number;
  avgMessagesPerSession: number;
}

export const getAiSessions = async (search?: string) => {
  const params = search ? { search } : {};
  const response = await axiosClient.get<{ success: boolean; data: AiSession[] }>('/ai/admin/sessions', { params });
  return response.data;
};

export const getAiSessionMessages = async (sessionId: number) => {
  const response = await axiosClient.get<{ success: boolean; data: AiMessage[] }>('/ai/admin/sessions/' + sessionId + '/messages');
  return response.data;
};

export const getAiChatStats = async () => {
  const response = await axiosClient.get<{ success: boolean; data: AiChatStats }>('/ai/admin/stats');
  return response.data;
};

export const deleteAiSession = async (sessionId: number) => {
  const response = await axiosClient.delete<{ success: boolean; message: string }>('/ai/admin/sessions/' + sessionId);
  return response.data;
};
