import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { getTotalStudents, fetchTopStudents } from '../../students/api/student.api';
import { getTotalWord } from '../../words/api/words.api';
import { getTotalCourse } from '../../courses/api/course.api';
import { Trophy, Activity, Users as UsersIcon, BookOpen, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';

const trafficData = [
  { name: 'T2', active: 120, new: 20 },
  { name: 'T3', active: 150, new: 35 },
  { name: 'T4', active: 180, new: 40 },
  { name: 'T5', active: 140, new: 15 },
  { name: 'T6', active: 210, new: 50 },
  { name: 'T7', active: 250, new: 80 },
  { name: 'CN', active: 300, new: 110 },
];

const levelData = [
  { name: 'Sơ cấp (A1-A2)', value: 45 },
  { name: 'Trung cấp (B1-B2)', value: 35 },
  { name: 'Cao cấp (C1-C2)', value: 20 },
];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const Dashboard: React.FC = () => {
  const [totalStudents, setTotalStudents] = useState<number | string>('...');
  const [totalWords, setTotalWord] = useState<number | string>('...');
  const [totalCourses, setTotalCourses] = useState<number | string>('...');
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentCount = await getTotalStudents();
        setTotalStudents(studentCount);

        const wordCount = await getTotalWord();
        setTotalWord(wordCount);

        const courseCount = await getTotalCourse();
        setTotalCourses(courseCount);

        const topRes = await fetchTopStudents(5);
        if (topRes.data) setTopStudents(topRes.data);
      } catch (error) {
        setTotalStudents('Lỗi');
        setTotalWord('Lỗi');
        setTotalCourses('Lỗi');
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
            <div className="dashboard-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="dashboard-card-title">Học viên</span>
                <UsersIcon size={20} color="#3b82f6" opacity={0.8} />
              </div>
              <h3 className="dashboard-card-value">{totalStudents}</h3>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>+12% so với tháng trước</div>
            </div>
            <div className="dashboard-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="dashboard-card-title">Bài học</span>
                <BookOpen size={20} color="#8b5cf6" opacity={0.8} />
              </div>
              <h3 className="dashboard-card-value">{totalCourses}</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Đang hoạt động tốt</div>
            </div>
            <div className="dashboard-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="dashboard-card-title">Từ vựng</span>
                <BarChart2 size={20} color="#10b981" opacity={0.8} />
              </div>
              <h3 className="dashboard-card-value">{totalWords}</h3>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>+50 từ mới tuần này</div>
            </div>
            <div className="dashboard-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="dashboard-card-title">Đánh giá</span>
                <Activity size={20} color="#f59e0b" opacity={0.8} />
              </div>
              <h3 className="dashboard-card-value">4.8 / 5.0</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Từ 1.204 lượt đánh giá</div>
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
