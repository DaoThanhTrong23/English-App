import { axiosClient } from '../../../config/axios';
import type { PermissionItem, RoleItem } from '../../roles/api/role.api';

export interface StaffItem {
  id: number;
  username: string;
  email: string;
  job?: string | null;
  avatarUrl?: string | null;
  isLocked: boolean;
  roleId: number;
  role: {
    id: number;
    name: string;
    description?: string | null;
    permissionCount: number;
  };
  isAdmin: boolean;
  isSelf: boolean;
  canModify: boolean;
  canDelete: boolean;
  lastLoginDate?: string | null;
  createdAt: string;
}

export interface StaffDetailItem extends StaffItem {
  role: {
    id: number;
    name: string;
    description?: string | null;
    permissionCount: number;
    permissions: PermissionItem[];
  };
}

export interface CandidateUser {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
  job?: string | null;
  createdAt: string;
}

export interface StaffListResponse {
  staff: StaffItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateStaffPayload {
  username: string;
  email: string;
  password: string;
  roleId: number;
  job?: string;
}

export interface UpdateStaffPayload {
  username?: string;
  email?: string;
  password?: string;
  roleId?: number;
  job?: string;
  isLocked?: boolean;
}

/**
 * Lấy danh sách nhân viên
 */
export const fetchStaffList = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  isLocked?: boolean;
}) => {
  const res = await axiosClient.get<{ success: boolean; data: StaffListResponse }>('/admin/staff', {
    params,
  });
  return res.data;
};

/**
 * Lấy chi tiết nhân viên
 */
export const fetchStaffDetail = async (id: number) => {
  const res = await axiosClient.get<{ success: boolean; data: StaffDetailItem }>(`/admin/staff/${id}`);
  return res.data;
};

/**
 * Tạo mới tài khoản nhân viên / Admin
 */
export const createStaff = async (payload: CreateStaffPayload) => {
  const res = await axiosClient.post<{ success: boolean; data: StaffItem }>('/admin/staff', payload);
  return res.data;
};

/**
 * Cập nhật thông tin nhân viên / Đổi vai trò (gán quyền)
 */
export const updateStaff = async (id: number, payload: UpdateStaffPayload) => {
  const res = await axiosClient.put<{ success: boolean; data: StaffItem }>(`/admin/staff/${id}`, payload);
  return res.data;
};

/**
 * Xóa tài khoản nhân viên
 */
export const deleteStaff = async (id: number) => {
  const res = await axiosClient.delete<{ success: boolean; message: string }>(`/admin/staff/${id}`);
  return res.data;
};

/**
 * Nâng cấp tài khoản nhân viên lên Quản trị viên (Admin)
 */
export const promoteToAdmin = async (id: number) => {
  const res = await axiosClient.post<{ success: boolean; message: string; data: StaffItem }>(
    `/admin/staff/${id}/promote-admin`
  );
  return res.data;
};

/**
 * Tìm kiếm học viên để thăng cấp thành nhân viên
 */
export const searchCandidateUsers = async (search: string) => {
  const res = await axiosClient.get<{ success: boolean; data: CandidateUser[] }>('/admin/staff/candidates', {
    params: { search },
  });
  return res.data;
};

/**
 * Thăng cấp tài khoản học viên lên nhân viên / Admin
 */
export const promoteUserToStaff = async (payload: { userId: number; roleId: number }) => {
  const res = await axiosClient.post<{ success: boolean; message: string; data: StaffItem }>(
    '/admin/staff/promote-user',
    payload
  );
  return res.data;
};
