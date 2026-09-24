import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Gamepad2Icon, Save } from 'lucide-react';
import { fetchGames, updateGameSettings } from '../api/game.api';
import '../../courses/pages/CourseList.css'; 

const GameList: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [settingsForm, setSettingsForm] = useState<any[]>([
    { difficulty: 'EASY', itemCount: 6, pointsPerItem: 10, timeLimit: 60 },
    { difficulty: 'NORMAL', itemCount: 10, pointsPerItem: 15, timeLimit: 45 },
    { difficulty: 'HARD', itemCount: 15, pointsPerItem: 20, timeLimit: 30 },
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
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (game: any, gameId: number) => {
    setActiveGameId(gameId);
    if (game.settings && game.settings.length > 0) {
      const newSettings = ['EASY', 'NORMAL', 'HARD'].map(diff => {
        const existing = game.settings.find((s: any) => s.difficulty === diff);
        return existing ? { ...existing } : settingsForm.find((s: any) => s.difficulty === diff);
      });
      setSettingsForm(newSettings as any);
    } else {
      // Default reset if no settings
      setSettingsForm([
        { difficulty: 'EASY', itemCount: 6, pointsPerItem: 10, timeLimit: 60 },
        { difficulty: 'NORMAL', itemCount: 10, pointsPerItem: 15, timeLimit: 45 },
        { difficulty: 'HARD', itemCount: 15, pointsPerItem: 20, timeLimit: 30 },
      ]);
    }
  };

  const handleSettingChange = (difficulty: string, field: string, value: number) => {
    setSettingsForm(prev => prev.map(s => {
      if (s.difficulty === difficulty) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleSaveSettings = async () => {
    if (!activeGameId) return;
    setSaving(true);
    try {
      await updateGameSettings(activeGameId, settingsForm);
      alert('Cập nhật cấu hình Game thành công!');
      loadGames();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const renderDifficultyForm = (diffLabel: string, difficulty: string) => {
    const s = settingsForm.find(x => x.difficulty === difficulty);
    if (!s) return null;
    return (
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>Cấp độ: {diffLabel}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>Số lượng câu hỏi (từ vựng)</label>
            <input 
              type="number" 
              min={1}
              value={s.itemCount} 
              onChange={e => handleSettingChange(difficulty, 'itemCount', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>Điểm / 1 Câu</label>
            <input 
              type="number" 
              min={0}
              value={s.pointsPerItem} 
              onChange={e => handleSettingChange(difficulty, 'pointsPerItem', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>Thời gian (giây)</label>
            <input 
              type="number" 
              min={0}
              value={s.timeLimit || 0} 
              onChange={e => handleSettingChange(difficulty, 'timeLimit', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const activeGame = games.find(g => g.id === activeGameId);

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main" style={{ padding: '20px' }}>
          <div className="course-list-header" style={{ marginBottom: '20px' }}>
            <h2><Gamepad2Icon style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Quản lý Game</h2>
            <p style={{ color: '#64748b', marginTop: '5px' }}>Thiết lập luật chơi, số lượng câu hỏi và điểm số cho từng Game.</p>
          </div>

          {loading && games.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              
              {/* TABS HEADER */}
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', padding: '0 20px', gap: '5px' }}>
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleTabChange(game, game.id)}
                    style={{
                      padding: '15px 25px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeGameId === game.id ? '2px solid #3b82f6' : '2px solid transparent',
                      marginBottom: '-2px',
                      fontSize: '15px',
                      fontWeight: activeGameId === game.id ? 'bold' : '500',
                      color: activeGameId === game.id ? '#3b82f6' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {game.name}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              {activeGame && (
                <div style={{ padding: '30px' }}>
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Cấu hình: {activeGame.name}</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                      Mô tả: {activeGame.description} <br/>
                      *Hệ thống sẽ tự động lấy từ vựng trong Kho theo <b>Cấp độ CEFR của Người chơi</b> để đưa vào làm câu hỏi.
                    </p>
                  </div>

                  {renderDifficultyForm('Dễ (Easy)', 'EASY')}
                  {renderDifficultyForm('Trung Bình (Normal)', 'NORMAL')}
                  {renderDifficultyForm('Khó (Hard)', 'HARD')}

                  <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSaveSettings}
                      disabled={saving}
                      style={{ 
                        background: '#16a34a', 
                        color: 'white', 
                        padding: '10px 24px', 
                        border: 'none', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}
                    >
                      <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
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
