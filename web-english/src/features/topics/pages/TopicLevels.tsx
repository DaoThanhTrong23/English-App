import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { getTopicSettings, updateTopicSettings } from '../../settings/api/settings.api';
import { 
  Sliders, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  BookOpen, 
  TrendingUp, 
  Award, 
  RotateCcw, 
  Plus, 
  Minus, 
  Info, 
  Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../courses/pages/CourseList.css';

interface LevelGroupConfig {
  key: string;
  badgeText: string;
  cefr: string;
  title: string;
  subtitle: string;
  description: string;
  defaultVal: number;
  tags: string[];
  themeColor: string;
  themeBg: string;
  lightBorder: string;
  icon: React.ComponentType<{ size: number; color?: string; style?: React.CSSProperties }>;
}

const LEVEL_GROUPS: LevelGroupConfig[] = [
  {
    key: 'A1-A2',
    badgeText: 'DỄ',
    cefr: 'A1 - A2',
    title: 'Cấp độ Dễ',
    subtitle: 'Dành cho người mới bắt đầu',
    description: 'Chủ đề giao tiếp cơ bản, từ vựng sinh hoạt hàng ngày giúp học viên xây dựng nền tảng vững chắc.',
    defaultVal: 5,
    tags: ['Chào hỏi', 'Bản thân', 'Gia đình', 'Số đếm', 'Sinh hoạt'],
    themeColor: '#2563eb',
    themeBg: '#eff6ff',
    lightBorder: '#bfdbfe',
    icon: BookOpen
  },
  {
    key: 'B1-B2',
    badgeText: 'TRUNG BÌNH',
    cefr: 'B1 - B2',
    title: 'Cấp độ Trung bình',
    subtitle: 'Giao tiếp hàng ngày & công sở',
    description: 'Mở rộng phạm vi từ vựng và chủ đề thảo luận về đời sống, công nghệ, công việc và du lịch.',
    defaultVal: 7,
    tags: ['Công việc', 'Du lịch', 'Công nghệ', 'Kỹ năng', 'Giải trí'],
    themeColor: '#059669',
    themeBg: '#ecfdf5',
    lightBorder: '#a7f3d0',
    icon: TrendingUp
  },
  {
    key: 'C1-C2',
    badgeText: 'KHÓ',
    cefr: 'C1 - C2',
    title: 'Cấp độ Khó',
    subtitle: 'Thành thạo & Chuyên sâu',
    description: 'Chủ đề học thuật chuyên ngành, bài học mang tính phân tích, học thuật và trừu tượng cao.',
    defaultVal: 10,
    tags: ['Kinh tế', 'Học thuật', 'Triết học', 'Luận văn', 'Quốc tế'],
    themeColor: '#ea580c',
    themeBg: '#fff7ed',
    lightBorder: '#fed7aa',
    icon: Award
  }
];

const TopicLevels: React.FC = () => {
  const navigate = useNavigate();
  const [topicLimits, setTopicLimits] = useState<{
    defaultLimit: number;
    groups: Record<string, number>;
  }>({
    defaultLimit: 7,
    groups: { 'A1-A2': 5, 'B1-B2': 7, 'C1-C2': 10 }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getTopicSettings();
      if (res.data) {
        setTopicLimits({
          defaultLimit: Number(res.data.defaultLimit) || 7,
          groups: {
            'A1-A2': Number(res.data.groups?.['A1-A2']) || Number(res.data.levels?.A1) || 5,
            'B1-B2': Number(res.data.groups?.['B1-B2']) || Number(res.data.levels?.B1) || 7,
            'C1-C2': Number(res.data.groups?.['C1-C2']) || Number(res.data.levels?.C1) || 10,
          }
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải cấu hình chủ đề:', err);
      setMessage({ type: 'error', text: 'Không thể tải cấu hình từ máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCount = (key: string, delta: number) => {
    setTopicLimits(prev => {
      const current = prev.groups[key] ?? 7;
      const next = Math.max(1, Math.min(50, current + delta));
      return {
        ...prev,
        groups: { ...prev.groups, [key]: next }
      };
    });
  };

  const handleInputChange = (key: string, valStr: string) => {
    const val = parseInt(valStr);
    const safeVal = isNaN(val) ? 1 : Math.max(1, Math.min(50, val));
    setTopicLimits(prev => ({
      ...prev,
      groups: { ...prev.groups, [key]: safeVal }
    }));
  };

  const handleResetDefaults = () => {
    setTopicLimits(prev => ({
      ...prev,
      groups: {
        'A1-A2': 5,
        'B1-B2': 7,
        'C1-C2': 10
      }
    }));
    setMessage({ type: 'success', text: 'Đã đặt lại các giá trị đề xuất mặc định (5, 7, 10).' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await updateTopicSettings({
        defaultLimit: topicLimits.defaultLimit,
        groups: topicLimits.groups
      });
      if (res.data) {
        setTopicLimits(prev => ({
          defaultLimit: res.data.defaultLimit ?? prev.defaultLimit,
          groups: res.data.groups ?? prev.groups
        }));
      }
      setMessage({ type: 'success', text: 'Đã lưu cấu hình số lượng chủ đề cho 3 cấp độ thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main" style={{ maxWidth: '1060px', margin: '0 auto', padding: '24px 20px' }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button 
                onClick={() => navigate('/admin/topics')}
                style={{
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
                title="Quay lại danh sách chủ đề"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sliders size={24} color="#2563eb" /> Cài đặt chủ đề theo cấp độ
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                  Tùy chỉnh số lượng chủ đề hiển thị tương ứng với 3 mức độ bài kiểm tra đầu vào trên ứng dụng di động.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleResetDefaults}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  background: 'white',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <RotateCcw size={15} />
                Mặc định
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                }}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </div>

          {/* Alert Message */}
          {message.text && (
            <div style={{ 
              padding: '12px 18px', 
              borderRadius: '10px', 
              marginBottom: '22px', 
              backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', 
              color: message.type === 'error' ? '#b91c1c' : '#15803d',
              border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}`,
              fontWeight: 500,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              {message.text}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ fontSize: '1rem', fontWeight: 500 }}>Đang tải dữ liệu cấu hình...</div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* 3 Level Cards Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', 
                gap: '22px', 
                marginBottom: '26px' 
              }}>
                {LEVEL_GROUPS.map((lvl) => {
                  const IconComponent = lvl.icon;
                  const currentVal = topicLimits.groups[lvl.key] ?? lvl.defaultVal;

                  return (
                    <div 
                      key={lvl.key}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      {/* Top Accent Strip */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        backgroundColor: lvl.themeColor
                      }} />

                      <div>
                        {/* Header Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: '0.8rem',
                            color: lvl.themeColor,
                            background: lvl.themeBg,
                            border: `1px solid ${lvl.lightBorder}`,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            letterSpacing: '0.5px'
                          }}>
                            {lvl.badgeText}
                          </span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '0.8rem', 
                              color: '#475569', 
                              fontWeight: 700,
                              background: '#f1f5f9',
                              padding: '3px 9px',
                              borderRadius: '6px'
                            }}>
                              {lvl.cefr}
                            </span>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: lvl.themeBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <IconComponent size={18} color={lvl.themeColor} />
                            </div>
                          </div>
                        </div>

                        {/* Card Title & Desc */}
                        <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.15rem', fontWeight: 700 }}>
                          {lvl.title}
                        </h3>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: lvl.themeColor, marginBottom: '8px' }}>
                          {lvl.subtitle}
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
                          {lvl.description}
                        </p>

                        {/* Sample Topic Tags */}
                        <div style={{ marginBottom: '20px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                            Chủ đề tiêu biểu:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {lvl.tags.map((tag, idx) => (
                              <span 
                                key={idx}
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#334155',
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 500
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stepper Input Section */}
                      <div style={{ 
                        background: '#f8fafc', 
                        border: '1px solid #f1f5f9', 
                        borderRadius: '12px', 
                        padding: '16px',
                        marginTop: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                            Số lượng chủ đề hiển thị:
                          </label>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Gợi ý: <strong>{lvl.defaultVal}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Decrement Button */}
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(lvl.key, -1)}
                            disabled={currentVal <= 1}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: currentVal <= 1 ? '#f1f5f9' : 'white',
                              color: currentVal <= 1 ? '#cbd5e1' : '#334155',
                              cursor: currentVal <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                            title="Giảm 1 chủ đề"
                          >
                            <Minus size={16} />
                          </button>

                          {/* Number Input */}
                          <input 
                            type="number"
                            min={1}
                            max={50}
                            value={currentVal}
                            onChange={(e) => handleInputChange(lvl.key, e.target.value)}
                            style={{
                              flex: 1,
                              height: '38px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '1.15rem',
                              fontWeight: 700,
                              color: '#0f172a',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              outline: 'none',
                              background: 'white'
                            }}
                            required
                          />

                          {/* Increment Button */}
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(lvl.key, 1)}
                            disabled={currentVal >= 50}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: currentVal >= 50 ? '#f1f5f9' : 'white',
                              color: currentVal >= 50 ? '#cbd5e1' : '#334155',
                              cursor: currentVal >= 50 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                            title="Tăng 1 chủ đề"
                          >
                            <Plus size={16} />
                          </button>

                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, minWidth: '45px' }}>
                            chủ đề
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Information Note Card */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <Info size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem', marginBottom: '2px' }}>
                    Quy tắc phân bổ chủ đề học tập
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#15803d', lineHeight: 1.5 }}>
                    Học viên bắt buộc phải hoàn thành bài kiểm tra phân loại trình độ trước khi vào học. Hệ thống sẽ tự động chỉ định số lượng chủ đề hiển thị ở trang chủ tương ứng đúng với 1 trong 3 nhóm cấp độ trên mà học viên đạt được.
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center',
                gap: '12px',
                background: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={16} />
                  Khôi phục mặc định
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                  }}
                >
                  <Save size={18} />
                  {saving ? 'Đang lưu cài đặt...' : 'Lưu cài đặt'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TopicLevels;
