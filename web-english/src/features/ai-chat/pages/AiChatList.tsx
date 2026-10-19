import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { 
  getAiSessions, 
  getAiSessionMessages, 
  getAiChatStats, 
  deleteAiSession,
  type AiSession, 
  type AiMessage, 
  type AiChatStats 
} from '../api/ai-chat.api';
import { 
  MessageSquare, 
  Bot, 
  User as UserIcon, 
  Search, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  Users,
  Activity,
  ChevronRight,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import './AiChatList.css';

const AiChatList: React.FC = () => {
  // State data
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [stats, setStats] = useState<AiChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // Active session and messages
  const [selectedSession, setSelectedSession] = useState<AiSession | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'ai'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions & stats
  const fetchSessionsAndStats = async (search?: string) => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes] = await Promise.all([
        getAiSessions(search),
        getAiChatStats().catch(() => null)
      ]);

      if (sessionsRes.success) {
        setSessions(sessionsRes.data || []);
        // Tự động chọn session đầu tiên nếu chưa chọn và có dữ liệu
        if (sessionsRes.data && sessionsRes.data.length > 0 && !selectedSession) {
          openSession(sessionsRes.data[0]);
        }
      }
      if (statsRes?.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu AI Chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessionsAndStats(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openSession = async (session: AiSession) => {
    setSelectedSession(session);
    setChatSearch('');
    setRoleFilter('all');
    try {
      setLoadingMessages(true);
      const res = await getAiSessionMessages(session.id);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn hội thoại:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên hội thoại này không? Toàn bộ tin nhắn liên quan sẽ bị xóa.')) {
      return;
    }

    try {
      const res = await deleteAiSession(sessionId);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          const remaining = sessions.filter(s => s.id !== sessionId);
          if (remaining.length > 0) {
            openSession(remaining[0]);
          } else {
            setSelectedSession(null);
            setMessages([]);
          }
        }
        // Cập nhật lại stats
        getAiChatStats().then(s => s.success && setStats(s.data)).catch(() => {});
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa hội thoại');
    }
  };

  const handleCopyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  // Lọc tin nhắn bên trong đoạn chat
  const filteredMessages = messages.filter(m => {
    if (roleFilter !== 'all' && m.sender !== roleFilter) return false;
    if (chatSearch && !m.messageText.toLowerCase().includes(chatSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="ai-chat-dashboard">
        {/* Top Header */}
        <div className="ai-chat-header-row">
          <div>
            <h2 className="ai-chat-main-title">
              <Bot className="title-icon" /> Quản lý hội thoại AI Chat
            </h2>
            <p className="ai-chat-subtitle">
              Giám sát chất lượng tương tác, trợ giảng Gemini AI và phản hồi của học viên trong thời gian thực.
            </p>
          </div>
          <button 
            className="ai-refresh-btn" 
            onClick={() => fetchSessionsAndStats(searchTerm)}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="ai-stats-grid">
          <div className="ai-stat-card card-blue">
            <div className="ai-stat-icon-wrapper">
              <MessageSquare size={22} />
            </div>
            <div className="ai-stat-info">
              <div className="ai-stat-value">{stats ? stats.totalSessions : sessions.length}</div>
              <div className="ai-stat-label">Tổng số phiên hội thoại</div>
            </div>
          </div>

          <div className="ai-stat-card card-purple">
            <div className="ai-stat-icon-wrapper">
              <Bot size={22} />
            </div>
            <div className="ai-stat-info">
              <div className="ai-stat-value">{stats ? stats.totalMessages : '...'}</div>
              <div className="ai-stat-label">Tổng tin nhắn trao đổi</div>
            </div>
          </div>

          <div className="ai-stat-card card-emerald">
            <div className="ai-stat-icon-wrapper">
              <Users size={22} />
            </div>
            <div className="ai-stat-info">
              <div className="ai-stat-value">{stats ? stats.activeUsers : '...'}</div>
              <div className="ai-stat-label">Học viên sử dụng AI</div>
            </div>
          </div>

          <div className="ai-stat-card card-amber">
            <div className="ai-stat-icon-wrapper">
              <Activity size={22} />
            </div>
            <div className="ai-stat-info">
              <div className="ai-stat-value">{stats ? `${stats.avgMessagesPerSession} tin` : '...'}</div>
              <div className="ai-stat-label">Trung bình tin / phiên</div>
            </div>
          </div>
        </div>

        {/* Master - Detail Workspace */}
        <div className="ai-chat-workspace">
          {/* LEFT: Session List Master */}
          <div className="ai-sessions-sidebar">
            <div className="sidebar-search-box">
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Tìm kiếm học viên, email, chủ đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm('')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sidebar-count-bar">
              <span>Danh sách hội thoại ({sessions.length})</span>
            </div>

            <div className="ai-sessions-list-scroll">
              {loading && sessions.length === 0 ? (
                <div className="sidebar-loading">
                  <RefreshCw size={24} className="spinning" color="#3b82f6" />
                  <p>Đang tải danh sách hội thoại...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="sidebar-empty">
                  <AlertCircle size={32} color="#cbd5e1" />
                  <p>Không tìm thấy phiên hội thoại nào</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  const latestMsg = session.messages && session.messages.length > 0 ? session.messages[0] : null;

                  return (
                    <div 
                      key={session.id}
                      className={`session-card-item ${isSelected ? 'active' : ''}`}
                      onClick={() => openSession(session)}
                    >
                      <div className="session-avatar-col">
                        <div className="session-avatar">
                          {session.user?.username ? session.user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        {session.user?.cefrLevel && (
                          <span className="cefr-badge">{session.user.cefrLevel}</span>
                        )}
                      </div>

                      <div className="session-card-main">
                        <div className="session-card-top">
                          <span className="student-username" title={session.user?.email}>
                            {session.user?.username || session.user?.email || 'Học viên'}
                          </span>
                          <span className="session-time">
                            {new Date(session.startedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="session-card-title">
                          {session.title || 'Hội thoại tiếng Anh cùng AI'}
                        </div>

                        {latestMsg && (
                          <div className="session-latest-msg">
                            <span className="sender-tag">{latestMsg.sender === 'user' ? 'Học viên:' : 'AI:'}</span>{' '}
                            {latestMsg.messageText}
                          </div>
                        )}

                        <div className="session-card-footer">
                          <span className="msg-count-pill">
                            <MessageSquare size={12} /> {session._count?.messages || 0} tin nhắn
                          </span>
                          <button 
                            className="delete-session-btn"
                            title="Xóa phiên này"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Conversation Detail */}
          <div className="ai-chat-main-pane">
            {selectedSession ? (
              <div className="active-chat-container">
                {/* Chat Pane Topbar */}
                <div className="chat-pane-header">
                  <div className="chat-header-user-info">
                    <div className="chat-header-avatar">
                      {selectedSession.user?.username ? selectedSession.user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="chat-header-name">
                        {selectedSession.user?.username || selectedSession.user?.email}
                        {selectedSession.user?.cefrLevel && (
                          <span className="header-cefr-pill">Trình độ: {selectedSession.user.cefrLevel}</span>
                        )}
                      </div>
                      <div className="chat-header-sub">
                        <span>{selectedSession.user?.email}</span> &bull; 
                        <span>Bắt đầu lúc: {new Date(selectedSession.startedAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="chat-header-actions">
                    <button 
                      className="chat-action-btn delete-btn" 
                      onClick={(e) => handleDeleteSession(e, selectedSession.id)}
                      title="Xóa phiên hội thoại"
                    >
                      <Trash2 size={16} />
                      <span>Xóa hội thoại</span>
                    </button>
                  </div>
                </div>

                {/* In-chat Controls Bar */}
                <div className="in-chat-controls">
                  <div className="in-chat-search">
                    <Search size={15} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm nội dung tin nhắn..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                    />
                    {chatSearch && (
                      <button onClick={() => setChatSearch('')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="in-chat-filter-pills">
                    <button 
                      className={`filter-pill ${roleFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setRoleFilter('all')}
                    >
                      Tất cả ({messages.length})
                    </button>
                    <button 
                      className={`filter-pill ${roleFilter === 'user' ? 'active' : ''}`}
                      onClick={() => setRoleFilter('user')}
                    >
                      <UserIcon size={12} /> Học viên
                    </button>
                    <button 
                      className={`filter-pill ${roleFilter === 'ai' ? 'active' : ''}`}
                      onClick={() => setRoleFilter('ai')}
                    >
                      <Bot size={12} /> Gemini AI
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="chat-messages-viewport">
                  {loadingMessages ? (
                    <div className="chat-messages-loading">
                      <RefreshCw size={28} className="spinning" color="#3b82f6" />
                      <p>Đang tải chi tiết các tin nhắn...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="chat-messages-empty">
                      <Sparkles size={36} color="#cbd5e1" />
                      <p>{chatSearch ? 'Không tìm thấy tin nhắn khớp với từ khóa tìm kiếm.' : 'Phiên này chưa có tin nhắn nào.'}</p>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div 
                          key={msg.id} 
                          className={`message-bubble-row ${isUser ? 'user-row' : 'ai-row'}`}
                        >
                          <div className={`message-avatar ${isUser ? 'avatar-user' : 'avatar-ai'}`}>
                            {isUser ? <UserIcon size={16} /> : <Bot size={18} />}
                          </div>

                          <div className="message-content-wrapper">
                            <div className="message-header-line">
                              <span className="message-sender-name">
                                {isUser ? (selectedSession.user?.username || 'Học viên') : 'Gemini AI Assistant'}
                              </span>
                              <span className="message-timestamp">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>

                            <div className="message-bubble-body">
                              {msg.messageText}
                            </div>

                            <div className="message-footer-actions">
                              <button 
                                className="copy-msg-btn"
                                onClick={() => handleCopyMessage(msg.id, msg.messageText)}
                                title="Sao chép nội dung tin nhắn"
                              >
                                {copiedId === msg.id ? (
                                  <><Check size={12} color="#16a34a" /> <span style={{ color: '#16a34a' }}>Đã chép</span></>
                                ) : (
                                  <><Copy size={12} /> <span>Sao chép</span></>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              <div className="chat-unselected-pane">
                <div className="unselected-content">
                  <div className="unselected-icon-circle">
                    <Bot size={48} color="#3b82f6" />
                  </div>
                  <h3>Chọn một cuộc hội thoại</h3>
                  <p>Chọn bất kỳ phiên chat nào từ danh sách bên trái để theo dõi lịch sử trao đổi, hỏi đáp từ vựng & ngữ pháp giữa học viên và AI.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AiChatList;
