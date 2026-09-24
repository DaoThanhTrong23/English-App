import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2, Trophy } from 'lucide-react';
import { fetchAchievements, createAchievement, updateAchievement, deleteAchievement } from '../api/achievement.api';
import '../../courses/pages/CourseList.css';

const AchievementList: React.FC = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    iconUrl: '',
    requireXp: 0,
    requireStreak: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAchievements();
      if (res.data) setAchievements(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        description: item.description || '',
        iconUrl: item.iconUrl || '',
        requireXp: item.requireXp || 0,
        requireStreak: item.requireStreak || 0
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', iconUrl: '', requireXp: 0, requireStreak: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateAchievement(editingItem.id, formData);
        alert('Cập nhật danh hiệu thành công!');
      } else {
        await createAchievement(formData);
        alert('Tạo danh hiệu thành công!');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh hiệu này?')) {
      try {
        await deleteAchievement(id);
        alert('Đã xóa danh hiệu');
        loadData();
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
            <h2><Trophy size={24} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} /> Quản lý danh hiệu</h2>
            <button className="add-course-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Thêm danh hiệu
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
                    <th>Icon</th>
                    <th>Tên danh hiệu</th>
                    <th>Yêu cầu XP</th>
                    <th>Yêu cầu Streak (Ngày)</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        {item.iconUrl ? (
                          <img src={item.iconUrl} alt="icon" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        ) : (
                          <Trophy size={30} color="#cbd5e1" />
                        )}
                      </td>
                      <td>
                        <strong>{item.title}</strong>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{item.description}</div>
                      </td>
                      <td><strong style={{ color: '#3b82f6' }}>{item.requireXp} XP</strong></td>
                      <td><strong style={{ color: '#f59e0b' }}>{item.requireStreak} Ngày</strong></td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => handleOpenModal(item)}>
                            <Edit size={18} />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {achievements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>Chưa có danh hiệu nào</td>
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
            <h3>{editingItem ? 'Sửa danh hiệu' : 'Thêm danh hiệu mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên danh hiệu (*)</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ví dụ: Chiến thần, Chăm chỉ..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Yêu cầu điểm XP (Để đạt được)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.requireXp} 
                  onChange={(e) => setFormData({...formData, requireXp: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="form-group">
                <label>Yêu cầu chuỗi ngày học (Streak)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.requireStreak} 
                  onChange={(e) => setFormData({...formData, requireStreak: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="form-group">
                <label>Icon URL (Đường dẫn ảnh/huy hiệu)</label>
                <input 
                  type="text" 
                  value={formData.iconUrl} 
                  onChange={(e) => setFormData({...formData, iconUrl: e.target.value})} 
                  placeholder="https://..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="submit-btn">{editingItem ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AchievementList;
