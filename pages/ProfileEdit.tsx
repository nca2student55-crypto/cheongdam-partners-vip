
import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input, Card, AlertModal, AlertModalState, initialAlertState } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  user: Customer;
  onUpdateCustomer: (c: Customer) => void;
  onLogout: () => void;
}

const ProfileEdit: React.FC<Props> = ({ setView, user, onUpdateCustomer, onLogout }) => {
  const [company, setCompany] = useState(user.company);
  const [isIndividual, setIsIndividual] = useState(user.isIndividual);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // 문의 모달 상태
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryField, setInquiryField] = useState<'name' | 'phone'>('name');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // AlertModal 상태
  const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertState);

  const showAlert = (type: AlertModalState['type'], title: string, message: string, callback?: () => void) => {
    setAlertModal({ isOpen: true, type, title, message });
    if (callback) {
      setTimeout(callback, 1500);
    }
  };

  const closeAlert = () => {
    setAlertModal(initialAlertState);
  };

  const handleSave = () => {
    onUpdateCustomer({
      ...user,
      company: isIndividual ? '' : company,
      isIndividual
    });
    showAlert('success', '저장 완료', '정보가 수정되었습니다.');
    setTimeout(() => setView('CUSTOMER_DASHBOARD'), 1500);
  };

  const handleWithdraw = async () => {
    const updatedUser = {
      ...user,
      status: UserStatus.WITHDRAWN,
      withdrawnAt: new Date().toISOString()
    };
    onUpdateCustomer(updatedUser);

    // 관리자 알림 생성
    try {
      await api.createWithdrawalNotification(updatedUser);
    } catch (error) {
      console.error('탈퇴 알림 생성 실패:', error);
    }

    setShowWithdrawModal(false);
    showAlert('success', '탈퇴 완료', '회원 탈퇴 처리가 완료되었습니다.');
    setTimeout(() => onLogout(), 1500);
  };

  // 문의 클릭 핸들러
  const handleInquiryClick = (field: 'name' | 'phone') => {
    setInquiryField(field);
    setShowInquiryModal(true);
  };

  // 문의 제출 핸들러
  const handleSubmitInquiry = async () => {
    setIsSubmittingInquiry(true);
    try {
      const currentValue = inquiryField === 'name' ? user.name : user.phone;
      await api.createProfileChangeInquiry(user.id, inquiryField, currentValue);
      setShowInquiryModal(false);
      showAlert('success', '문의 완료', '관리자에게 문의가 전달되었습니다.\n확인 후 연락드리겠습니다.');
    } catch (error) {
      console.error('문의 생성 실패:', error);
      showAlert('error', '문의 실패', '문의 접수에 실패했습니다.\n다시 시도해주세요.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b flex items-center space-x-4 bg-white sticky top-0 z-10">
        <button onClick={() => setView('CUSTOMER_DASHBOARD')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="font-bold text-navy-800">내 정보 수정</span>
      </header>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <Input label="이름" value={user.name} disabled className="bg-gray-100 text-gray-500" />
            <p className="text-xs text-gray-500 mt-[-8px] mb-2">
              수정이 필요하신가요?{' '}
              <button
                onClick={() => handleInquiryClick('name')}
                className="text-navy-800 font-medium hover:underline"
              >
                관리자 문의
              </button>
            </p>
          </div>
          <div>
            <Input label="전화번호" value={user.phone} disabled className="bg-gray-100 text-gray-500" />
            <p className="text-xs text-gray-500 mt-[-8px] mb-2">
              수정이 필요하신가요?{' '}
              <button
                onClick={() => handleInquiryClick('phone')}
                className="text-navy-800 font-medium hover:underline"
              >
                관리자 문의
              </button>
            </p>
          </div>
          <div>
            <Input
              label="업체명"
              value={company}
              onChange={e => setCompany(e.target.value)}
              disabled={isIndividual}
            />
            <label className="flex items-center space-x-2 text-sm text-gray-600 mt-[-8px]">
              <input
                type="checkbox"
                checked={isIndividual}
                onChange={e => setIsIndividual(e.target.checked)}
              />
              <span>개인입니다</span>
            </label>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <Button fullWidth onClick={handleSave}>저장</Button>
          <Button fullWidth variant="secondary" onClick={onLogout}>로그아웃</Button>
        </div>

        <div className="pt-10 border-t flex justify-center">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="text-gray-400 text-xs underline hover:text-red-500"
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <Card className="p-6 text-center space-y-4">
            <h3 className="font-bold text-navy-800">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-gray-500">탈퇴 시 모든 포인트 및 이용 내역이 소멸되며 재가입 시 복구가 불가능합니다.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>취소</Button>
              <Button variant="danger" onClick={handleWithdraw}>탈퇴하기</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <Card className="p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-navy-800 text-lg">정보 수정 문의</h3>
            <p className="text-sm text-gray-600">
              <strong>{inquiryField === 'name' ? '이름' : '전화번호'}</strong> 수정을 관리자에게 문의하시겠습니까?
            </p>
            <p className="text-xs text-gray-500">
              현재 값: {inquiryField === 'name' ? user.name : user.phone}
            </p>
            <p className="text-xs text-gray-400">
              문의 접수 후 관리자가 직접 연락드립니다.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowInquiryModal(false)} disabled={isSubmittingInquiry}>
                취소
              </Button>
              <Button onClick={handleSubmitInquiry} disabled={isSubmittingInquiry}>
                {isSubmittingInquiry ? '접수 중...' : '문의하기'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </div>
  );
};

export default ProfileEdit;
