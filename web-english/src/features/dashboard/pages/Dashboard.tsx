import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { fetchTopStudents } from '../../students/api/student.api';
import { getDashboardStats } from '../api/dashboard.api';
import { Trophy, Activity, Users as UsersIcon, BookOpen, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const Dashboard: React.FC = () => {
  const [totalStudents, setTotalStudents] = useState<number | string>('...');
  const [totalWords, setTotalWord] = useState<number | string>('...');
  const [totalCourses, setTotalCourses] = useState<number | string>('...');
  const [totalTests, setTotalTests] = useState<number | string>('...');
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await getDashboardStats();
        if (statsRes.data) {
          const stats = statsRes.data;
          setTotalStudents(stats.totalStudents);
          setTotalCourses(stats.totalCourses);
          setTotalWord(stats.totalWords);
          setTotalTests(stats.totalTests);
          setTrafficData(stats.trafficData);
          setLevelData(stats.levelData);
        }

        const topRes = await fetchTopStudents(5);
        if (topRes.data) setTopStudents(topRes.data);
      } catch (error) {
        setTotalStudents('Lỗi');
        setTotalWord('Lỗi');
        setTotalCourses('Lỗi');
        setTotalTests('Lỗi');
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="dashboard-animated-wrapper">
        <div className="dashboard-main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="dashboard-title" style={{ margin: 0 }}>Tổng quan Hệ thống</h2>
            <div style={{ padding: '8px 16px', background: 'white', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="dashboard-grid">
            <div className="dashboard-card" style={{ borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                <span className="dashboard-card-title" style={{ margin: 0 }}>Học viên</span>
                <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px' }}>
                  <UsersIcon size={20} color="#3b82f6" />
                </div>
              </div>
              <h3 className="dashboard-card-value">{totalStudents}</h3>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>+12% so với tháng trước</div>
            </div>
            
            <div className="dashboard-card" style={{ borderLeft: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                <span className="dashboard-card-title" style={{ margin: 0 }}>Bài học</span>
                <div style={{ padding: '8px', background: '#f3e8ff', borderRadius: '8px' }}>
                  <BookOpen size={20} color="#8b5cf6" />
                </div>
              </div>
              <h3 className="dashboard-card-value">{totalCourses}</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Đang hoạt động tốt</div>
            </div>
            
            <div className="dashboard-card" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                <span className="dashboard-card-title" style={{ margin: 0 }}>Từ vựng</span>
                <div style={{ padding: '8px', background: '#d1fae5', borderRadius: '8px' }}>
                  <BarChart2 size={20} color="#10b981" />
                </div>
              </div>
              <h3 className="dashboard-card-value">{totalWords}</h3>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>+50 từ mới tuần này</div>
            </div>
            
            <div className="dashboard-card" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                <span className="dashboard-card-title" style={{ margin: 0 }}>Bài kiểm tra</span>
                <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '8px' }}>
                  <Activity size={20} color="#f59e0b" />
                </div>
              </div>
              <h3 className="dashboard-card-value">{totalTests}</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Tổng số đề thi</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '32px' }}>
            
            {/* Main Chart */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', flex: '2 1 400px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '1.1rem' }}>Lưu lượng truy cập (7 ngày)</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    <Area type="monotone" name="User Online" dataKey="active" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                    <Area type="monotone" name="Đăng ký mới" dataKey="new" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart & Leaderboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 300px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0', color: '#1e293b', fontSize: '1.1rem' }}>Phân bố trình độ</h3>
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={levelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {levelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      />
                      <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', flex: 1 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>
                  <Trophy size={18} color="#f59e0b" /> Vinh danh Top 5
                </h3>
                {topStudents.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Chưa có dữ liệu</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topStudents.map((student, index) => (
                      <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: index === 0 ? '#fffbeb' : '#f8fafc', borderRadius: '8px', border: index === 0 ? '1px solid #fde68a' : '1px solid transparent' }}>
                        <div style={{ 
                          width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontWeight: 'bold', fontSize: '0.85rem',
                          background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#e2e8f0',
                          color: index < 3 ? 'white' : '#64748b'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.username || student.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.email}</div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '0.9rem' }}>{student.xpPoints} XP</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
