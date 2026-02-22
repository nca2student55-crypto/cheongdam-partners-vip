
import React, { useRef, useState } from 'react';
import { ViewState, Customer, PointHistory } from '../types';
import { Card } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  user: Customer;
  history: PointHistory[];
  onDeleteHistory: (id: string) => void;
}

const PointHistoryView: React.FC<Props> = ({ setView, user, history, onDeleteHistory }) => {
  const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      await api.deletePointHistory(deleteTargetId);
      onDeleteHistory(deleteTargetId);
    } catch (error) {
      console.error('포인트 이력 삭제 실패:', error);
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-navy-800 text-white p-4 flex items-center space-x-4 sticky top-0 z-10">
        <button onClick={() => setView('CUSTOMER_DASHBOARD')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="font-bold">포인트 이력</span>
      </header>

      <div className="p-6 bg-navy-900 text-white mb-4">
        <div className="text-xs opacity-60">총 보유 포인트</div>
        <div className="text-3xl font-bold mt-1">{user.totalPoints.toLocaleString()} P</div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-3">
        {sortedHistory.map(item => {
          const isPositive = item.points > 0;
          const pointLabel = item.type === 'earn' ? '포인트 적립' :
                            item.type === 'use' ? '포인트 사용' :
                            item.type === 'adjust' ? (isPositive ? '포인트 조정' : '포인트 차감') :
                            '포인트 변동';

          return (
            <Card
              key={item.id}
              className={`p-4 border-l-4 select-none ${isPositive ? 'border-l-green-400' : 'border-l-red-400'}`}
              onTouchStart={() => handleLongPressStart(item.id)}
              onTouchEnd={handleLongPressEnd}
              onTouchMove={handleLongPressEnd}
              onMouseDown={() => handleLongPressStart(item.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </div>
                  <div className="text-sm font-medium text-gray-700">{pointLabel}</div>
                  {item.reason && (
                    <div className="text-xs text-gray-500 mt-1">사유: {item.reason}</div>
                  )}
                </div>
                <div className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{item.points.toLocaleString()} P
                </div>
              </div>
            </Card>
          );
        })}

        {sortedHistory.length === 0 && (
          <div className="text-center py-20 text-gray-400">포인트 이력이 없습니다.</div>
        )}
      </div>

      {/* 삭제 확인 팝업 */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-800">이력 삭제</h3>
              <p className="text-sm text-gray-500">이 포인트 이력을 삭제하시겠습니까?</p>
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

export default PointHistoryView;
