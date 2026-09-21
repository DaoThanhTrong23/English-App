import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { fetchTopStudents } from '../../students/api/student.api';
import { Gamepad2Icon, Trophy } from 'lucide-react';
import './GameStats.css';

const GameStats: React.FC = () => {
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetchTopStudents(10);
      setTopStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankClass = (index: number) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return 'rank-other';
  };

  return (
    <AdminLayout>
      <div className="game-stats-container">
        <h2><Gamepad2Icon style={{ marginRight: 8, verticalAlign: 'middle' }} /> Bảng vàng Game Thủ (Top 10)</h2>
        <p style={{ color: '#64748b' }}>Thống kê những học viên có điểm kinh nghiệm (XP) cao nhất từ các trò chơi và bài kiểm tra.</p>

        <div className="leaderboard-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Trophy color="#fbbf24" /> Leaderboard
          </h3>
          
          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Xếp hạng</th>
                  <th>Học viên</th>
                  <th>Email</th>
                  <th>Tổng XP</th>
                  <th>Đăng ký lúc</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((student, idx) => (
                  <tr key={student.id}>
                    <td>
                      <span className={"rank-badge " + getRankClass(idx)}>
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{student.fullName || student.username}</td>
                    <td>{student.email}</td>
                    <td style={{ color: '#10b981', fontWeight: 'bold' }}>{student.xpPoints} XP</td>
                    <td>{new Date(student.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
                {topStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GameStats;
