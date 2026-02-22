
import React, { useEffect, useRef, useState } from 'react';
import { ViewState, Customer, Notification } from '../types';
import { Card } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  user: Customer;
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
}

const NotificationList: React.FC<Props> = ({ setView, user, notifications, setNotifications }) => {
  // 공지사항 타입 제외 (개인 알림만 표시)
  const personalNotifications = notifications.filter(n => n.type !== 'announcement');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Mark all personal notifications as read when entering
    const next = personalNotifications.map(n => ({ ...n, isRead: true }));
    setNotifications(next);
  }, []);

  const sorted = [...personalNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleLongPressStart = (id: string) => {
    longPressTimerRef.current = setTimeout(() => setDeleteTargetId(id), 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.deleteNotification(deleteTargetId);
      setNotifications(personalNotifications.filter(n => n.id !== deleteTargetId));
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-4 border-b flex items-center space-x-4 bg-white sticky top-0 z-10">
        <button onClick={() => setView('CUSTOMER_DASHBOARD')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="font-bold text-navy-800">알림</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sorted.map(n => (
          <Card
            key={n.id}
            className="p-4 relative select-none"
            onTouchStart={() => handleLongPressStart(n.id)}
            onTouchEnd={handleLongPressEnd}
            onTouchMove={handleLongPressEnd}
            onMouseDown={() => handleLongPressStart(n.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              {!n.isRead && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
            </div>
            <h4 className="font-bold text-navy-800 text-sm mb-1">{n.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{n.content}</p>
          </Card>
        ))}

        {sorted.length === 0 && (
          <div className="text-center py-20 text-gray-400">알림이 없습니다.</div>
        )}
      </div>

      {/* 삭제 확인 팝업 */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-800">알림 삭제</h3>
              <p className="text-sm text-gray-500">이 알림을 삭제하시겠습니까?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
