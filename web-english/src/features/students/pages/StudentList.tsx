import React, { useEffect, useState } from 'react';
import { getStudents } from '../api/student.api';
import type { Student } from '../types/student.types';
const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await getStudents({ page: 1, limit: 10 });
        if (response.success) {
          setStudents(response.data.students);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Quản lý Học viên</h2>
      {loading ? <p>Đang tải dữ liệu...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tên</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Điểm XP</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.username}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.xpPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentList;
