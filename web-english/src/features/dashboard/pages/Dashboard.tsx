import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { getTotalStudents } from '../../students/api/student.api';
import { getTotalWord } from '../../words/api/words.api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [totalStudents, setTotalStudents] = useState<number | string>('...');
  const [totalWords, setTotalWord] = useState<number | string>('...');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentCount = await getTotalStudents();
        setTotalStudents(studentCount);

        const wordCount = await getTotalWord();
        setTotalWord(wordCount);
      } catch (error) {
        setTotalStudents('Lỗi');
        setTotalWord('Lỗi');
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
              <h3 className="dashboard-card-value">48</h3>
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
