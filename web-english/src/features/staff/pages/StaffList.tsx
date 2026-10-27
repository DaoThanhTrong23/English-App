import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Key,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Shield,
  HelpCircle,
} from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { useToast } from '../../../context/ToastContext';
import {
  fetchStaffList,
  fetchStaffDetail,
  createStaff,
  updateStaff,
  deleteStaff,
  promoteToAdmin,
  searchCandidateUsers,
  promoteUserToStaff,
  type StaffItem,
  type StaffDetailItem,
  type CandidateUser,
} from '../api/staff.api';
import { fetchRoles, type RoleItem } from '../../roles/api/role.api';
import './StaffList.css';

const StaffList: React.FC = () => {
  const { toast, confirmModal } = useToast();

  // Current logged in admin info
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(false);

  // Data states
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalStaff, setTotalStaff] = useState<number>(0);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPromoteUserModalOpen, setIsPromoteUserModalOpen] = useState<boolean>(false);
  const [isViewPermsModalOpen, setIsViewPermsModalOpen] = useState<boolean>(false);

  // Selected items for modal
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [viewingDetail, setViewingDetail] = useState<StaffDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Form states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    roleId: 1, // Default to admin or first role
    job: '',
  });

  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
    roleId: 1,
    job: '',
    isLocked: false,
  });

  // Promote Candidate User modal states
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateUser | null>(null);
  const [candidateRoleId, setCandidateRoleId] = useState<number>(1);

  // Load current admin ID & Role
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adminInfo');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          setCurrentAdminId(Number(parsed.id));
        }
        const roleName = parsed?.role?.name || parsed?.role;
        if (roleName) {
          setIsCurrentUserAdmin(String(roleName).toLowerCase() === 'admin');
        }
      }
    } catch (e) {
      console.error('Lỗi lấy adminInfo từ localStorage:', e);
    }
  }, []);

  // Xác định người đang thao tác có phải là Admin thực sự hay không
  const isCallerAdmin = useMemo(() => {
    if (currentAdminId) {
      const currentStaff = staffList.find((s) => s.id === currentAdminId);
      if (currentStaff) return currentStaff.isAdmin;
    }
    return isCurrentUserAdmin;
  }, [currentAdminId, staffList, isCurrentUserAdmin]);

  // Load Roles for dropdown selection
  const loadRoles = async () => {
    try {
      const res = await fetchRoles();
      if (res?.data) {
        // Lọc bỏ vai trò 'user' thông thường
        const adminAndStaffRoles = res.data.filter((r) => r.name.toLowerCase() !== 'user');
        setRoles(adminAndStaffRoles);
        if (adminAndStaffRoles.length > 0 && createForm.roleId === 1) {
          // ensure default role
          const adminRole = adminAndStaffRoles.find((r) => r.name.toLowerCase() === 'admin');
          if (adminRole) {
            setCreateForm((prev) => ({ ...prev, roleId: adminRole.id }));
            setCandidateRoleId(adminRole.id);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách vai trò:', err);
    }
  };

  // Load Staff List
  const loadStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const roleIdParam = selectedRoleFilter !== 'all' ? Number(selectedRoleFilter) : undefined;
      const isLockedParam =
        selectedStatusFilter === 'locked'
          ? true
          : selectedStatusFilter === 'active'
          ? false
          : undefined;

      const res = await fetchStaffList({
        page,
        limit: 10,
        search: searchTerm.trim() || undefined,
        roleId: roleIdParam,
        isLocked: isLockedParam,
      });

      if (res?.data) {
        setStaffList(res.data.staff);
        setTotalStaff(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedRoleFilter, selectedStatusFilter]);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  // Debounced search candidates
  useEffect(() => {
    if (!isPromoteUserModalOpen || candidateSearch.trim().length < 2) {
      setCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCandidates(true);
      try {
        const res = await searchCandidateUsers(candidateSearch.trim());
        if (res?.data) {
          setCandidates(res.data);
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm học viên:', err);
      } finally {
        setSearchingCandidates(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [candidateSearch, isPromoteUserModalOpen]);

  // Statistics counters
  const totalAdmins = useMemo(() => staffList.filter((s) => s.isAdmin).length, [staffList]);
  const totalCustomStaff = useMemo(() => staffList.filter((s) => !s.isAdmin).length, [staffList]);
  const totalLocked = useMemo(() => staffList.filter((s) => s.isLocked).length, [staffList]);

  // Handle open Create Modal
  const handleOpenCreateModal = () => {
    const adminRole = roles.find((r) => r.name.toLowerCase() === 'admin');
    const firstCustomRole = roles.find((r) => r.name.toLowerCase() !== 'admin');
    const defaultRoleId = isCallerAdmin
      ? (adminRole ? adminRole.id : roles[0]?.id || 1)
      : (firstCustomRole ? firstCustomRole.id : roles[0]?.id || 1);

    setCreateForm({
      username: '',
      email: '',
      password: '',
      roleId: defaultRoleId,
      job: '',
    });
    setIsCreateModalOpen(true);
  };
  const isStrongPassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{9,}$/.test(password);
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // Handle submit Create Staff
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.info('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (!isValidEmail(createForm.email)) {
      toast.error('Địa chỉ email không đúng định dạng (VD: example@domain.com)');
      return;
    }

    if(!isStrongPassword(createForm.password))
    {
      toast.error('Mật khẩu phải có ít nhất 9 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }


    setSubmitting(true);
    try {
      await createStaff({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password.trim(),
        roleId: Number(createForm.roleId),
        job: createForm.job.trim() || undefined,
      });

      toast.success(`Tạo tài khoản nhân viên '${createForm.username}' thành công!`);
      setIsCreateModalOpen(false);
      loadStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (staff: StaffItem) => {
    // LUẬT: Admin không thể đụng thông tin của Admin khác!
    if (staff.isAdmin && staff.id !== currentAdminId) {
      toast.info('Bạn không có quyền chỉnh sửa thông tin của Quản trị viên khác!');
      return;
    }

    setEditingStaff(staff);
    setEditForm({
      username: staff.username,
      email: staff.email,
      password: '',
      roleId: staff.roleId,
      job: staff.job || '',
      isLocked: staff.isLocked,
    });
    setIsEditModalOpen(true);
  };

  // Handle submit Edit Staff
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setSubmitting(true);
    try {
      await updateStaff(editingStaff.id, {
        username: editForm.username.trim() || undefined,
        email: editForm.email.trim() || undefined,
        password: editForm.password.trim() || undefined,
        roleId: Number(editForm.roleId),
        job: editForm.job.trim(),
        isLocked: editForm.isLocked,
      });

      toast.success(`Cập nhật thông tin nhân viên '${editForm.username}' thành công!`);
      setIsEditModalOpen(false);
      loadStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật tài khoản nhân viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Promote to Admin
  const handleQuickPromoteToAdmin = (staff: StaffItem) => {
    if (staff.isAdmin) {
      toast.info(`Tài khoản '${staff.username}' hiện tại đã là Quản trị viên!`);
      return;
    }

    confirmModal({
      title: 'Nâng cấp lên Quản trị viên (Admin)',
      message: `Bạn có chắc chắn muốn nâng cấp tài khoản "${staff.username}" (${staff.email}) lên Quản trị viên cao nhất của hệ thống? Sau khi nâng cấp, tài khoản này sẽ có toàn quyền như một Admin.`,
      confirmText: 'Xác nhận nâng cấp',
      onConfirm: async () => {
        try {
          const res = await promoteToAdmin(staff.id);
          toast.success(res.message || `Đã nâng cấp '${staff.username}' lên Admin thành công!`);
          loadStaffData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi nâng cấp tài khoản lên Admin');
        }
      },
    });
  };

  // Handle Delete Staff
  const handleDeleteStaff = (staff: StaffItem) => {
    if (staff.isAdmin) {
      toast.error('Không được phép xóa tài khoản của Quản trị viên!');
      return;
    }

    if (staff.id === currentAdminId) {
      toast.error('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }

    confirmModal({
      title: 'Xóa tài khoản nhân viên',
      message: `Bạn có chắc chắn muốn xóa tài khoản nhân viên "${staff.username}"? Hành động này sẽ xóa vĩnh viễn quyền truy cập và dữ liệu phiên làm việc của nhân viên này.`,
      confirmText: 'Xóa nhân viên',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteStaff(staff.id);
          toast.success(`Đã xóa tài khoản nhân viên '${staff.username}' thành công!`);
          loadStaffData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi xóa nhân viên');
        }
      },
    });
  };

  // Handle open View Permissions Modal
  const handleOpenViewPerms = async (staff: StaffItem) => {
    setLoadingDetail(true);
    setIsViewPermsModalOpen(true);
    try {
      const res = await fetchStaffDetail(staff.id);
      if (res?.data) {
        setViewingDetail(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lấy thông tin chi tiết quyền hạn');
      setIsViewPermsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Group permissions of viewing detail by module
  const groupedViewingPerms = useMemo(() => {
    if (!viewingDetail?.role?.permissions) return {};
    const grouped: Record<string, typeof viewingDetail.role.permissions> = {};
    for (const p of viewingDetail.role.permissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  }, [viewingDetail]);

  // Handle submit Promote User from Student
  const handleSubmitPromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) {
      toast.info('Vui lòng chọn một học viên để nâng cấp');
      return;
    }

    setSubmitting(true);
    try {
      await promoteUserToStaff({
        userId: selectedCandidate.id,
        roleId: Number(candidateRoleId),
      });

      toast.success(
        `Đã nâng cấp học viên '${selectedCandidate.username}' lên nhân viên thành công!`
      );
      setIsPromoteUserModalOpen(false);
      setSelectedCandidate(null);
      setCandidateSearch('');
      loadStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi nâng cấp học viên');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="staff-page">
        {/* Header */}
        <div className="staff-header">
          <div>
            <h1 className="staff-header-title">
              {/* <UserCheck size={28} color="#2563eb" /> */}
              Quản lý nhân viên & phân quyền
            </h1>
            <p className="staff-header-desc">
              Quản lý danh sách nhân viên, gán vai trò quyền hạn, tạo mới và nâng cấp tài khoản lên quản trị viên.
            </p>
          </div>

          <div className="staff-header-actions">
            <button
              className="staff-btn-secondary"
              onClick={() => {
                setSelectedCandidate(null);
                setCandidateSearch('');
                setIsPromoteUserModalOpen(true);
              }}
            >
              <UserPlus size={18} />
              <span>Nâng cấp từ học viên</span>
            </button>

            <button className="staff-btn-primary" onClick={handleOpenCreateModal}>
              <Plus size={18} />
              <span>Thêm nhân viên mới</span>
            </button>
          </div>
        </div>

        {/* Security Rule Banner */}
        <div className="staff-rule-banner">
          {/* <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: 2, color: '#2563eb' }} /> */}
          <div>
            <strong>Quy tắc bảo mật hệ thống:</strong> Quản trị viên này không thể can thiệp thông tin của quản trị viên khác. <strong>Chỉ có Quản trị viên mới có quyền tạo mới hoặc nâng cấp tài khoản lên quản trị viên</strong> các nhân viên khác dù có quyền quản lý nhân sự cũng không thể tự ý nâng cấp tài khoản lên admin.
          </div>

        </div>

        {/* Stats Grid */}
        <div className="staff-stats-grid">
          <div className="staff-stat-card">
            <div className="staff-stat-icon blue">
              <Users size={24} />
            </div>
            <div>
              <div className="staff-stat-label">Tổng số nhân viên</div>
              <div className="staff-stat-value">{totalStaff}</div>
            </div>
          </div>

          <div className="staff-stat-card">
            <div className="staff-stat-icon purple">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="staff-stat-label">Quản trị viên (Admin)</div>
              <div className="staff-stat-value">{totalAdmins}</div>
            </div>
          </div>

          <div className="staff-stat-card">
            <div className="staff-stat-icon emerald">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="staff-stat-label">Nhân viên vai trò chuyên trách</div>
              <div className="staff-stat-value">{totalCustomStaff}</div>
            </div>
          </div>

          <div className="staff-stat-card">
            <div className="staff-stat-icon amber">
              <Lock size={24} />
            </div>
            <div>
              <div className="staff-stat-label">Tài khoản bị khóa</div>
              <div className="staff-stat-value">{totalLocked}</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="staff-toolbar">
          <div className="staff-search-box">
            <Search size={18} className="staff-search-icon" />
            <input
              type="text"
              className="staff-search-input"
              placeholder="Tìm kiếm nhân viên theo tên, email, vị trí..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="staff-filters">
            <select
              className="staff-select"
              value={selectedRoleFilter}
              onChange={(e) => {
                setSelectedRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name.toUpperCase()} ({r.name === 'admin' ? 'Quản trị viên' : r.name})
                </option>
              ))}
            </select>

            <select
              className="staff-select"
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="staff-table-card">
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  {/* <th>Vị trí / Chức vụ</th> */}
                  <th>Vai trò (Role)</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div className="role-spinner" style={{ margin: '0 auto 12px' }} />
                      <div style={{ color: '#64748b' }}>Đang tải danh sách nhân viên...</div>
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="staff-empty">
                        <Users size={40} color="#cbd5e1" />
                        <div className="staff-empty-title">Không tìm thấy nhân viên nào</div>
                        <p style={{ margin: 0, fontSize: 13 }}>
                          Hãy thử tìm kiếm với từ khóa khác hoặc nhấn "Thêm nhân viên mới".
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => {
                    const isOtherAdmin = staff.isAdmin && staff.id !== currentAdminId;
                    const isSelf = staff.id === currentAdminId;

                    return (
                      <tr key={staff.id}>
                        {/* User Cell */}
                        <td>
                          <div className="staff-user-cell">
                            <div className={`staff-avatar ${staff.isAdmin ? 'admin' : ''}`}>
                              {staff.avatarUrl ? (
                                <img src={staff.avatarUrl} alt={staff.username} />
                              ) : (
                                staff.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="staff-user-details">
                              <div className="staff-user-name">
                                <span>{staff.username}</span>
                                {isSelf && <span className="badge-self">Chính bạn</span>}
                              </div>
                              <span className="staff-user-email">{staff.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Job / Position */}
                        {/* <td>
                          {staff.job ? (
                            <span style={{ color: '#334155', fontWeight: 500 }}>{staff.job}</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              Chưa thiết lập
                            </span>
                          )}
                        </td> */}

                        {/* Role Badge */}
                        <td>
                          <span className={`role-badge ${staff.isAdmin ? 'admin' : 'custom'}`}>
                            <ShieldCheck size={14} />
                            {staff.role.name.toUpperCase()}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          {staff.isLocked ? (
                            <span className="status-badge locked">
                              <Lock size={12} /> Đã khóa
                            </span>
                          ) : (
                            <span className="status-badge active">
                              <CheckCircle2 size={12} /> Hoạt động
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td style={{ color: '#64748b', fontSize: 13 }}>
                          {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="staff-actions" style={{ justifyContent: 'flex-end' }}>
                            {/* Nút Nâng cấp lên Admin (CHỈ hiển thị nếu người đăng nhập là Admin VÀ nhân viên này chưa phải admin) */}
                            {isCallerAdmin && !staff.isAdmin && (
                              <button
                                className="action-btn promote"
                                onClick={() => handleQuickPromoteToAdmin(staff)}
                                title="Nâng cấp tài khoản này lên Quản trị viên (Admin)"
                              >
                                <ShieldCheck size={14} />
                                <span>Lên Admin</span>
                              </button>
                            )}

                            {/* Nút Chỉnh sửa / Gán quyền */}
                            <button
                              className="action-btn edit"
                              onClick={() => handleOpenEditModal(staff)}
                              disabled={isOtherAdmin}
                              title={
                                isOtherAdmin
                                  ? 'Không thể can thiệp thông tin của Quản trị viên khác'
                                  : 'Chỉnh sửa thông tin / Gán vai trò'
                              }
                            >
                              {isOtherAdmin ? <Lock size={14} /> : <Edit size={14} />}
                              <span>Sửa</span>
                            </button>

                            {/* Nút Xóa nhân viên */}
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteStaff(staff)}
                              disabled={staff.isAdmin || isSelf}
                              title={
                                staff.isAdmin
                                  ? 'Không thể xóa tài khoản Quản trị viên'
                                  : isSelf
                                  ? 'Không thể tự xóa chính mình'
                                  : 'Xóa tài khoản nhân viên'
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="staff-pagination">
              <div>
                Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng{' '}
                <strong>{totalStaff}</strong> nhân viên)
              </div>
              <div className="staff-page-btns">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            MODAL 1: TẠO MỚI NHÂN VIÊN / ADMIN
           ==================================================================== */}
        {isCreateModalOpen && (
          <div className="staff-modal-overlay" onClick={() => !submitting && setIsCreateModalOpen(false)}>
            <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h3 className="staff-modal-title">
                  <UserPlus size={20} color="#2563eb" />
                  <span>Tạo tài khoản nhân viên/quản trị viên mới</span>
                </h3>
                <button
                  className="staff-modal-close"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate}>
                <div className="staff-modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Tên đăng nhập <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: staff_marketing, editor_hung..."
                      value={createForm.username}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, username: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Địa chỉ Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="VD: staff@example.com"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Mật khẩu khởi tạo <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Tối thiểu 6 ký tự"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Vai trò được gán (Role) <span className="required">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={createForm.roleId}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, roleId: Number(e.target.value) })
                      }
                    >
                      {roles.map((r) => {
                        const isAdminRole = r.name.toLowerCase() === 'admin';
                        const disabled = !isCallerAdmin && isAdminRole;
                        return (
                          <option key={r.id} value={r.id} disabled={disabled}>
                            {r.name.toUpperCase()}{' '}
                            {isAdminRole
                              ? '(Quản trị viên toàn quyền)'
                              : `- ${r.description || 'Vai trò tùy chỉnh'}`}
                            {disabled ? ' [Chỉ Admin được chọn]' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {roles.find((r) => r.id === createForm.roleId)?.name === 'admin' ? (
                      <div className="role-select-card admin-highlight">
                        <ShieldCheck size={20} />
                        <div>
                          <strong>Đặc quyền Admin:</strong> Tài khoản này sẽ được cấp toàn bộ quyền hạn quản trị cao nhất của hệ thống.
                        </div>
                      </div>
                    ) : (
                      <div className="role-select-card">
                        <ShieldCheck size={20} color="#2563eb" />
                        <div>
                          Nhân viên sẽ được thừa hưởng các quyền hạn tương ứng được cấu hình trong vai trò này.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vị trí / Chức danh công việc</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: Quản lý nội dung, Giảng viên IELTS, Hỗ trợ viên..."
                      value={createForm.job}
                      onChange={(e) => setCreateForm({ ...createForm, job: e.target.value })}
                    />
                  </div>
                </div>

                <div className="staff-modal-footer">
                  <button
                    type="button"
                    className="staff-btn-secondary"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="staff-btn-primary" disabled={submitting}>
                    {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL 2: CHỈNH SỬA NHÂN VIÊN & GÁN VAI TRÒ
           ==================================================================== */}
        {isEditModalOpen && editingStaff && (
          <div className="staff-modal-overlay" onClick={() => !submitting && setIsEditModalOpen(false)}>
            <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h3 className="staff-modal-title">
                  <Edit size={20} color="#2563eb" />
                  <span>Chỉnh sửa nhân viên: {editingStaff.username}</span>
                </h3>
                <button
                  className="staff-modal-close"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit}>
                <div className="staff-modal-body">
                  <div className="form-group">
                    <label className="form-label">Tên đăng nhập</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Địa chỉ Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Gán vai trò mới (Phân quyền / Nâng cấp Admin)
                    </label>
                    <select
                      className="form-input"
                      value={editForm.roleId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, roleId: Number(e.target.value) })
                      }
                      disabled={editingStaff.isAdmin && editingStaff.id === currentAdminId}
                    >
                      {roles.map((r) => {
                        const isAdminRole = r.name.toLowerCase() === 'admin';
                        const isEditingSelf = editingStaff.id === currentAdminId;
                        const disabled =
                          (!isCallerAdmin && isAdminRole) ||
                          (editingStaff.isAdmin && isEditingSelf && !isAdminRole);
                        return (
                          <option key={r.id} value={r.id} disabled={disabled}>
                            {r.name.toUpperCase()}{' '}
                            {isAdminRole
                              ? '(Quản trị viên toàn quyền)'
                              : `- ${r.description || ''}`}
                            {!isCallerAdmin && isAdminRole ? ' [Chỉ Admin được nâng cấp]' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {roles.find((r) => r.id === editForm.roleId)?.name === 'admin' && (
                      <div className="role-select-card admin-highlight">
                        <ShieldCheck size={20} />
                        <div>
                          <strong>Nâng cấp lên Quản trị viên:</strong> Tài khoản này sẽ có quyền truy cập toàn bộ hệ thống.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vị trí / Chức danh công việc</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: Quản lý nội dung..."
                      value={editForm.job}
                      onChange={(e) => setEditForm({ ...editForm, job: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Đặt lại mật khẩu mới (Nếu cần)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Để trống nếu không muốn thay đổi mật khẩu"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    />
                    <div className="form-help">Nhập tối thiểu 8 ký tự để đổi mật khẩu</div>
                  </div>

                  {editingStaff.id !== currentAdminId && (
                    <div className="form-group" style={{ marginTop: 20 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editForm.isLocked}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isLocked: e.target.checked })
                          }
                          style={{ width: 18, height: 18 }}
                        />
                        <span style={{ fontWeight: 600, color: editForm.isLocked ? '#dc2626' : '#334155' }}>
                          Khóa tài khoản nhân viên này (Ngăn không cho đăng nhập)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="staff-modal-footer">
                  <button
                    type="button"
                    className="staff-btn-secondary"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="staff-btn-primary" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL 3: NÂNG CẤP HỌC VIÊN LÊN NHÂN VIÊN / ADMIN
           ==================================================================== */}
        {isPromoteUserModalOpen && (
          <div
            className="staff-modal-overlay"
            onClick={() => !submitting && setIsPromoteUserModalOpen(false)}
          >
            <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h3 className="staff-modal-title">
                  <UserPlus size={20} color="#2563eb" />
                  <span>Nâng cấp tài khoản học viên lên Nhân viên / Admin</span>
                </h3>
                <button
                  className="staff-modal-close"
                  onClick={() => setIsPromoteUserModalOpen(false)}
                  disabled={submitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitPromoteUser}>
                <div className="staff-modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Tìm kiếm học viên cần nâng cấp <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập tên đăng nhập hoặc email học viên..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                    />
                    <div className="form-help">Nhập ít nhất 2 ký tự để tìm kiếm trong danh sách học viên</div>
                  </div>

                  {searchingCandidates && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#64748b' }}>
                      Đang tìm kiếm học viên...
                    </div>
                  )}

                  {!searchingCandidates && candidateSearch.trim().length >= 2 && candidates.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8' }}>
                      Không tìm thấy học viên nào phù hợp
                    </div>
                  )}

                  {candidates.length > 0 && (
                    <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                      {candidates.map((cand) => {
                        const isSelected = selectedCandidate?.id === cand.id;
                        return (
                          <div
                            key={cand.id}
                            className={`candidate-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedCandidate(cand)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                className="staff-avatar"
                                style={{ width: 34, height: 34, fontSize: 13 }}
                              >
                                {cand.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.username}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{cand.email}</div>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 size={18} color="#2563eb" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedCandidate && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '10px 14px',
                        marginBottom: 16,
                        fontSize: 13,
                        color: '#166534',
                      }}
                    >
                      Đã chọn: <strong>{selectedCandidate.username}</strong> ({selectedCandidate.email})
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      Chọn vai trò muốn thăng cấp <span className="required">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={candidateRoleId}
                      onChange={(e) => setCandidateRoleId(Number(e.target.value))}
                    >
                      {roles.map((r) => {
                        const isAdminRole = r.name.toLowerCase() === 'admin';
                        const disabled = !isCallerAdmin && isAdminRole;
                        return (
                          <option key={r.id} value={r.id} disabled={disabled}>
                            {r.name.toUpperCase()}{' '}
                            {isAdminRole
                              ? '(Quản trị viên toàn quyền)'
                              : `- ${r.description || ''}`}
                            {disabled ? ' [Chỉ Admin được chọn]' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {roles.find((r) => r.id === candidateRoleId)?.name === 'admin' && (
                      <div className="role-select-card admin-highlight">
                        <ShieldCheck size={20} />
                        <div>
                          Học viên này sẽ được nâng cấp thành <strong>Quản trị viên (Admin)</strong> với toàn quyền trên hệ thống.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="staff-modal-footer">
                  <button
                    type="button"
                    className="staff-btn-secondary"
                    onClick={() => setIsPromoteUserModalOpen(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="staff-btn-primary"
                    disabled={submitting || !selectedCandidate}
                  >
                    {submitting ? 'Đang nâng cấp...' : 'Xác nhận nâng cấp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL 4: XEM CHI TIẾT QUYỀN HẠN CỦA NHÂN VIÊN
           ==================================================================== */}
        {isViewPermsModalOpen && (
          <div className="staff-modal-overlay" onClick={() => setIsViewPermsModalOpen(false)}>
            <div className="staff-modal large" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h3 className="staff-modal-title">
                  <Key size={20} color="#2563eb" />
                  <span>
                    Chi tiết quyền hạn:{' '}
                    <strong>{viewingDetail ? viewingDetail.username : '...'}</strong>
                  </span>
                </h3>
                <button
                  className="staff-modal-close"
                  onClick={() => setIsViewPermsModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="staff-modal-body">
                {loadingDetail ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="role-spinner" style={{ margin: '0 auto 12px' }} />
                    <div style={{ color: '#64748b' }}>Đang tải danh sách quyền hạn...</div>
                  </div>
                ) : viewingDetail ? (
                  <>
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: 14,
                        borderRadius: 8,
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div>
                          <strong>Vai trò hiện tại:</strong>{' '}
                          <span className={`role-badge ${viewingDetail.isAdmin ? 'admin' : 'custom'}`}>
                            {viewingDetail.role.name.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                          {viewingDetail.role.description || 'Chưa có mô tả vai trò'}
                        </div>
                      </div>

                      <div style={{ fontSize: 13.5, color: '#334155' }}>
                        Tổng số quyền sở hữu:{' '}
                        <strong>{viewingDetail.role.permissions?.length || 0}</strong> quyền
                      </div>
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                      {Object.keys(groupedViewingPerms).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
                          Vai trò này chưa được gán quyền hạn nào
                        </div>
                      ) : (
                        Object.entries(groupedViewingPerms).map(([mod, perms]) => (
                          <div key={mod} className="perm-module-section">
                            <div className="perm-module-title">
                              TÀI NGUYÊN: {mod.toUpperCase()} ({perms.length} quyền)
                            </div>
                            <div className="perm-tags-list">
                              {perms.map((p) => (
                                <div key={p.id} className="perm-tag-item" title={p.description || ''}>
                                  <strong>{p.name}</strong>
                                  {p.description && (
                                    <span style={{ color: '#64748b', marginLeft: 4 }}>
                                      ({p.description})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  className="staff-btn-secondary"
                  onClick={() => setIsViewPermsModalOpen(false)}
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

export default StaffList;
