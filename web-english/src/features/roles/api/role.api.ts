import { axiosClient } from '../../../config/axios';

export interface PermissionItem {
  id: number;
  name: string;
  description: string | null;
  module: string;
}

export interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  permissions: PermissionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionsResponse {
  total: number;
  grouped: Record<string, PermissionItem[]>;
  list: PermissionItem[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

/**
 * Lấy danh sách tất cả các vai trò
 */
export const fetchRoles = async () => {
  const res = await axiosClient.get<{ success: boolean; data: RoleItem[] }>('/admin/roles');
  return res.data;
};

/**
 * Lấy danh sách toàn bộ quyền hạn phân nhóm theo module
 */
export const fetchPermissions = async () => {
  const res = await axiosClient.get<{ success: boolean; data: PermissionsResponse }>('/admin/roles/permissions');
  return res.data;
};

/**
 * Lấy chi tiết một vai trò theo ID
 */
export const fetchRoleDetail = async (id: number) => {
  const res = await axiosClient.get<{ success: boolean; data: RoleItem }>(`/admin/roles/${id}`);
  return res.data;
};

/**
 * Tạo vai trò tùy chỉnh mới
 */
export const createRole = async (payload: CreateRolePayload) => {
  const res = await axiosClient.post<{ success: boolean; data: RoleItem }>('/admin/roles', payload);
  return res.data;
};

/**
 * Cập nhật vai trò tùy chỉnh
 */
export const updateRole = async (id: number, payload: UpdateRolePayload) => {
  const res = await axiosClient.put<{ success: boolean; data: RoleItem }>(`/admin/roles/${id}`, payload);
  return res.data;
};

/**
 * Xóa vai trò tùy chỉnh
 */
export const deleteRole = async (id: number) => {
  const res = await axiosClient.delete<{ success: boolean; message: string }>(`/admin/roles/${id}`);
  return res.data;
};
