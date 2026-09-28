import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { getAiSessions, getAiSessionMessages } from '../api/ai-chat.api';
import { MessageSquare, X, User as UserIcon, Bot } from 'lucide-react';
import './AiChatList.css';

const AiChatList: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getAiSessions();
      setSessions(res.data || []);
    } catch (error) {
      console.error('Error fetching sessions', error);
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (session: any) => {
    setSelectedSession(session);
    try {
      setLoadingMessages(true);
      const res = await getAiSessionMessages(session.id);
      setMessages(res.data || []);
    } catch (error) {
      console.error('Error fetching messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const closeSession = () => {
    setSelectedSession(null);
    setMessages([]);
  };

  return (
    <AdminLayout>
      <div className="ai-chat-container">
        <h2><MessageSquare style={{ marginRight: 8, verticalAlign: 'middle' }} /> Quản lý Hội thoại AI Chat</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Xem và quản lý các đoạn chat giữa học viên và AI.</p>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Học viên</th>
                  <th>Tiêu đề</th>
                  <th>Số tin nhắn</th>
                  <th>Bắt đầu lúc</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="chat-session-row" onClick={() => openSession(session)}>
                    <td>#{session.id}</td>
                    <td>{session.user?.username || session.user?.email || 'Unknown'}</td>
                    <td>{session.title || 'Không có tiêu đề'}</td>
                    <td>{session._count?.messages || 0}</td>
                    <td>{new Date(session.startedAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>Không có cuộc hội thoại nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedSession && (
          <div className="chat-modal-overlay" onClick={closeSession}>
            <div className="chat-modal" onClick={e => e.stopPropagation()}>
              <div className="chat-modal-header">
                <h3>Chi tiết hội thoại #{selectedSession.id}</h3>
                <button onClick={closeSession} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
              </div>
              <div className="chat-modal-body">
                {loadingMessages ? (
                  <p style={{ textAlign: 'center' }}>Đang tải tin nhắn...</p>
                ) : (
                  messages.length > 0 ? messages.map((msg, idx) => (
                    <div key={idx} className={"chat-message " + (msg.sender === 'user' ? 'message-user' : 'message-bot')}>
                      <div className="message-sender">
                        {msg.sender === 'user' ? <><UserIcon size={12}/> Học viên</> : <><Bot size={12}/> AI</>}
                      </div>
                      <div className="message-text">{msg.messageText}</div>
                    </div>
                  )) : (
                    <p style={{ textAlign: 'center', color: '#94a3b8' }}>Chưa có tin nhắn nào.</p>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AiChatList;
