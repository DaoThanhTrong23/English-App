import { axiosClient } from '../api/axiosClient';

/**
 * Chuyển đổi đường dẫn ảnh từ backend (tương đối hoặc tuyệt đối) thành URL đầy đủ cho Mobile.
 * Nếu không có ảnh hoặc đường dẫn rỗng, trả về null.
 */
export const getFullMediaUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) {
    return trimmed;
  }
  const baseURL = axiosClient.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://10.0.2.2:3000';
  const prefix = trimmed.startsWith('/') ? '' : '/';
  return `${baseURL}${prefix}${trimmed}`;
};
