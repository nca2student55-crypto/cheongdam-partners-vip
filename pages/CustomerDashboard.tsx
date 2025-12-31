
import React, { useState, useEffect } from 'react';
import { ViewState, Customer, Notification, Announcement } from '../types';
import { Card, Button } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  user: Customer;
  totalCount: number;
  notifications: Notification[];
}

const CustomerDashboard: React.FC<Props> = ({ setView, user, totalCount, notifications }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">정말 나가시겠습니까?</h3>
              <p className="text-sm text-gray-500">나가시면 자동으로 로그아웃됩니다.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowLogoutModal(false)}
              >
                취소
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => setView('MAIN')}
              >
                나가기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-navy-800 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <button onClick={() => setShowLogoutModal(true)} className="p-2 hover:bg-navy-700 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-bold tracking-tight">청담 파침침IP</h1>
        <button onClick={() => setView('NOTIFICATIONS')} className="relative p-2 hover:bg-navy-700 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-navy-800">
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* Registration Info */}
        <div className="text-center p-4 bg-navy-50 rounded-2xl border border-navy-100">
          <div className="text-sm text-navy-800 font-medium opacity-70">총 등록 고객</div>
          <div className="text-3xl font-bold text-navy-800 mt-1">{totalCount}명</div>
        </div>

        {/* Info Card */}
        <Card className="divide-y">
          <div className="p-4 bg-gray-50/50">
            <h3 className="text-sm font-bold text-navy-800">내 정보</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">이름</span>
              <span className="font-semibold text-gray-800">{user.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">전화번호</span>
              <span className="font-semibold text-gray-800">{user.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">업체</span>
              <span className="font-semibold text-gray-800">{user.isIndividual ? '개인' : user.company}</span>
            </div>
          </div>
        </Card>

        {/* Points Card */}
        <Card className="border-gold-400 bg-gradient-to-br from-white to-gold-50 shadow-md">
          <div className="p-5 flex flex-col items-center text-center space-y-4">
            <div className="text-sm font-bold text-navy-800">내 포인트</div>
            <div className="text-4xl font-black text-navy-800">
              {user.totalPoints.toLocaleString()} <span className="text-lg font-bold">P</span>
            </div>
            <button
              onClick={() => setView('POINT_HISTORY')}
              className="text-xs font-semibold text-navy-800 flex items-center space-x-1 hover:underline"
            >
              <span>이력 보기</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </Card>

        {/* Profile Edit Card */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setView('PROFILE_EDIT')}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">내 정보 수정</div>
                <div className="text-xs text-gray-500">프로필 및 비밀번호 변경</div>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;
