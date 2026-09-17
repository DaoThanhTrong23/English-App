import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { fetchActivities, fetchLoginLogs } from '../api/system-logs.api';
import { Activity, LogIn } from 'lucide-react';
import '../../courses/pages/CourseList.css';

const SystemLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activities' | 'login'>('activities');
  const [activities, setActivities] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async (currentPage: number) => {
    setLoading(true);
    try {
      if (activeTab === 'activities') {
        const res = await fetchActivities(currentPage, 20);
        if (res.data) {
          setActivities(res.data.items);
          setTotalPages(res.data.pagination.totalPages);
        }
      } else {
        const res = await fetchLoginLogs(currentPage, 20);
        if (res.data) {
          setLoginLogs(res.data.items);
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
  }, [activeTab, page]);

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main">
          <div className="course-list-header">
            <h2>Nhật ký Hệ thống</h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'activities' ? '2px solid #3b82f6' : 'none', color: activeTab === 'activities' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => { setActiveTab('activities'); setPage(1); }}
            >
              <Activity size={16} style={{ display: 'inline', marginRight: '8px' }}/> Hoạt động
            </button>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'login' ? '2px solid #3b82f6' : 'none', color: activeTab === 'login' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => { setActiveTab('login'); setPage(1); }}
            >
              <LogIn size={16} style={{ display: 'inline', marginRight: '8px' }}/> Đăng nhập
            </button>
          </div>

          <div className="course-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
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
                      <th>IP</th>
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
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc' }}>Trước</button>
              <span style={{ padding: '8px' }}>Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc' }}>Sau</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemLogs;
