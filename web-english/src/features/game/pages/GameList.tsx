import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Gamepad2Icon, Save, Info, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { fetchGames, updateGameSettings } from '../api/game.api';
import { useToast } from '../../../context/ToastContext';
import '../../courses/pages/CourseList.css'; 

interface GameMeta {
  itemCountLabel: string;
  itemCountHelp: string;
  pointsLabel: string;
  penaltyLabel: string;
  timeLabel: string;
  speedBonusNote?: string;
  hasPenalty: boolean;
  gameTip: string;
}

const GAME_METAS: Record<string, GameMeta> = {
  BUBBLE: {
    itemCountLabel: 'Số cặp từ bóng bay',
    itemCountHelp: 'Số cặp bóng từ và nghĩa sẽ xuất hiện lần lượt trên màn hình.',
    pointsLabel: '+ Điểm nổ mỗi cặp bóng đúng',
    penaltyLabel: '- Điểm trừ khi chạm sai 2 bóng',
    timeLabel: 'Mốc thời gian thưởng tốc độ (giây)',
    speedBonusNote: 'Cơ chế tính điểm: Khi hoàn thành trước mốc thời gian này, người chơi nhận thêm Điểm thưởng tốc độ = (Thời gian mốc - Thời gian chơi) × 2 điểm.',
    hasPenalty: true,
    gameTip: 'Bóng bay từ vựng rèn luyện phản xạ nhanh. Người chơi chọn 1 bóng chữ tiếng Anh và 1 bóng nghĩa tiếng Việt tương ứng.'
  },
  MEMORY: {
    itemCountLabel: 'Số cặp thẻ (1 cặp = 2 thẻ)',
    itemCountHelp: 'VD: 6 cặp tương đương 12 ô thẻ bí mật trên bàn cờ lật.',
    pointsLabel: '+ Điểm lật trúng cặp thẻ',
    penaltyLabel: '- Điểm trừ khi lật sai cặp thẻ',
    timeLabel: 'Thời gian giới hạn ván chơi (giây)',
    hasPenalty: true,
    gameTip: 'Thẻ nhớ ma thuật rèn luyện trí nhớ. Người chơi lật mở 2 thẻ, nếu khớp sẽ giữ mở và cộng điểm, nếu sai sẽ úp lại và trừ điểm nhẹ.'
  },
  MATCHING: {
    itemCountLabel: 'Số từ nối (Cột A & Cột B)',
    itemCountHelp: 'Số lượng từ vựng chia đều vào 2 cột để học viên kéo nối.',
    pointsLabel: '+ Điểm mỗi cặp nối đúng',
    penaltyLabel: 'Điểm trừ (Không áp dụng)',
    timeLabel: 'Thời gian giới hạn nối từ (giây)',
    hasPenalty: false,
    gameTip: 'Nối từ tuyệt đỉnh: Chỉ cộng điểm khi nối đúng cặp từ với nghĩa, không phạt điểm khi nối sai để khuyến khích học viên thử nghiệm.'
  },
  MARIO: {
    itemCountLabel: 'Số chướng ngại vật (Từ cần đọc)',
    itemCountHelp: 'Số từ vựng học viên phải đọc to phát âm để vượt qua trên đường chạy.',
    pointsLabel: '+ Điểm phát âm chuẩn (>=60%)',
    penaltyLabel: '- Điểm trừ khi bấm "Bỏ qua từ"',
    timeLabel: 'Thời gian tối đa đường chạy (giây)',
    hasPenalty: true,
    gameTip: 'Mario Phóng Thoát kết hợp AI Speech-to-Text để chấm điểm phát âm. Đọc chuẩn giúp nhân vật nhảy qua chướng ngại vật về đích an toàn.'
  }
};

const GameList: React.FC = () => {
  const { toast } = useToast();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [settingsForm, setSettingsForm] = useState<any[]>([
    { difficulty: 'EASY', itemCount: 6, pointsPerItem: 10, penaltyPoints: 2, timeLimit: 60 },
    { difficulty: 'NORMAL', itemCount: 10, pointsPerItem: 15, penaltyPoints: 5, timeLimit: 45 },
    { difficulty: 'HARD', itemCount: 15, pointsPerItem: 20, penaltyPoints: 10, timeLimit: 30 },
  ]);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await fetchGames();
      if (res.data && res.data.length > 0) {
        setGames(res.data);
        if (!activeGameId) {
          handleTabChange(res.data[0], res.data[0].id);
        } else {
          const currentGame = res.data.find((g: any) => g.id === activeGameId);
          if (currentGame) handleTabChange(currentGame, activeGameId);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải danh sách trò chơi');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (game: any, gameId: number) => {
    setActiveGameId(gameId);
    if (game.settings && game.settings.length > 0) {
      const mapped = ['EASY', 'NORMAL', 'HARD'].map(diff => {
        const found = game.settings.find((s: any) => s.difficulty === diff);
        return found ? {
          difficulty: diff,
          itemCount: found.itemCount,
          pointsPerItem: found.pointsPerItem,
          penaltyPoints: found.penaltyPoints ?? (diff === 'EASY' ? 2 : diff === 'NORMAL' ? 5 : 10),
          timeLimit: found.timeLimit
        } : {
          difficulty: diff,
          itemCount: diff === 'EASY' ? 6 : diff === 'NORMAL' ? 10 : 15,
          pointsPerItem: diff === 'EASY' ? 10 : diff === 'NORMAL' ? 15 : 20,
          penaltyPoints: diff === 'EASY' ? 2 : diff === 'NORMAL' ? 5 : 10,
          timeLimit: diff === 'EASY' ? 60 : diff === 'NORMAL' ? 45 : 30
        };
      });
      setSettingsForm(mapped);
    } else {
      setSettingsForm([
        { difficulty: 'EASY', itemCount: 6, pointsPerItem: 10, penaltyPoints: 2, timeLimit: 60 },
        { difficulty: 'NORMAL', itemCount: 10, pointsPerItem: 15, penaltyPoints: 5, timeLimit: 45 },
        { difficulty: 'HARD', itemCount: 15, pointsPerItem: 20, penaltyPoints: 10, timeLimit: 30 },
      ]);
    }
  };

  const handleSettingChange = (difficulty: string, field: string, val: number) => {
    setSettingsForm(prev => prev.map(s => {
      if (s.difficulty === difficulty) {
        return { ...s, [field]: val };
      }
      return s;
    }));
  };

  const handleSaveSettings = async () => {
    if (!activeGameId) return;
    setSaving(true);
    try {
      await updateGameSettings(activeGameId, settingsForm);
      toast.success('Cập nhật cấu hình Game thành công!');
      loadGames();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const activeGame = games.find(g => g.id === activeGameId);
  const meta: GameMeta = (activeGame && GAME_METAS[activeGame.code]) || {
    itemCountLabel: 'Số lượng câu hỏi (từ vựng)',
    itemCountHelp: 'Số lượng từ đưa vào trò chơi.',
    pointsLabel: '+ Điểm đúng / 1 Câu',
    penaltyLabel: '- Điểm trừ khi sai',
    timeLabel: 'Thời gian (giây)',
    hasPenalty: true,
    gameTip: 'Cấu hình luật chơi cho trò chơi ôn tập.'
  };

  const renderDifficultyForm = (diffLabel: string, difficulty: string, badgeBg: string, badgeColor: string) => {
    const s = settingsForm.find(x => x.difficulty === difficulty);
    if (!s) return null;
    return (
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              backgroundColor: badgeBg, 
              color: badgeColor, 
              padding: '4px 10px', 
              borderRadius: '6px', 
              fontSize: '12px', 
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>
              {difficulty}
            </span>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>Cấp độ: {diffLabel}</h4>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {/* 1. SỐ LƯỢNG */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#334155', fontWeight: '600' }}>
              {meta.itemCountLabel}
            </label>
            <input 
              type="number" 
              min={1}
              value={s.itemCount} 
              onChange={e => handleSettingChange(difficulty, 'itemCount', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '5px' }}>{meta.itemCountHelp}</span>
          </div>

          {/* 2. ĐIỂM CỘNG */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#16a34a', fontWeight: '600' }}>
              {meta.pointsLabel}
            </label>
            <input 
              type="number" 
              min={0}
              value={s.pointsPerItem} 
              onChange={e => handleSettingChange(difficulty, 'pointsPerItem', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '5px' }}>Điểm thưởng cộng vào điểm XP học viên.</span>
          </div>

          {/* 3. ĐIỂM TRỪ */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: meta.hasPenalty ? '#dc2626' : '#94a3b8', fontWeight: '600' }}>
              {meta.penaltyLabel}
            </label>
            <input 
              type="number" 
              min={0}
              disabled={!meta.hasPenalty}
              value={!meta.hasPenalty ? 0 : (s.penaltyPoints ?? 0)} 
              onChange={e => handleSettingChange(difficulty, 'penaltyPoints', parseInt(e.target.value) || 0)}
              style={{ 
                width: '100%', 
                padding: '9px 12px', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                fontSize: '14px', 
                backgroundColor: !meta.hasPenalty ? '#f1f5f9' : '#ffffff',
                cursor: !meta.hasPenalty ? 'not-allowed' : 'auto',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
              {meta.hasPenalty ? 'Trừ điểm khi làm sai (tối thiểu điểm = 0)' : 'Game này không có cơ chế phạt điểm.'}
            </span>
          </div>

          {/* 4. THỜI GIAN */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#2563eb', fontWeight: '600' }}>
              {meta.timeLabel}
            </label>
            <input 
              type="number" 
              min={0}
              value={s.timeLimit || 0} 
              onChange={e => handleSettingChange(difficulty, 'timeLimit', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '5px' }}>Đơn vị tính bằng giây (s).</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main" style={{ padding: '24px' }}>
          <div className="course-list-header" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
                <Gamepad2Icon size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Cấu hình Trò chơi Ôn tập</h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Thiết lập chi tiết số câu, thang điểm thưởng/phạt và thời gian phù hợp từng game trên Mobile.</p>
              </div>
            </div>
          </div>

          {loading && games.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu trò chơi...</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              
              {/* TABS HEADER */}
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', padding: '0 20px', gap: '8px', background: '#f8fafc', overflowX: 'auto' }}>
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleTabChange(game, game.id)}
                    style={{
                      padding: '16px 22px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeGameId === game.id ? '3px solid #2563eb' : '3px solid transparent',
                      marginBottom: '-2px',
                      fontSize: '15px',
                      fontWeight: activeGameId === game.id ? '700' : '500',
                      color: activeGameId === game.id ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Sparkles size={16} color={activeGameId === game.id ? '#2563eb' : '#94a3b8'} />
                    {game.name}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              {activeGame && (
                <div style={{ padding: '28px' }}>
                  {/* GAME BANNER & DESCRIPTION */}
                  <div style={{ 
                    marginBottom: '24px', 
                    padding: '18px 20px', 
                    backgroundColor: '#eff6ff', 
                    border: '1px solid #bfdbfe', 
                    borderRadius: '10px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Info size={20} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
                          Trò chơi: {activeGame.name} ({activeGame.code})
                        </div>
                        <div><b>Mục tiêu & Cách chơi:</b> {meta.gameTip}</div>
                        {meta.speedBonusNote && (
                          <div style={{ marginTop: '6px', color: '#0369a1', background: '#e0f2fe', padding: '6px 10px', borderRadius: '6px', fontSize: '13px' }}>
                            <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                            {meta.speedBonusNote}
                          </div>
                        )}
                        <div style={{ marginTop: '6px', color: '#475569', fontStyle: 'italic', fontSize: '13px' }}>
                          *Hệ thống tự động lọc từ vựng trong CSDL theo đúng cấp độ CEFR (A1, A2, B1, B2...) của học viên khi chơi.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 DIFFICULTY LEVELS */}
                  {renderDifficultyForm('Dễ (Easy)', 'EASY', '#dcfce7', '#16a34a')}
                  {renderDifficultyForm('Trung Bình (Normal)', 'NORMAL', '#dbeafe', '#2563eb')}
                  {renderDifficultyForm('Khó (Hard)', 'HARD', '#fee2e2', '#dc2626')}

                  {/* SAVE BUTTON */}
                  <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSaveSettings}
                      disabled={saving}
                      style={{ 
                        background: '#16a34a', 
                        color: 'white', 
                        padding: '12px 28px', 
                        border: 'none', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                      }}
                    >
                      <Save size={18} /> {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình game'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GameList;
