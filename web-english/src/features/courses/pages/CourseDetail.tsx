import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { fetchCourseById, updateCourse, addWordsToCourse, removeWordFromCourse } from '../api/course.api';
import { uploadMedia } from '../../tests/api/test.api';
import { fetchWords } from '../../words/api/words.api';
import { fetchTests, createTest, deleteTest } from '../../tests/api/test.api';
import { ArrowLeft, BookOpen, CheckSquare, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import './CourseList.css'; // Reuse CSS


const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n📌 $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const getYouTubeId = (url?: string | null) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast, confirmModal } = useToast();
  const [course, setCourse] = useState<any>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'info' | 'words' | 'tests'>(
    (location.hash ? location.hash.replace('#', '') as 'info' | 'words' | 'tests' : 'info')
  );

  useEffect(() => {
    window.history.replaceState(null, '', '#' + activeTab);
  }, [activeTab]);

  // Topics
  const [topics, setTopics] = useState<any[]>([]);

  // Words modal state
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [availableWords, setAvailableWords] = useState<any[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [searchWord, setSearchWord] = useState('');

  // Tests state
  const [tests, setTests] = useState<any[]>([]);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState({ title: '', description: '', ceftLevel: '', skillCategory: '' });

  useEffect(() => {
    if (courseId) {
      loadCourse(parseInt(courseId));
      loadTests(parseInt(courseId));
    }
  }, [courseId]);

  // Temporary fetch topics directly inside until we create topic module on frontend
  const loadTopics = async () => {
    try {
      const { axiosClient } = await import('../../../config/axios');
      const res = await axiosClient.get('/admin/topics');
      setTopics(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const [infoForm, setInfoForm] = useState({ title: '', description: '', cefrLevel: '', topicId: '' as any, content: '', videoUrl: '', thumbnailUrl: '' });

  const loadCourse = async (id: number) => {
    try {
      const res = await fetchCourseById(id);
      if (res.data) {
        setCourse(res.data);
        setInfoForm({
          title: res.data.title || '',
          description: res.data.description || '',
          cefrLevel: res.data.cefrLevel || '',
          topicId: res.data.topicId || '',
          content: htmlToPlainText(res.data.content || ''),
          videoUrl: res.data.videoUrl || '',
          thumbnailUrl: res.data.thumbnailUrl || ''
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadTests = async (lessonId: number) => {
    try {
      const res = await fetchTests(undefined, undefined, lessonId);
      setTests(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveInfo = async () => {
    if (!course) return;
    try {
      await updateCourse(course.id, { 
        title: infoForm.title.trim(),
        description: infoForm.description || null,
        cefrLevel: infoForm.cefrLevel || null,
        topicId: infoForm.topicId ? parseInt(infoForm.topicId) : null,
        content: infoForm.content || null,
        videoUrl: infoForm.videoUrl?.trim() || null,
        thumbnailUrl: infoForm.thumbnailUrl?.trim() || null
      });
      toast.success('Cập nhật thông tin Bài học thành công!');
      loadCourse(course.id);
    } catch (error: any) {
      console.error('Error updating course:', error);
      const msg = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật thông tin';
      toast.error(msg);
    }
  };

  const handleOpenWordModal = async () => {
    setIsWordModalOpen(true);
    setSelectedWordIds([]);
    await loadAvailableWords();
  };

  const loadAvailableWords = async () => {
    try {
      const res = await fetchWords(1, 100, searchWord, course?.cefrLevel);
      if (res.data && Array.isArray(res.data)) {
        setAvailableWords(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isWordModalOpen) {
      loadAvailableWords();
    }
  }, [searchWord, isWordModalOpen]);

  const toggleWordSelection = (id: number) => {
    setSelectedWordIds(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handleAddWords = async () => {
    if (selectedWordIds.length === 0) return;
    try {
      await addWordsToCourse(course.id, selectedWordIds);
      toast.success('Đã thêm từ vựng thành công!');
      setIsWordModalOpen(false);
      loadCourse(course.id);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm từ vựng.');
    }
  };

  const handleRemoveWord = (wordId: number) => {
    confirmModal({
      title: 'Gỡ từ vựng',
      message: 'Bạn có chắc chắn muốn gỡ từ này khỏi bài học?',
      confirmText: 'Gỡ từ vựng',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await removeWordFromCourse(course.id, wordId);
          toast.success('Đã gỡ từ vựng khỏi bài học');
          loadCourse(course.id);
        } catch (error) {
          toast.error('Có lỗi xảy ra khi xóa từ.');
        }
      }
    });
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTest({ ...testForm, lessonId: course.id });
      toast.success('Tạo bài luyện tập thành công!');
      setIsTestModalOpen(false);
      setTestForm({ title: '', description: '', ceftLevel: '', skillCategory: '' });
      loadTests(course.id);
    } catch (error) {
      toast.error('Có lỗi khi tạo bài luyện tập');
    }
  };
  
  const handleDeleteTest = (id: number) => {
    confirmModal({
      title: 'Xóa bài luyện tập',
      message: 'Bạn có chắc chắn muốn xóa bài tập này?',
      confirmText: 'Xóa bài tập',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTest(id);
          toast.success('Đã xóa bài tập thành công!');
          loadTests(course.id);
        } catch (e) {
          toast.error('Lỗi khi xóa bài tập');
        }
      }
    });
  };

  if (!course) return <AdminLayout><div>Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="add-course-btn" style={{ background: '#64748b' }} onClick={() => navigate('/admin/courses')}>
            <ArrowLeft size={20} /> Quay lại
          </button>
          <div className="course-header-text">
            <h2>Chi tiết bài học: {course.title}</h2>
            <p>Quản lý nội dung, từ vựng và các bài tập 4 kỹ năng</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
          <button 
            style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'info' ? '2px solid #3b82f6' : 'none', color: activeTab === 'info' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
            onClick={() => setActiveTab('info')}
          >
            Thông tin chung
          </button>
          <button 
            style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'words' ? '2px solid #3b82f6' : 'none', color: activeTab === 'words' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
            onClick={() => setActiveTab('words')}
          >
            <BookOpen size={16} style={{ display: 'inline', marginRight: '8px' }}/> Từ vựng
          </button>
          <button 
            style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'tests' ? '2px solid #3b82f6' : 'none', color: activeTab === 'tests' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
            onClick={() => setActiveTab('tests')}
          >
            <CheckSquare size={16} style={{ display: 'inline', marginRight: '8px' }}/> Bài luyện tập
          </button>
        </div>

        {activeTab === 'info' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Thông tin Bài học</h3>
              <button className="add-course-btn" onClick={handleSaveInfo}>Lưu thay đổi</button>
            </div>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Tên bài (*)</label>
              <input type="text" style={{ width: '100%', padding: '8px' }} value={infoForm.title} onChange={e => setInfoForm({...infoForm, title: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Mô tả ngắn</label>
              <textarea style={{ width: '100%', padding: '8px' }} value={infoForm.description} onChange={e => setInfoForm({...infoForm, description: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Thuộc Chủ đề (Topic)</label>
              <select style={{ width: '100%', padding: '8px' }} value={infoForm.topicId} onChange={e => setInfoForm({...infoForm, topicId: e.target.value})}>
                <option value="">-- Không thuộc chủ đề nào --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Cấp độ (CEFR)</label>
              <select style={{ width: '100%', padding: '8px' }} value={infoForm.cefrLevel} onChange={e => setInfoForm({...infoForm, cefrLevel: e.target.value})}>
                <option value="">Không phân loại</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Ảnh bìa / Thumbnail bài học (URL hoặc tải ảnh lên)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="https://... hoặc tải ảnh lên" 
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} 
                  value={infoForm.thumbnailUrl} 
                  onChange={e => setInfoForm({...infoForm, thumbnailUrl: e.target.value})} 
                />
                <input 
                  type="file" 
                  id="course-thumb-upload" 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await uploadMedia(file);
                      if (res?.data?.url) {
                        setInfoForm(prev => ({ ...prev, thumbnailUrl: res.data.url }));
                        toast.success('Tải ảnh bìa thành công!');
                      }
                    } catch(err) {
                      toast.error('Lỗi khi tải ảnh lên');
                    } finally {
                      e.target.value = '';
                    }
                  }} 
                />
                <button 
                  type="button" 
                  style={{ padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} 
                  onClick={() => document.getElementById('course-thumb-upload')?.click()}
                >
                  Tải ảnh lên
                </button>
                {infoForm.thumbnailUrl && (
                  <button 
                    type="button" 
                    style={{ padding: '10px 14px', background: '#f1f5f9', color: '#dc2626', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} 
                    onClick={() => setInfoForm({...infoForm, thumbnailUrl: ''})}
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>

              {/* Xem trước ảnh bìa */}
              {infoForm.thumbnailUrl && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img 
                    src={infoForm.thumbnailUrl.startsWith('http') ? infoForm.thumbnailUrl : `http://localhost:3000${infoForm.thumbnailUrl}`} 
                    alt="Lesson Thumbnail" 
                    style={{ width: '100px', height: '65px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Ảnh bìa bài học</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Hình ảnh đại diện sẽ hiển thị nổi bật trên danh sách bài học của ứng dụng Mobile.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Link Audio/Video bài nghe, bài giảng (URL hoặc tải lên)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Dán link YouTube (https://www.youtube.com/watch?v=...) hoặc đường dẫn media..." 
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} 
                  value={infoForm.videoUrl} 
                  onChange={e => setInfoForm({...infoForm, videoUrl: e.target.value})} 
                />
                <input type="file" id="course-media-upload" style={{ display: 'none' }} accept="audio/*,video/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const res = await uploadMedia(file);
                    if (res?.data?.url) {
                      setInfoForm(prev => ({ ...prev, videoUrl: res.data.url }));
                      toast.success('Tải file phương tiện thành công!');
                    }
                  } catch(err) {
                    toast.error('Lỗi khi tải file lên');
                  } finally {
                    e.target.value = '';
                  }
                }} />
                <button 
                  type="button" 
                  style={{ padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} 
                  onClick={() => document.getElementById('course-media-upload')?.click()}
                >
                  Tải file lên
                </button>
              </div>

              {/* Xem trước Video YouTube nếu có */}
              {getYouTubeId(infoForm.videoUrl) && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', width: '120px', height: '68px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#000' }}>
                    <img 
                      src={`https://img.youtube.com/vi/${getYouTubeId(infoForm.videoUrl)}/mqdefault.jpg`} 
                      alt="YouTube Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '14px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>▶</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Video bài giảng YouTube đã sẵn sàng</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Học viên trên ứng dụng di động có thể xem trực tiếp bài giảng này.</div>
                    <a href={infoForm.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500', display: 'inline-block', marginTop: '4px' }}>
                      Xem thử video ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontWeight: '600', color: '#1e293b' }}>Lý thuyết / Ngữ pháp (Nội dung bài học)</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{ fontSize: '12px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                    onClick={() => setInfoForm(prev => ({ ...prev, content: (prev.content ? prev.content + '\n\n' : '') + '📌 Tiêu đề mục:\n' }))}
                  >
                    + Tiêu đề
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '12px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                    onClick={() => setInfoForm(prev => ({ ...prev, content: (prev.content ? prev.content + '\n' : '') + '👉 Cấu trúc: ' }))}
                  >
                    + Cấu trúc
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '12px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                    onClick={() => setInfoForm(prev => ({ ...prev, content: (prev.content ? prev.content + '\n' : '') + '💡 Ví dụ: ' }))}
                  >
                    + Ví dụ
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '12px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                    onClick={() => setInfoForm(prev => ({ ...prev, content: (prev.content ? prev.content + '\n' : '') + '⚠️ Lưu ý: ' }))}
                  >
                    + Lưu ý
                  </button>
                  {/<[a-z][\s\S]*>/i.test(infoForm.content) && (
                    <button
                      type="button"
                      style={{ fontSize: '12px', padding: '4px 8px', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer', color: '#b91c1c', fontWeight: 'bold' }}
                      onClick={() => {
                        setInfoForm(prev => ({ ...prev, content: htmlToPlainText(prev.content) }));
                        toast.success('Đã chuyển đổi mã code sang văn bản thuần sạch sẽ!');
                      }}
                    >
                      🧹 Làm sạch mã code HTML
                    </button>
                  )}
                </div>
              </div>

              {/* Hướng dẫn giáo viên */}
              {/* <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 12px', marginBottom: '8px', fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
              <strong>Dành cho Giáo viên:</strong> Soạn thảo văn bản thông thường (xuống dòng để tách đoạn, dùng dấu <code>-</code> hoặc <code>•</code> để liệt kê). <strong>Không cần viết mã code HTML</strong>, hệ thống sẽ tự động trình bày đẹp mắt trên ứng dụng di động cho học viên.
              </div> */}

              <textarea 
                placeholder="Nhập nội dung bài học, lý thuyết ngữ pháp, quy tắc hoặc hướng dẫn học tập tại đây..." 
                style={{ width: '100%', padding: '12px', minHeight: '180px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit' }} 
                value={infoForm.content} 
                onChange={e => setInfoForm({...infoForm, content: e.target.value})} 
              />
            </div>
            
          </div>
        )}

        {activeTab === 'words' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Từ vựng trong bài ({course.words?.length || 0})</h3>
              <button className="add-course-btn" onClick={handleOpenWordModal}>
                <Plus size={18} /> Gán thêm từ vựng
              </button>
            </div>
            
            {course.words && course.words.length > 0 ? (
              <table className="course-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tiếng Anh</th>
                    <th>Tiếng Việt</th>
                    <th>Từ loại</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {course.words.map((wordObj: any) => {
                    const word = wordObj.word || wordObj;
                    return (
                      <tr key={word.id || wordObj.id}>
                        <td>{word.id || wordObj.id}</td>
                        <td><strong>{word.headword}</strong></td>
                        <td>{word.meaning}</td>
                        <td>{word.partOfSpeech}</td>
                        <td>
                          <button className="btn-delete" onClick={() => handleRemoveWord(word.id || wordObj.id)}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Chưa có từ vựng nào trong bài học này.</p>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Các bài luyện tập ({tests.length})</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="add-course-btn" style={{ background: '#3b82f6' }} onClick={() => { setTestForm({...testForm, title: 'Bài Luyện Nghe', skillCategory: 'listening'}); setIsTestModalOpen(true); }}>
                    <Plus size={16} /> Luyện Nghe
                  </button>
                  <button className="add-course-btn" style={{ background: '#10b981' }} onClick={() => { setTestForm({...testForm, title: 'Bài Luyện Nói', skillCategory: 'speaking'}); setIsTestModalOpen(true); }}>
                    <Plus size={16} /> Luyện Nói
                  </button>
                  <button className="add-course-btn" style={{ background: '#f59e0b' }} onClick={() => { setTestForm({...testForm, title: 'Bài Luyện Đọc'}); setIsTestModalOpen(true); }}>
                    <Plus size={16} /> Luyện Đọc
                  </button>
                  <button className="add-course-btn" style={{ background: '#ef4444' }} onClick={() => { setTestForm({...testForm, title: 'Bài Luyện Viết', skillCategory: 'writing'}); setIsTestModalOpen(true); }}>
                    <Plus size={16} /> Luyện Viết
                  </button>
                </div>
              </div>
            
            {tests.length > 0 ? (
              <table className="course-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên bài tập</th>
                    <th>Mô tả</th>
                    <th>Số câu hỏi</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map(test => (
                    <tr key={test.id}>
                      <td>{test.id}</td>
                      <td><strong>{test.title}</strong></td>
                      <td>{test.description}</td>
                      <td>{test._count?.questions || 0}</td>
                      <td>
                        <button className="btn-edit" onClick={() => navigate(`/admin/tests/${test.id}`)} title="Mở bộ câu hỏi">
                          <Edit size={18} />
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteTest(test.id)} style={{ marginLeft: '8px' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Bài học này chưa có bài tập nào.</p>
            )}
          </div>
        )}

      </div>

      {isWordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3>Chọn từ vựng từ Kho {course?.cefrLevel ? `(Cấp độ: ${course.cefrLevel})` : '(Tất cả cấp độ)'}</h3>
            <div style={{ marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Tìm kiếm từ vựng..." 
                className="search-input"
                style={{ width: '100%', padding: '10px' }}
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
              />
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {availableWords.map(word => {
                const isSelected = selectedWordIds.includes(word.id);
                const isAlreadyInCourse = course.words?.some((cw: any) => cw.id === word.id);
                
                return (
                  <div 
                    key={word.id} 
                    style={{ 
                      padding: '12px', 
                      borderBottom: '1px solid #f1f5f9', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isAlreadyInCourse ? '#f8fafc' : (isSelected ? '#eff6ff' : 'white'),
                      cursor: isAlreadyInCourse ? 'not-allowed' : 'pointer',
                      opacity: isAlreadyInCourse ? 0.6 : 1
                    }}
                    onClick={() => !isAlreadyInCourse && toggleWordSelection(word.id)}
                  >
                    <div>
                      <strong>{word.headword}</strong> <span style={{ color: '#64748b' }}>({word.partOfSpeech})</span>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{word.meaning}</div>
                    </div>
                    {isAlreadyInCourse ? (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>Đã thêm</span>
                    ) : (
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        readOnly
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="cancel-btn" onClick={() => setIsWordModalOpen(false)}>Hủy</button>
              <button type="button" className="submit-btn" onClick={handleAddWords} disabled={selectedWordIds.length === 0}>
                Thêm {selectedWordIds.length} từ
              </button>
            </div>
          </div>
        </div>
      )}

      {isTestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Tạo bài luyện tập mới</h3>
            <form onSubmit={handleCreateTest}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tên bài tập (*)</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required 
                  value={testForm.title} 
                  onChange={e => setTestForm({...testForm, title: e.target.value})} 
                  placeholder="Ví dụ: Luyện Nghe, Luyện Nói..."
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mô tả</label>
                <textarea 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                  value={testForm.description} 
                  onChange={e => setTestForm({...testForm, description: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsTestModalOpen(false)}>Hủy</button>
                <button type="submit" className="submit-btn">Tạo bài luyện tập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CourseDetail;
