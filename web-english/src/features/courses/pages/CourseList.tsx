import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { fetchCourses, createCourse, updateCourse, deleteCourse } from '../api/course.api';
import AdminLayout from '../../../components/layout/AdminLayout';
import './CourseList.css';

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [cefrLevel, setCefrLevel] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cefrLevel: '',
    thumbnailUrl: ''
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await fetchCourses(page, limit, search, cefrLevel);
      if (result.data && Array.isArray(result.data.items)) {
        setCourses(result.data.items);
      } else if (result.data && Array.isArray(result.data.courses)) {
        setCourses(result.data.courses);
      } else if (Array.isArray(result.data)) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách bài học", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [page, limit, search, cefrLevel]);

  const handleOpenModal = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title || '',
        description: course.description || '',
        cefrLevel: course.cefrLevel || '',
        thumbnailUrl: course.thumbnailUrl || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        cefrLevel: '',
        thumbnailUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
        alert('Cập nhật bài học thành công!');
      } else {
        await createCourse(formData);
        alert('Thêm bài học thành công!');
      }
      handleCloseModal();
      loadCourses();
    } catch (error) {
      console.error("Lỗi khi lưu bài học", error);
      alert('Có lỗi xảy ra khi lưu bài học.');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài học này không?')) {
      try {
        await deleteCourse(id);
        alert('Xóa bài học thành công!');
        loadCourses();
      } catch (error) {
        console.error("Lỗi xóa bài học", error);
        alert('Có lỗi xảy ra khi xóa bài học.');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="course-list-main">
        <div className="course-list-header">
          <h2>Quản lý bài học</h2>
          <button className="add-course-btn" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Thêm bài học
          </button>
        </div>

        <div className="course-filters">
          <input 
            type="text" 
            placeholder="Tìm kiếm bài học..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="filter-select"
            value={cefrLevel}
            onChange={(e) => setCefrLevel(e.target.value)}
          >
            <option value="">Tất cả cấp độ</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        <div className="course-table-container">
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
          ) : (
            <table className="course-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề</th>
                  <th>Cấp độ</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Không có bài học nào.</td>
                  </tr>
                ) : (
                  courses.map(course => (
                    <tr key={course.id}>
                      <td>#{course.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {course.thumbnailUrl && (
                            <img src={course.thumbnailUrl} alt={course.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          )}
                          <strong>{course.title}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          backgroundColor: '#f1f5f9', 
                          borderRadius: '4px',
                          fontWeight: 500,
                          fontSize: '14px'
                        }}>
                          {course.cefrLevel || 'N/A'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {course.description}
                      </td>
                      <td>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-edit" 
                            title="Xem chi tiết & Quản lý"
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                          >
                            <BookOpen size={18} />
                          </button>
                          <button className="btn-edit" onClick={() => handleOpenModal(course)}>
                            <Edit size={18} />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(course.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <button 
            className="page-btn" 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </button>
          <span>Trang {page}</span>
          <button 
            className="page-btn" 
            disabled={courses.length < limit}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingCourse ? 'Sửa bài học' : 'Thêm bài học mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tiêu đề (*)</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Cấp độ CEFR</label>
                <select 
                  value={formData.cefrLevel}
                  onChange={(e) => setFormData({...formData, cefrLevel: e.target.value})}
                >
                  <option value="">Chọn cấp độ...</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Link hình ảnh (Thumbnail URL)</label>
                <input 
                  type="text" 
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.thumbnailUrl && (
                  <img src={formData.thumbnailUrl} alt="Preview" className="thumbnail-preview" />
                )}
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="submit-btn">{editingCourse ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CourseList;
