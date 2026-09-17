import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { getTotalStudents, fetchTopStudents } from '../../students/api/student.api';
import { getTotalWord } from '../../words/api/words.api';
import { getTotalCourse } from '../../courses/api/course.api';
import { Trophy } from 'lucide-react';
import './Dashboard.css';

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
          <h2 className="dashboard-title">Bảng thống kê</h2>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span className="dashboard-card-title">Tổng học viên</span>
              <h3 className="dashboard-card-value">{totalStudents}</h3>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-title">Tổng bài học</span>
              <h3 className="dashboard-card-value">{totalCourses}</h3>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-title">Tổng từ vựng</span>
              <h3 className="dashboard-card-value">{totalWords}</h3>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-title">Điểm đánh giá</span>
              <h3 className="dashboard-card-value">4.8</h3>
            </div>
          </div>

          <div style={{ marginTop: '32px', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#1e293b' }}>
              <Trophy size={20} color="#f59e0b" /> Top 5 Học viên xuất sắc
            </h3>
            {topStudents.length === 0 ? <p>Chưa có dữ liệu</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '12px 8px' }}>Hạng</th>
                    <th style={{ padding: '12px 8px' }}>Học viên</th>
                    <th style={{ padding: '12px 8px' }}>Điểm XP</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student, index) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: index < 3 ? '#f59e0b' : '#64748b' }}>#{index + 1}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{student.username || student.fullName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{student.email}</div>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#3b82f6' }}>{student.xpPoints} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
