import React, { useState, useEffect } from 'react';
import { ViewState, Announcement } from '../types';
import { Card } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
}

const CustomerAnnouncements: React.FC<Props> = ({ setView }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.getActiveAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const pinnedAnnouncements = announcements.filter(a => a.isPinned);
  const regularAnnouncements = announcements.filter(a => !a.isPinned);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-navy-800 text-white p-4 flex items-center space-x-4 sticky top-0 z-10">
        <button onClick={() => setView('CUSTOMER_DASHBOARD')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="font-bold">공지사항</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="p-20 text-center text-gray-400">로딩 중...</div>
        ) : announcements.length === 0 ? (
          <div className="p-20 text-center text-gray-400">등록된 공지사항이 없습니다.</div>
        ) : (
          <>
            {/* 고정 공지 */}
            {pinnedAnnouncements.length > 0 && (
              <div className="space-y-3">
                {pinnedAnnouncements.map(a => (
                  <Card key={a.id} className="p-4 bg-gold-50 border-l-4 border-l-gold-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-gold-400 text-white px-2 py-0.5 rounded">중요</span>
                    </div>
                    <div className="font-bold text-navy-800 text-lg">{a.title}</div>
                    <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{a.content}</div>
                    <div className="text-xs text-gray-400 mt-3">
                      {new Date(a.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* 일반 공지 */}
            {regularAnnouncements.length > 0 && (
              <div className="space-y-3">
                {regularAnnouncements.map(a => (
                  <Card key={a.id} className="p-4">
                    <div className="font-medium text-navy-800">{a.title}</div>
                    <div className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.content}</div>
                    <div className="text-xs text-gray-400 mt-3">
                      {new Date(a.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerAnnouncements;
