import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { fetchTopics, createTopic, updateTopic, deleteTopic } from '../api/topic.api';
import '../../courses/pages/CourseList.css';

const TopicList: React.FC = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cefrLevel: ''
  });

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await fetchTopics();
      if (res.data) setTopics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleOpenModal = (topic?: any) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        title: topic.title || '',
        description: topic.description || '',
        cefrLevel: topic.cefrLevel || ''
      });
    } else {
      setEditingTopic(null);
      setFormData({ title: '', description: '', cefrLevel: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTopic(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, formData);
        alert('Cập nhật chủ đề thành công!');
      } else {
        await createTopic(formData);
        alert('Tạo chủ đề thành công!');
      }
      handleCloseModal();
      loadTopics();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) {
      try {
        await deleteTopic(id);
        alert('Đã xóa chủ đề');
        loadTopics();
      } catch (error) {
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main">
          <div className="course-list-header">
            <h2>Quản lý chủ đề</h2>
            <button className="add-course-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Thêm chủ đề
            </button>
          </div>

          <div className="course-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
            ) : (
              <table className="course-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên chủ đề</th>
                    <th>Mô tả</th>
                    <th>Cấp độ</th>
                    <th>Số bài học</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.id}>
                      <td>{topic.id}</td>
                      <td><strong>{topic.title}</strong></td>
                      <td style={{ maxWidth: '200px' }}>
                        <div className="description-truncate" title={topic.description || ''}>
                          {topic.description || <span style={{ color: '#94a3b8' }}>Chưa có mô tả</span>}
                        </div>
                      </td>
                      <td>
                        {topic.cefrLevel ? (
                          <span className={`cefr-badge badge-${topic.cefrLevel.toLowerCase()}`}>
                            {topic.cefrLevel}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>N/A</span>
                        )}
                      </td>
                      <td>{topic.lessons?.length || 0}</td>
                      <td>{new Date(topic.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => handleOpenModal(topic)}>
                            <Edit size={18} />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(topic.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {topics.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center' }}>Chưa có chủ đề nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên chủ đề (*)</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ví dụ: Chào hỏi, Cuộc sống..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Nhập mô tả cho chủ đề..."
                />
              </div>
              <div className="form-group">
                <label>Cấp độ (CEFR)</label>
                <select 
                  value={formData.cefrLevel} 
                  onChange={(e) => setFormData({...formData, cefrLevel: e.target.value})}
                >
                  <option value="">Không có cấp độ</option>
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Proficient</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="submit-btn">{editingTopic ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TopicList;
