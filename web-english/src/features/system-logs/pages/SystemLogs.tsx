import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { fetchActivities, fetchLoginLogs } from '../api/system-logs.api';
import { Activity, LogIn, Search, Filter, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../../../context/ToastContext';
import '../../courses/pages/CourseList.css';

const SystemLogs: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'activities' | 'login'>('activities');
  const [activities, setActivities] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');

  const loadData = async (currentPage: number) => {
    setLoading(true);
    try {
      if (activeTab === 'activities') {
        const res = await fetchActivities(currentPage, 20, search, actionType);
        if (res.data) {
          setActivities(res.data.items || []);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } else {
        const res = await fetchLoginLogs(currentPage, 20, search);
        if (res.data) {
          setLoginLogs(res.data.items || []);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(page);
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, page, actionType, search]);

  const handleSearch = () => {
    setPage(1);
    loadData(1);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const isAct = activeTab === 'activities';
    try {
      toast.info('Đang tổng hợp toàn bộ dữ liệu nhật ký để xuất Excel...');
      let items: any[] = [];
      if (isAct) {
        const res = await fetchActivities(1, 5000, search, actionType);
        items = res.data?.items || [];
      } else {
        const res = await fetchLoginLogs(1, 5000, search);
        items = res.data?.items || [];
      }

      if (items.length === 0) {
        toast.info('Không có dữ liệu phù hợp để xuất!');
        return;
      }

      const dataToExport = isAct ? items.map((item, idx) => ({
        STT: idx + 1,
        'Thời gian': new Date(item.createdAt).toLocaleString('vi-VN'),
        'Người dùng': item.user?.username || 'Hệ thống',
        'Email': item.user?.email || '-',
        'Hành động': item.actionType || item.action || '-',
        'Chi tiết': item.description || item.details || '-',
        'Địa chỉ IP': item.ipAddress || '-'
      })) : items.map((item, idx) => ({
        STT: idx + 1,
        'Thời gian đăng nhập': new Date(item.loginTime).toLocaleString('vi-VN'),
        'Người dùng': item.user?.username || '-',
        'Email': item.user?.email || '-',
        'Thiết bị': item.deviceInfo || '-',
        'Địa chỉ IP': item.ipAddress || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isAct ? 'Hoat_dong' : 'Dang_nhap');
      XLSX.writeFile(wb, `${isAct ? 'nhat_ky_hoat_dong' : 'nhat_ky_dang_nhap'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Đã xuất thành công ${items.length} bản ghi sang file Excel!`);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      toast.error('Có lỗi xảy ra khi tạo file Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main">
          <div className="course-list-header">
            <h2>Nhật ký hệ thống</h2>
            <button 
              className="add-course-btn" 
              onClick={handleExportExcel}
              disabled={isExporting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isExporting ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'activities' ? '2px solid #3b82f6' : 'none', color: activeTab === 'activities' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => { setActiveTab('activities'); setPage(1); setSearch(''); setActionType(''); }}
            >
              <Activity size={16} style={{ display: 'inline', marginRight: '8px' }}/> Hoạt động
            </button>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'login' ? '2px solid #3b82f6' : 'none', color: activeTab === 'login' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => { setActiveTab('login'); setPage(1); setSearch(''); setActionType(''); }}
            >
              <LogIn size={16} style={{ display: 'inline', marginRight: '8px' }}/> Đăng nhập
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '250px' }}>
              <Search size={18} color="#94a3b8" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                placeholder={activeTab === 'activities' ? 'Tìm theo email, username, chi tiết...' : 'Tìm theo email, username, IP...'} 
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: '#1e293b' }}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            {activeTab === 'activities' && (
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Filter size={18} color="#94a3b8" style={{ marginRight: '8px' }} />
                <select 
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: '#1e293b' }}
                  value={actionType}
                  onChange={(e) => { setActionType(e.target.value); setPage(1); }}
                >
                  <option value="">Tất cả hành động</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="REGISTER">REGISTER</option>
                  <option value="UPDATE_PROFILE">UPDATE_PROFILE</option>
                  <option value="CHANGE_PASSWORD">CHANGE_PASSWORD</option>
                  <option value="STUDY">STUDY</option>
                  <option value="TEST">TEST</option>
                </select>
              </div>
            )}
            
            <button 
              onClick={handleSearch}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Tìm kiếm
            </button>
          </div>

          <div className="course-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
            ) : (
              <table className="course-table">
                <thead>
                  {activeTab === 'activities' ? (
                    <tr>
                      <th>Thời gian</th>
                      <th>Người dùng</th>
                      <th>Hành động</th>
                      <th>Chi tiết</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Thời gian</th>
                      <th>Người dùng</th>
                      <th>Địa chỉ IP</th>
                      <th>Thiết bị</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === 'activities' ? (
                    activities.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                        <td>{item.user ? `${item.user.username} (${item.user.email})` : 'Hệ thống'}</td>
                        <td><strong>{item.actionType}</strong></td>
                        <td>{item.description}</td>
                      </tr>
                    ))
                  ) : (
                    loginLogs.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.loginTime).toLocaleString('vi-VN')}</td>
                        <td>{item.user ? `${item.user.username} (${item.user.email})` : 'Không xác định'}</td>
                        <td>{item.ipAddress || '-'}</td>
                        <td>{item.deviceInfo || '-'}</td>
                      </tr>
                    ))
                  )}
                  {((activeTab === 'activities' && activities.length === 0) || (activeTab === 'login' && loginLogs.length === 0)) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Trước</button>
              <span style={{ padding: '8px' }}>Trang {page} / {totalPages || 1}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Sau</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemLogs;
