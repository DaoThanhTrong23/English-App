import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, RotateCcw, BookOpen } from 'lucide-react';
import { fetchCourses, createCourse, updateCourse, deleteCourse, restoreCourse } from '../api/course.api';
import { fetchTopics, restoreTopic } from '../../topics/api/topic.api';
import AdminLayout from '../../../components/layout/AdminLayout';
import { useToast } from '../../../context/ToastContext';
import './CourseList.css';

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, confirmModal } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const topicIdQuery = queryParams.get('topicId') || '';
  const [courses, setCourses] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [cefrLevel, setCefrLevel] = useState('');
  const [filterTopicId, setFilterTopicId] = useState(topicIdQuery);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cefrLevel: '',
    thumbnailUrl: '',
    topicId: ''
  });

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const res = await fetchTopics();
      if (res.data) setTopics(res.data);
    } catch (e) {
      console.error('Error loading topics', e);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await fetchCourses(page, limit, search, cefrLevel, filterTopicId);
      if (result.data && Array.isArray(result.data.items)) {
        setCourses(result.data.items);
        if (result.data.pagination?.totalPages) {
          setTotalPages(result.data.pagination.totalPages);
        }
      } else if (result.data && Array.isArray(result.data.courses)) {
        setCourses(result.data.courses);
        if (result.data.pagination?.totalPages) {
          setTotalPages(result.data.pagination.totalPages);
        }
      } else if (Array.isArray(result.data)) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách bài học", error);
      toast.error('Lỗi khi tải danh sách bài học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, cefrLevel, filterTopicId]);

  const handleOpenModal = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title || '',
        description: course.description || '',
        cefrLevel: course.cefrLevel || '',
        thumbnailUrl: course.thumbnailUrl || '',
        topicId: course.topicId || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        cefrLevel: '',
        thumbnailUrl: '',
        topicId: ''
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
      const payload = {
        ...formData,
        topicId: formData.topicId ? parseInt(formData.topicId as string) : null
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        toast.success('Cập nhật bài học thành công!');
      } else {
        await createCourse(payload);
        toast.success('Tạo bài học thành công!');
      }
      handleCloseModal();
      loadCourses();
    } catch (error) {
      console.error("Lỗi khi lưu bài học", error);
      toast.error('Có lỗi xảy ra khi lưu bài học.');
    }
  };

  
  const handleRestore = async (id: number) => {
    try {
      await restoreCourse(id);
      toast.success('Khôi phục bài học thành công!');
      loadCourses();
    } catch (e: any) {
      toast.error('Lỗi khi khôi phục bài học');
    }
  };

  const handleRestoreTopic = async (topicId: number) => {
    try {
      await restoreTopic(topicId);
      toast.success('Khôi phục chủ đề liên quan thành công!');
      loadCourses();
    } catch (e: any) {
      toast.error('Lỗi khi khôi phục chủ đề');
    }
  };

  const handleDelete = (id: string | number) => {
    confirmModal({
      title: 'Xóa bài học',
      message: 'Bạn có chắc chắn muốn xóa bài học này không? Tất cả từ vựng và bài tập liên kết sẽ bị gỡ.',
      confirmText: 'Xóa bài học',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteCourse(id);
          toast.success('Xóa bài học thành công!');
          loadCourses();
        } catch (error) {
          console.error("Lỗi xóa bài học", error);
          toast.error('Có lỗi xảy ra khi xóa bài học.');
        }
      }
    });
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            className="filter-select"
            value={cefrLevel}
            onChange={(e) => { setCefrLevel(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả cấp độ</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
          <select 
            className="filter-select" 
            value={filterTopicId} 
            onChange={(e) => { setFilterTopicId(e.target.value); setPage(1); }} 
            style={{ marginLeft: '10px' }}
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
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
                  {/* <th>Chủ đề</th> */}
                  <th>Cấp độ</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Không có bài học nào.</td>
                  </tr>
                ) : (
                  courses.map(course => (
                    <tr 
                      key={course.id} 
                      style={{ 
                        backgroundColor: course.deletedAt ? '#fef2f2' : (course.isTopicDeleted ? '#fffbeb' : undefined) 
                      }}
                    >
                      <td style={{ opacity: (course.deletedAt || course.isTopicDeleted) ? 0.45 : 1 }}>#{course.id}</td>
                      <td style={{ opacity: (course.deletedAt || course.isTopicDeleted) ? 0.45 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {course.thumbnailUrl && (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title} 
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://placehold.co/40x40?text=Lesson';
                              }}
                            />
                          )}
                          <div>
                            <strong>{course.title}</strong>
                            {course.deletedAt && (
                              <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: 'bold' }}>
                                Đã xóa
                              </span>
                            )}
                            {!course.deletedAt && course.isTopicDeleted && (
                              <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '4px', fontWeight: 'bold' }}>
                                Chủ đề liên quan đã bị xóa
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* <td>
                        {course.topic?.title || <span style={{ color: '#94a3b8' }}>Không phân loại</span>}
                      </td> */}
                      <td style={{ opacity: (course.deletedAt || course.isTopicDeleted) ? 0.45 : 1 }}>
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
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: (course.deletedAt || course.isTopicDeleted) ? 0.45 : 1 }}>
                        {course.description}
                      </td>
                      <td style={{ opacity: (course.deletedAt || course.isTopicDeleted) ? 0.45 : 1 }}>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-view-detail" 
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                          >
                            <BookOpen size={15} /> Xem chi tiết & quản lý
                          </button>
                          {course.deletedAt ? (
                            <button
                              className="btn-restore"
                              title="Khôi phục bài học"
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.4)'
                              }}
                              onClick={() => handleRestore(course.id)}
                            >
                              <RotateCcw size={15} /> Khôi phục
                            </button>
                          ) : course.isTopicDeleted ? (
                            <button
                              className="btn-restore-topic"
                              title="Khôi phục chủ đề liên quan"
                              style={{
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 1px 3px rgba(245, 158, 11, 0.4)'
                              }}
                              onClick={() => course.topicId && handleRestoreTopic(course.topicId)}
                            >
                              <RotateCcw size={15} /> Khôi phục chủ đề
                            </button>
                          ) : (
                            <>
                              <button className="btn-edit" onClick={() => handleOpenModal(course)}>
                                <Edit size={18} />
                              </button>
                              <button className="btn-delete" onClick={() => handleDelete(course.id)}>
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
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
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </button>
          <span>Trang {page} / {totalPages || 1}</span>
          <button 
            className="page-btn" 
            disabled={page >= totalPages || courses.length === 0}
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
                <label>Chủ đề (Topic)</label>
                <select 
                  value={formData.topicId}
                  onChange={(e) => setFormData({...formData, topicId: e.target.value})}
                >
                  <option value="">Tất cả chủ đề</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.cefrLevel || 'N/A'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cấp độ CEFR</label>
                <select 
                  value={formData.cefrLevel}
                  onChange={(e) => setFormData({...formData, cefrLevel: e.target.value})}
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
                  <img 
                    src={formData.thumbnailUrl} 
                    alt="Preview" 
                    className="thumbnail-preview" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/100x100?text=Invalid+Image';
                    }}
                  />
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
