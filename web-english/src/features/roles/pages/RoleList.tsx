import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Key, 
  Lock, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  fetchRoles, 
  fetchPermissions, 
  createRole, 
  updateRole, 
  deleteRole, 
  type RoleItem, 
  type PermissionsResponse, 
  type PermissionItem 
} from '../api/role.api';
import { useToast } from '../../../context/ToastContext';
import './RoleList.css';

const MODULE_LABELS: Record<string, string> = {
  // Web Admin Modules (Các chức năng quản trị)
  student_manage: "Quản lý Học viên",
  word: "Quản lý Từ vựng",
  course: "Khóa học & Bài học",
  topic: "Chủ đề bài học",
  test: "Bài kiểm tra & Đề thi",
  achievement: "Danh hiệu & Thành tựu",
  activity_log: "Nhật ký hoạt động hệ thống",
  dashboard: "Thống kê Dashboard",
  keyword_setting: "Cài đặt Từ khóa đồng nghĩa",
  topic_setting: "Cấu hình Chủ đề theo cấp độ",
  game: "Cấu hình Trò chơi ôn tập",
  notification: "Gửi thông báo hệ thống",
  ai: "Trí tuệ nhân tạo AI & Thống kê",
  role_manage: "Quản lý Vai trò & Phân quyền",

  // Mặc định (Tự động cấp cho mọi vai trò)
  auth: "Xác thực & Tài khoản (Mặc định)",
  profile: "Hồ sơ cá nhân (Mặc định)",

  // Client/Mobile Modules
  student_vocabulary: "Sổ tay từ vựng học viên",
  student_lesson: "Học tập khóa học & bài học",
  student_test: "Làm bài kiểm tra & thi thử",
  bubble_game: "Game Bắn bóng",
  memory_card: "Game Thẻ bài trí nhớ",
  word_matching: "Game Nối từ",
  mario_game: "Game Mario vượt ải",
  community: "Cộng đồng & Tương tác",
  leaderboard: "Bảng xếp hạng",
  quest: "Nhiệm vụ hàng ngày",
  onboarding: "Khảo sát ban đầu",
};

const MODULE_ORDER = [
  "dashboard",
  "student_manage",
  "topic",
  "course",
  "word",
  "test",
  "achievement",
  "keyword_setting",
  "topic_setting",
  "game",
  "notification",
  "ai",
  "activity_log",
  "role_manage",
  "auth",
  "profile",
];

const RoleList: React.FC = () => {
  const { toast, confirmModal } = useToast();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissionsData, setPermissionsData] = useState<PermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Create / Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    selectedPermissionIds: [] as number[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal View Permissions
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRole, setViewingRole] = useState<RoleItem | null>(null);

  // Filter permission in modal
  const [permSearch, setPermSearch] = useState('');
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
      ]);

      if (rolesRes.data) setRoles(rolesRes.data);
      if (permsRes.data) setPermissionsData(permsRes.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu vai trò và phân quyền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [roles, searchTerm]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      selectedPermissionIds: [],
    });
    setPermSearch('');
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (role: RoleItem) => {
    if (role.isSystem) {
      toast.info(`Vai trò mặc định '${role.name}' là vai trò hệ thống, chỉ hiển thị và không được phép chỉnh sửa!`);
      return;
    }
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      selectedPermissionIds: role.permissions.map((p) => p.id),
    });
    setPermSearch('');
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (role: RoleItem) => {
    setViewingRole(role);
    setIsViewModalOpen(true);
  };

  // Toggle Module Accordion
  const toggleModuleCollapse = (moduleName: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  // Toggle single permission selection (tự động bật/tắt toàn bộ quyền READ tương ứng)
  const handleTogglePermission = (toggledPerm: PermissionItem, moduleName: string) => {
    const allModulePerms = permissionsData?.grouped[moduleName] || [];
    const actionPerms = allModulePerms.filter((p) => !p.name.startsWith('READ_'));
    const readPerms = allModulePerms.filter((p) => p.name.startsWith('READ_'));

    setRoleForm((prev) => {
      const exists = prev.selectedPermissionIds.includes(toggledPerm.id);
      let updated = exists
        ? prev.selectedPermissionIds.filter((pid) => pid !== toggledPerm.id)
        : [...prev.selectedPermissionIds, toggledPerm.id];

      // Nếu module có các quyền thao tác (Thêm, Xóa, Sửa)
      if (actionPerms.length > 0) {
        // Kiểm tra xem sau thao tác này, trong module còn action nào được chọn không
        const hasActionRemaining = actionPerms.some((p) => updated.includes(p.id));
        const readIds = readPerms.map((p) => p.id);

        if (hasActionRemaining) {
          // Tự động BẬT (tick) toàn bộ quyền READ của tài nguyên này
          updated = Array.from(new Set([...updated, ...readIds]));
        } else {
          // Tự động TẮT (bỏ tick) toàn bộ quyền READ của tài nguyên này
          updated = updated.filter((id) => !readIds.includes(id));
        }
      }

      return {
        ...prev,
        selectedPermissionIds: updated,
      };
    });
  };

  // Select / Deselect all in module
  const handleToggleModulePermissions = (moduleName: string) => {
    const allModulePerms = permissionsData?.grouped[moduleName] || [];
    const actionPerms = allModulePerms.filter((p) => !p.name.startsWith('READ_'));
    const visiblePerms = actionPerms.length > 0 ? actionPerms : allModulePerms;
    const readPerms = allModulePerms.filter((p) => p.name.startsWith('READ_'));

    const visibleIds = visiblePerms.map((p) => p.id);
    const readIds = readPerms.map((p) => p.id);
    const allModuleIds = [...visibleIds, ...readIds];

    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => roleForm.selectedPermissionIds.includes(id));

    setRoleForm((prev) => {
      let updated: number[];
      if (allVisibleSelected) {
        // Bỏ chọn toàn bộ trong module này (bao gồm cả các quyền READ ngầm)
        updated = prev.selectedPermissionIds.filter((id) => !allModuleIds.includes(id));
      } else {
        // Chọn toàn bộ trong module này (tự động bật toàn bộ quyền READ ngầm)
        updated = Array.from(new Set([...prev.selectedPermissionIds, ...allModuleIds]));
      }
      return {
        ...prev,
        selectedPermissionIds: updated,
      };
    });
  };

  // Select all permissions
  const handleSelectAll = () => {
    if (!permissionsData) return;
    setRoleForm((prev) => ({
      ...prev,
      selectedPermissionIds: permissionsData.list.map((p) => p.id),
    }));
  };

  // Clear all permissions
  const handleClearAll = () => {
    setRoleForm((prev) => ({
      ...prev,
      selectedPermissionIds: [],
    }));
  };

  // Submit Create or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.info('Vui lòng nhập tên vai trò');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || undefined,
          permissionIds: roleForm.selectedPermissionIds,
        });
        toast.success(`Cập nhật vai trò '${roleForm.name}' thành công!`);
      } else {
        await createRole({
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || undefined,
          permissionIds: roleForm.selectedPermissionIds,
        });
        toast.success(`Tạo vai trò '${roleForm.name}' thành công!`);
      }

      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu vai trò');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Role
  const handleDeleteRole = (role: RoleItem) => {
    if (role.isSystem) {
      toast.info(`Vai trò mặc định '${role.name}' là vai trò hệ thống, không thể xóa!`);
      return;
    }

    if (role.userCount > 0) {
      toast.error(
        `Không thể xóa vai trò '${role.name}' vì đang có ${role.userCount} người dùng được gán vai trò này!`
      );
      return;
    }

    confirmModal({
      title: 'Xóa vai trò tùy chỉnh',
      message: `Bạn có chắc chắn muốn xóa vai trò "${role.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa vai trò',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteRole(role.id);
          toast.success(`Đã xóa vai trò '${role.name}' thành công!`);
          loadData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi xóa vai trò');
        }
      },
    });
  };

  // Grouped permissions for View Modal
  const viewingRoleGroupedPerms = useMemo(() => {
    if (!viewingRole) return {};
    const grouped: Record<string, PermissionItem[]> = {};
    for (const p of viewingRole.permissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  }, [viewingRole]);

  // Filtered permission modules for Edit Modal:
  // ẨN hoàn toàn các quyền READ nếu module đó có các quyền Thao tác (Thêm, Xóa, Sửa)
  const filteredPermissionGroups = useMemo(() => {
    if (!permissionsData?.grouped) return {};

    const term = permSearch.toLowerCase().trim();
    const result: Record<string, PermissionItem[]> = {};

    for (const [moduleName, perms] of Object.entries(permissionsData.grouped)) {
      const actionPerms = perms.filter((p) => !p.name.startsWith('READ_'));
      // Nếu module có quyền action (thao tác) -> CHỈ hiển thị quyền action, ẨN quyền READ
      // Nếu module chỉ có quyền xem (dashboard, activity_log) -> hiển thị để quản trị viên có thể cấp quyền xem
      const visiblePerms = actionPerms.length > 0 ? actionPerms : perms;

      const matching = term
        ? visiblePerms.filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              (p.description && p.description.toLowerCase().includes(term))
          )
        : visiblePerms;

      if (matching.length > 0) {
        result[moduleName] = matching;
      }
    }
    return result;
  }, [permissionsData, permSearch]);

  // Tổng số quyền chức năng hiển thị để chọn
  const totalVisiblePermsCount = useMemo(() => {
    if (!permissionsData?.grouped) return 0;
    let count = 0;
    for (const perms of Object.values(permissionsData.grouped)) {
      const actionPerms = perms.filter((p) => !p.name.startsWith('READ_'));
      count += actionPerms.length > 0 ? actionPerms.length : perms.length;
    }
    return count;
  }, [permissionsData]);

  // Số quyền chức năng hiển thị đang được chọn
  const selectedVisiblePermsCount = useMemo(() => {
    if (!permissionsData?.grouped) return 0;
    let count = 0;
    for (const perms of Object.values(permissionsData.grouped)) {
      const actionPerms = perms.filter((p) => !p.name.startsWith('READ_'));
      const visible = actionPerms.length > 0 ? actionPerms : perms;
      for (const p of visible) {
        if (roleForm.selectedPermissionIds.includes(p.id)) count++;
      }
    }
    return count;
  }, [permissionsData, roleForm.selectedPermissionIds]);

  const totalSystemRoles = roles.filter((r) => r.isSystem).length;
  const totalCustomRoles = roles.filter((r) => !r.isSystem).length;
  const totalPermsCount = permissionsData?.total || 0;

  return (
    <AdminLayout>
      <div className="role-page">
        {/* Header */}
        <div className="role-header">
          <div>
            <h1 className="role-header-title">
              {/* <ShieldCheck size={28} color="#2563eb" /> */}
              Quản lý vai trò & phân quyền
            </h1>
            <p className="role-header-desc">
              Quản lý danh sách vai trò người dùng và cấu hình ma trận quyền hạn tương ứng theo từng module.
            </p>
          </div>
          <button className="role-add-btn" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Thêm vai trò mới</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="role-stats-grid">
          <div className="role-stat-card">
            <div className="role-stat-icon blue">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="role-stat-label">Tổng số vai trò</div>
              <div className="role-stat-value">{roles.length}</div>
            </div>
          </div>

          <div className="role-stat-card">
            <div className="role-stat-icon purple">
              <Lock size={24} />
            </div>
            <div>
              <div className="role-stat-label">Vai trò mặc định (Hệ thống)</div>
              <div className="role-stat-value">{totalSystemRoles}</div>
            </div>
          </div>

          <div className="role-stat-card">
            <div className="role-stat-icon emerald">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="role-stat-label">Vai trò tùy chỉnh (Custom)</div>
              <div className="role-stat-value">{totalCustomRoles}</div>
            </div>
          </div>

          <div className="role-stat-card">
            <div className="role-stat-icon amber">
              <Key size={24} />
            </div>
            <div>
              <div className="role-stat-label">Tổng số quyền hệ thống</div>
              <div className="role-stat-value">{totalPermsCount}</div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="role-controls-bar">
          <div className="role-search-box">
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mô tả vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="role-loading-state">
            <div className="role-spinner" />
            <p>Đang tải danh sách vai trò và quyền hạn...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="role-empty-state">
            <ShieldAlert size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3>Không tìm thấy vai trò nào</h3>
            <p>Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bấm nút thêm vai trò mới.</p>
          </div>
        ) : (
          <div className="role-cards-grid">
            {filteredRoles.map((role) => (
              <div key={role.id} className="role-card">
                {/* Badge Top */}
                <div className="role-card-badge-top">
                  {role.isSystem ? (
                    <span className="badge-system">
                      <Lock size={12} />
                      Hệ thống (Mặc định)
                    </span>
                  ) : (
                    <span className="badge-custom">
                      <Sparkles size={12} />
                      Tùy chỉnh
                    </span>
                  )}
                </div>

                {/* Header */}
                <div className="role-card-header">
                  <div className={`role-card-avatar ${role.isSystem ? 'system' : ''}`}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="role-card-title">{role.name}</h3>
                  </div>
                </div>

                {/* Description */}
                <p className="role-card-desc">
                  {role.description || <em>Chưa có mô tả chi tiết cho vai trò này.</em>}
                </p>

                {/* Meta counts */}
                <div className="role-card-meta">
                  <div className="role-card-meta-item">
                    <Users size={16} color="#3b82f6" />
                    <span>{role.userCount} người dùng</span>
                  </div>
                  <div className="role-card-meta-item">
                    <Key size={16} color="#8b5cf6" />
                    <span>{role.permissionCount} quyền hạn</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="role-card-actions">
                  <button
                    className="role-btn-view"
                    onClick={() => handleOpenViewModal(role)}
                    title="Xem chi tiết các quyền hạn được gán"
                  >
                    <Eye size={15} />
                    <span>Xem quyền</span>
                  </button>

                  <button
                    className="role-btn-edit"
                    onClick={() => handleOpenEditModal(role)}
                    disabled={role.isSystem}
                    title={
                      role.isSystem
                        ? "Vai trò mặc định hệ thống không thể chỉnh sửa"
                        : "Chỉnh sửa vai trò"
                    }
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    className="role-btn-delete"
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.isSystem}
                    title={
                      role.isSystem
                        ? "Vai trò mặc định hệ thống không thể xóa"
                        : "Xóa vai trò"
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====================================================================
            MODAL: TẠO / CHỈNH SỬA VAI TRÒ
           ==================================================================== */}
        {isEditModalOpen && (
          <div className="role-modal-overlay" onClick={() => !submitting && setIsEditModalOpen(false)}>
            <div className="role-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="role-modal-header">
                <h3 className="role-modal-title">
                  {editingRole ? <Edit size={20} color="#2563eb" /> : <Plus size={20} color="#2563eb" />}
                  {editingRole ? `Chỉnh sửa vai trò: ${editingRole.name}` : "Tạo vai trò tùy chỉnh mới"}
                </h3>
                <button
                  className="role-modal-close-btn"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                <div className="role-modal-body">
                  <div className="role-default-perms-note">
                    <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Cơ chế cấp quyền tự động:</strong>
                      <div style={{ marginTop: 3, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                        • Các quyền xem (<strong>READ</strong>) đã được ẩn và sẽ <strong>tự động kích hoạt</strong> khi bạn chọn bất kỳ quyền Thêm, Sửa hoặc Xóa của tài nguyên đó.
                        <br />
                        • Nếu không có quyền Thêm, Sửa, Xóa nào được chọn, quyền xem của tài nguyên đó sẽ <strong>tự động hủy</strong>.
                        <br />
                        • Quyền <strong>Xác thực & Hồ sơ cá nhân</strong> cơ bản luôn được tự động cấp mặc định cho mọi tài khoản.
                      </div>
                    </div>
                  </div>

                  <div className="role-form-group">
                    <label className="role-form-label">
                      Tên vai trò <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="role-form-input"
                      placeholder="VD: GiaoVien, TroGiang, BienTapVien..."
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="role-form-group">
                    <label className="role-form-label">Mô tả chức năng & nhiệm vụ</label>
                    <textarea
                      className="role-form-textarea"
                      placeholder="Nhập ghi chú hoặc mô tả về vai trò này..."
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    />
                  </div>

                  {/* Permissions Selection Header */}
                  <div className="permissions-section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="role-form-label" style={{ margin: 0 }}>
                        Ma trận quyền hạn (Permissions Matrix)
                      </span>
                      <span className="permissions-count-badge">
                        Đã chọn: {selectedVisiblePermsCount} / {totalVisiblePermsCount} quyền chức năng
                      </span>
                    </div>

                    <div className="permissions-actions">
                      <button
                        type="button"
                        className="permissions-action-btn"
                        onClick={handleSelectAll}
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        className="permissions-action-btn"
                        onClick={handleClearAll}
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  </div>

                  {/* Filter permissions in modal */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="role-search-box" style={{ maxWidth: '100%' }}>
                      <Search size={16} color="#94a3b8" />
                      <input
                        type="text"
                        placeholder="Lọc nhanh quyền theo tên hoặc mô tả..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                      />
                      {permSearch && (
                        <button
                          type="button"
                          onClick={() => setPermSearch('')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permission Groups */}
                  {Object.keys(filteredPermissionGroups).length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      Không tìm thấy quyền nào phù hợp với từ khóa lọc
                    </div>
                  ) : (
                    Object.entries(filteredPermissionGroups)
                      .sort(([modA], [modB]) => {
                        const indexA = MODULE_ORDER.indexOf(modA);
                        const indexB = MODULE_ORDER.indexOf(modB);
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return modA.localeCompare(modB);
                      })
                      .map(([moduleName, perms]) => {
                      const isCollapsed = collapsedModules[moduleName];
                      const moduleIds = perms.map((p) => p.id);
                      const allModuleSelected = moduleIds.length > 0 && moduleIds.every((id) =>
                        roleForm.selectedPermissionIds.includes(id)
                      );
                      const someModuleSelected = moduleIds.some((id) =>
                        roleForm.selectedPermissionIds.includes(id)
                      );

                      return (
                        <div key={moduleName} className="permissions-module-group">
                          <div
                            className="permissions-module-header"
                            onClick={() => toggleModuleCollapse(moduleName)}
                          >
                            <div className="permissions-module-title">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleModulePermissions(moduleName);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: allModuleSelected ? '#2563eb' : '#64748b'
                                }}
                              >
                                {allModuleSelected ? (
                                  <CheckSquare size={18} />
                                ) : someModuleSelected ? (
                                  <CheckSquare size={18} style={{ opacity: 0.6 }} />
                                ) : (
                                  <Square size={18} />
                                )}
                              </button>
                              <span>{MODULE_LABELS[moduleName] || moduleName.toUpperCase()}</span>
                              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                                ({perms.filter((p) => roleForm.selectedPermissionIds.includes(p.id)).length} / {perms.length})
                              </span>
                              {someModuleSelected && (permissionsData?.grouped[moduleName] || []).some((p) => p.name.startsWith('READ_')) && perms.some((p) => !p.name.startsWith('READ_')) && (
                                <span style={{ fontSize: 11, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 9999, fontWeight: 500, marginLeft: 6 }}>
                                  ✓ Đã tự động kèm quyền xem
                                </span>
                              )}
                            </div>

                            <div>
                              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="permissions-items-grid">
                              {perms.map((p) => {
                                const isChecked = roleForm.selectedPermissionIds.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`permission-checkbox-item ${isChecked ? 'checked' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(p, moduleName)}
                                    />
                                    <div className="permission-text">
                                      <span className="permission-name-code">{p.name}</span>
                                      <span className="permission-name-desc">{p.description}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="role-modal-footer">
                  <button
                    type="button"
                    className="modal-btn-cancel"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="modal-btn-submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <div className="role-spinner" style={{ width: 16, height: 16, margin: 0, borderWidth: 2 }} />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>{editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: XEM CHI TIẾT QUYỀN HẠN CỦA VAI TRÒ
           ==================================================================== */}
        {isViewModalOpen && viewingRole && (
          <div className="role-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
            <div className="role-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="role-modal-header">
                <h3 className="role-modal-title">
                  <Key size={20} color="#8b5cf6" />
                  Danh sách quyền hạn của vai trò: <strong>{viewingRole.name}</strong>
                  {viewingRole.isSystem && (
                    <span className="badge-system" style={{ marginLeft: 8 }}>
                      <Lock size={12} /> Hệ thống
                    </span>
                  )}
                </h3>
                <button
                  className="role-modal-close-btn"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="role-modal-body">
                <div style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13.5, color: '#475569' }}>
                  <strong>Mô tả:</strong> {viewingRole.description || 'Chưa có mô tả'}
                  <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={14} /> Số người dùng đang gán: <strong>{viewingRole.userCount}</strong></span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Key size={14} /> Tổng số quyền được cấp: <strong>{viewingRole.permissionCount}</strong> quyền</span>
                  </div>
                </div>

                {viewingRole.permissions.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                    Vai trò này hiện chưa được gán bất kỳ quyền hạn nào
                  </div>
                ) : (
                  <div className="view-perm-grid">
                    {Object.entries(viewingRoleGroupedPerms)
                      .sort(([modA], [modB]) => {
                        const indexA = MODULE_ORDER.indexOf(modA);
                        const indexB = MODULE_ORDER.indexOf(modB);
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return modA.localeCompare(modB);
                      })
                      .map(([moduleName, perms]) => (
                      <div key={moduleName} className="view-perm-module-card">
                        <div className="view-perm-module-title">
                          {MODULE_LABELS[moduleName] || moduleName.toUpperCase()} ({perms.length})
                        </div>
                        <div className="view-perm-tags">
                          {perms.map((p) => (
                            <div key={p.id} className="view-perm-tag">
                              <span className="view-perm-tag-code">{p.name}</span>
                              <span className="view-perm-tag-desc">{p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="role-modal-footer">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RoleList;
