import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2, ArrowLeft, CheckCircle2, Circle, Upload } from 'lucide-react';
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion, importQuestionsFromExcel, uploadMedia } from '../api/test.api';
import './TestDetail.css';
import '../pages/TestList.css'; // Reuse modal classes

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case 'multiple_choice': return 'Đọc - Trắc nghiệm';
    case 'fill_in_blank': return 'Viết - Điền khuyết';
    case 'listening': return 'Nghe - Chọn đáp án';
    case 'speaking': return 'Nói - Ghi âm';
    case 'writing': return 'Viết - Tự do';
    default: return type;
  }
};

const TestDetail: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    quesionText: '',
    questionType: 'multiple_choice',
    points: 10,
    audioUrl: '',
    imageUrl: '',
    answers: [
      { answerText: '', isCorrect: false },
      { answerText: '', isCorrect: false }
    ]
  });

  const loadQuestions = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await fetchQuestions(testId);
      if (res.data) {
        setQuestions(res.data);
      }
    } catch (error) {
      console.error("Lỗi tải câu hỏi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [testId]);

  const handleOpenModal = (question?: any) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        quesionText: question.quesionText || '',
        questionType: question.questionType || 'multiple_choice',
        points: Number(question.points) || 10,
        audioUrl: question.audioUrl || '',
        imageUrl: question.imageUrl || '',
        answers: question.answers && question.answers.length > 0
          ? question.answers.map((a: any) => ({ ...a }))
          : [{ answerText: '', isCorrect: false }, { answerText: '', isCorrect: false }]
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        quesionText: '',
        questionType: 'multiple_choice',
        points: 10,
        audioUrl: '',
        imageUrl: '',
        answers: [
          { answerText: '', isCorrect: true }, // Default 1 correct
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false }
        ]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleAddAnswerRow = () => {
    setFormData(prev => ({
      ...prev,
      answers: [...prev.answers, { answerText: '', isCorrect: false }]
    }));
  };

  const handleRemoveAnswerRow = (index: number) => {
    setFormData(prev => {
      const newAnswers = [...prev.answers];
      newAnswers.splice(index, 1);
      return { ...prev, answers: newAnswers };
    });
  };

  const handleAnswerChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newAnswers = [...prev.answers];

      // If multiple choice and we are setting one to true, set others to false
      if (field === 'isCorrect' && value === true && prev.questionType === 'multiple_choice') {
        newAnswers.forEach(a => a.isCorrect = false);
      }

      newAnswers[index] = { ...newAnswers[index], [field]: value };
      return { ...prev, answers: newAnswers };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalFormData = { ...formData };

    if (formData.questionType === 'speaking' || formData.questionType === 'writing') {
      finalFormData.answers = [];
    } else {
      // Validate: at least one answer must be correct for non-speaking/writing
      const hasCorrectAnswer = formData.answers.some(a => a.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Vui lòng chọn ít nhất 1 đáp án đúng!");
        return;
      }
    }

    try {
      if (editingQuestion) {
        await updateQuestion(testId!, editingQuestion.id, finalFormData);
        alert('Cập nhật câu hỏi thành công!');
      } else {
        await createQuestion(testId!, finalFormData);
        alert('Tạo câu hỏi thành công!');
      }
      handleCloseModal();
      loadQuestions();
    } catch (error) {
      console.error("Lỗi khi lưu câu hỏi", error);
      alert('Có lỗi xảy ra khi lưu câu hỏi.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) {
      try {
        await deleteQuestion(testId!, id);
        alert('Xóa câu hỏi thành công!');
        loadQuestions();
      } catch (error) {
        console.error("Lỗi xóa câu hỏi", error);
        alert('Có lỗi xảy ra khi xóa câu hỏi.');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await importQuestionsFromExcel(testId!, file);
      alert(`Nhập dữ liệu thành công! Đã thêm ${res.data?.imported || 0} câu hỏi.`);
      loadQuestions();
    } catch (error) {
      console.error("Lỗi import excel", error);
      alert("Có lỗi xảy ra khi nhập file Excel. Hãy chắc chắn file đúng định dạng.");
    } finally {
      setImporting(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AdminLayout>
      <div className="test-detail-main">
        <button className="back-btn" onClick={() => navigate('/admin/tests')}>
          <ArrowLeft size={16} /> Quay lại danh sách bài thi
        </button>

        <div className="test-detail-header">
          <h2>Quản lý câu hỏi (Bài thi #{testId})</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="file"
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              className="add-test-btn"
              style={{ backgroundColor: '#10b981' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload size={18} /> {importing ? 'Đang xử lý...' : 'Nhập Excel'}
            </button>
            <button className="add-test-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Thêm câu hỏi mới
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải câu hỏi...</div>
        ) : (
          <div className="question-list">
            {questions.length === 0 ? (
              <div style={{ padding: '24px', background: 'white', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                Chưa có câu hỏi nào trong bài thi này.
              </div>
            ) : (
              questions.map((q, index) => (
                <div className="question-card" key={q.id}>
                  <div className="question-header">
                    <div>
                      <h4>Câu {index + 1}: {q.quesionText}</h4>
                      <div className="question-meta">
                        <span className="question-badge">{getQuestionTypeLabel(q.questionType)}</span>
                        <span className="question-badge">{q.points} điểm</span>
                        {q.audioUrl && <span className="question-badge" style={{ color: '#3b82f6' }}>🎵 Có Audio</span>}
                        {q.imageUrl && <span className="question-badge" style={{ color: '#8b5cf6' }}>🖼️ Có Ảnh</span>}
                      </div>
                    </div>
                    <div className="test-card-actions">
                      <button className="test-action-btn edit" onClick={() => handleOpenModal(q)}>
                        <Edit size={16} />
                      </button>
                      <button className="test-action-btn delete" onClick={() => handleDelete(q.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="answers-list">
                    {q.answers && q.answers.map((a: any) => (
                      <div className={`answer-item ${a.isCorrect ? 'correct' : ''}`} key={a.id}>
                        {a.isCorrect ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} color="#cbd5e1" />}
                        <span>{a.answerText}</span>
                        {a.isCorrect && <span className="correct-badge">Đáp án đúng</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ overflowY: 'auto', width: '100%' }}>
          <div className="modal-content" style={{ margin: '10px auto', minWidth: '50%' }}>
            <h3>{editingQuestion ? 'Sửa câu Hỏi' : 'Thêm câu hỏi'}</h3>
            <form onSubmit={handleSubmit}>

              <div style={{ display: 'flex' }}>

                <div style={{marginRight: '10px', width: '50%'}}>
                  <div className="form-group">
                    <label>Nội dung câu hỏi (*)</label>
                    <textarea
                      required
                      value={formData.quesionText}
                      onChange={(e) => setFormData({ ...formData, quesionText: e.target.value })}
                      rows={3}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Loại câu hỏi</label>
                      <select
                        value={formData.questionType}
                        onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                      >
                        <option value="multiple_choice">Đọc - Trắc nghiệm</option>
                        <option value="fill_in_blank">Viết - Điền khuyết</option>
                        <option value="listening">Nghe - Chọn đáp án</option>
                        <option value="speaking">Nói - Ghi âm</option>
                        <option value="writing">Viết - Tự do</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ width: '120px' }}>
                      <label>Điểm</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>File Âm thanh (Audio MP3) - Tuỳ chọn</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="URL MP3 hoặc tải lên..."
                          value={formData.audioUrl}
                          onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                        />
                        <input type="file" id="audio-upload" style={{ display: 'none' }} accept="audio/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const res = await uploadMedia(file);
                          if (res.data?.url) setFormData({ ...formData, audioUrl: res.data.url });
                        }} />
                        <button type="button" className="add-test-btn" onClick={() => document.getElementById('audio-upload')?.click()}>Tải lên</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Hình ảnh minh họa - Tuỳ chọn</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="URL Hình ảnh hoặc tải lên..."
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        />
                        <input type="file" id="image-upload" style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const res = await uploadMedia(file);
                          if (res.data?.url) setFormData({ ...formData, imageUrl: res.data.url });
                        }} />
                        <button type="button" className="add-test-btn" onClick={() => document.getElementById('image-upload')?.click()}>Tải lên</button>
                      </div>
                    </div>
                  </div>

                </div>






                {formData.questionType !== 'speaking' && formData.questionType !== 'writing' && (
                  <div className="form-group" style={{marginLeft: '15px', width: '50%'}}>
                    <label>Các đáp án</label>
                    <div className="dynamic-answers">
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 0, marginBottom: '12px' }}>
                        Tích chọn vào ô tròn/vuông để đánh dấu đáp án đúng.
                      </p>

                      {formData.answers.map((answer, index) => (
                        <div className="dynamic-answer-row" key={index}>
                          <input
                            type={formData.questionType === 'multiple_choice' ? 'radio' : 'checkbox'}
                            name="isCorrect"
                            checked={answer.isCorrect}
                            onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                          />
                          <input
                            type="text"
                            placeholder={`Đáp án ${index + 1}`}
                            required
                            value={answer.answerText}
                            onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                          />
                          {formData.answers.length > 2 && (
                            <button
                              type="button"
                              className="remove-answer-btn"
                              onClick={() => handleRemoveAnswerRow(index)}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}

                      <button type="button" className="add-answer-btn" onClick={handleAddAnswerRow}>
                        + Thêm một đáp án
                      </button>
                    </div>
                  </div>
                )}

              </div>


              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="submit-btn">{editingQuestion ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TestDetail;
