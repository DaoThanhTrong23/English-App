import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { fetchTopStudents } from '../../students/api/student.api';
import { getDashboardStats } from '../api/dashboard.api';
import { Trophy, Activity, Users as UsersIcon, BookOpen, BarChart2, RefreshCw, AlertCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';

const getAvatarUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [totalTests, setTotalTests] = useState<number>(0);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  
  const [trafficData, setTrafficData] = useState<any[]>([
    { name: 'T2', active: 0, new: 0 },
    { name: 'T3', active: 0, new: 0 },
    { name: 'T4', active: 0, new: 0 },
    { name: 'T5', active: 0, new: 0 },
    { name: 'T6', active: 0, new: 0 },
    { name: 'T7', active: 0, new: 0 },
    { name: 'CN', active: 0, new: 0 },
  ]);
  const [levelData, setLevelData] = useState<any[]>([
    { name: 'Sơ cấp (A1-A2)', value: 0 },
    { name: 'Trung cấp (B1-B2)', value: 0 },
    { name: 'Cao cấp (C1-C2)', value: 0 },
  ]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, topRes] = await Promise.all([
        getDashboardStats(),
        fetchTopStudents(5)
      ]);

      if (statsRes.data) {
        const stats = statsRes.data;
        setTotalStudents(stats.totalStudents || 0);
        setTotalCourses(stats.totalCourses || 0);
        setTotalWords(stats.totalWords || 0);
        setTotalTests(stats.totalTests || 0);
        if (stats.trafficData) setTrafficData(stats.trafficData);
        if (stats.levelData) setLevelData(stats.levelData);
      }

      if (topRes.data) {
        setTopStudents(topRes.data);
      }
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
      setError('Không thể kết nối đến máy chủ để lấy dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="dashboard-animated-wrapper">
        <div className="dashboard-main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 className="dashboard-title">Tổng quan hệ thống</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Thống kê hoạt động học tập và tương tác của toàn bộ nền tảng
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={fetchStats}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                Làm mới
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
              <button 
                onClick={fetchStats}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="bento-container">
            {/* HERO WELCOME */}
            <div className="bento-item bento-hero">
              <h2>Chào mừng trở lại</h2>
              <p>Hệ thống đang phục vụ và đồng bộ dữ liệu học tập liên tục cho học viên.</p>
              
              <div style={{ display: 'flex', gap: '40px', marginTop: 'auto' }}>
                <div>
                  <div style={{ color: '#93c5fd', fontSize: '0.85rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tổng học viên</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {loading ? '...' : totalStudents.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#93c5fd', fontSize: '0.85rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tổng bài kiểm tra</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {loading ? '...' : totalTests.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* PIE CHART */}
            <div className="bento-item bento-pie">
              <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>Phân bố trình độ CEFR</h3>
              <div style={{ width: '100%', height: '100%', minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={levelData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                      {levelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                    <Legend iconType="circle" layout="vertical" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="bento-item bento-stat">
              <div className="stat-icon-wrapper" style={{ background: '#eff6ff' }}>
                <UsersIcon size={20} color="#2563eb" />
              </div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.5rem', color: '#0f172a' }}>
                {loading ? '...' : totalStudents.toLocaleString()}
              </h3>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Học viên đăng ký</span>
            </div>
            <div className="bento-item bento-stat">
              <div className="stat-icon-wrapper" style={{ background: '#f3e8ff' }}>
                <BookOpen size={20} color="#7c3aed" />
              </div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.5rem', color: '#0f172a' }}>
                {loading ? '...' : totalCourses.toLocaleString()}
              </h3>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Bài học sẵn sàng</span>
            </div>
            <div className="bento-item bento-stat">
              <div className="stat-icon-wrapper" style={{ background: '#d1fae5' }}>
                <BarChart2 size={20} color="#059669" />
              </div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.5rem', color: '#0f172a' }}>
                {loading ? '...' : totalWords.toLocaleString()}
              </h3>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Từ vựng hệ thống</span>
            </div>
            <div className="bento-item bento-stat">
              <div className="stat-icon-wrapper" style={{ background: '#fef3c7' }}>
                <Activity size={20} color="#d97706" />
              </div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.5rem', color: '#0f172a' }}>
                {loading ? '...' : totalTests.toLocaleString()}
              </h3>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Đề kiểm tra thi</span>
            </div>

            {/* TRAFFIC AREA CHART */}
            <div className="bento-item bento-traffic">
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>Lưu lượng truy cập (7 ngày gần nhất)</h3>
              <div style={{ width: '100%', flex: 1, minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} itemStyle={{ fontWeight: 600 }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px' }}/>
                    <Area type="monotone" name="Đăng nhập hoạt động" dataKey="active" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                    <Area type="monotone" name="Đăng ký mới" dataKey="new" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LEADERBOARD */}
            <div className="bento-item bento-leaderboard">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>
                <Trophy size={18} color="#f59e0b" /> Vinh danh Top 5 học viên
              </h3>
              {topStudents.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{loading ? 'Đang tải danh sách...' : 'Chưa có dữ liệu'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                  {topStudents.map((student, index) => (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: index < topStudents.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0, background: index === 0 ? '#fef3c7' : index === 1 ? '#f1f5f9' : index === 2 ? '#ffedd5' : '#f8fafc', color: index === 0 ? '#f59e0b' : index === 1 ? '#64748b' : index === 2 ? '#ea580c' : '#94a3b8' }}>
                        {index + 1}
                      </div>
                      <img 
                        src={getAvatarUrl(student.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.username || 'Student')}&background=3b82f6&color=fff`}
                        alt={student.username || 'Student'}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.username || 'Student')}&background=3b82f6&color=fff`;
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.username || student.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.email}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '0.85rem', background: '#eff6ff', padding: '4px 10px', borderRadius: '16px', flexShrink: 0 }}>{student.xpPoints} XP</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
