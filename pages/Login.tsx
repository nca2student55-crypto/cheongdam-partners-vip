import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input, Card, AlertModal, AlertModalState, initialAlertState } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  setCurrentUser: (c: Customer) => void;
}

const CustomerLogin: React.FC<Props> = ({ setView, customers, setCurrentUser }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 비밀번호 찾기 문의 모달 상태
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [resetName, setResetName] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // AlertModal 상태
  const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertState);

  const showAlert = (type: AlertModalState['type'], title: string, message: string) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertModal(initialAlertState);
  };

  // 비밀번호 찾기 문의 핸들러
  const handleOpenPasswordResetModal = () => {
    setResetName('');
    setResetPhone('');
    setShowPasswordResetModal(true);
  };

  const handleSubmitPasswordResetInquiry = async () => {
    if (!resetName.trim() || !resetPhone.trim()) {
      showAlert('warning', '입력 필요', '이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      await api.createPasswordResetInquiry(resetName.trim(), resetPhone.trim());
      setShowPasswordResetModal(false);
      showAlert('success', '문의 완료', '비밀번호 재설정 문의가 접수되었습니다.\n관리자 확인 후 연락드리겠습니다.');
    } catch (error) {
      console.error('비밀번호 찾기 문의 실패:', error);
      showAlert('error', '문의 실패', '문의 접수에 실패했습니다.\n다시 시도해주세요.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      showAlert('warning', '입력 필요', '전화번호와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await api.verifyCustomer(phone, password);

      if (user) {
        if (user.status === UserStatus.PENDING) {
          showAlert('info', '승인 대기', '관리자 승인 대기 중입니다.\n승인 후 로그인이 가능합니다.');
        } else if (user.status === UserStatus.WITHDRAWN) {
          showAlert('error', '탈퇴 계정', '탈퇴한 계정입니다.\n관리자에게 문의하세요.');
        } else {
          setCurrentUser(user);
          setView('CUSTOMER_DASHBOARD');
        }
      } else {
        showAlert('error', '로그인 실패', '전화번호 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('로그인 실패:', err);
      showAlert('error', '오류 발생', '로그인에 실패했습니다.\n다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <button onClick={() => setView('MAIN')} className="text-navy-800 mb-8 self-start">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <h2 className="text-2xl font-bold text-navy-800 mb-8">로그인</h2>

      <div className="space-y-2">
        <Input
          label="휴대전화 번호"
          placeholder="번호를 입력해주세요."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해주세요."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button fullWidth onClick={handleLogin} disabled={isLoading} className="mt-4">
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>

      <p className="text-center text-sm text-gray-500 mt-6">
        비밀번호를 잊으셨나요?{' '}
        <button
          onClick={handleOpenPasswordResetModal}
          className="text-navy-800 font-medium hover:underline"
        >
          관리자에게 문의하세요
        </button>
      </p>

      {/* Password Reset Inquiry Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <Card className="p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-navy-800 text-lg">비밀번호 찾기</h3>
            <p className="text-sm text-gray-600">
              가입 시 등록한 정보를 입력해주세요.
            </p>
            <div className="space-y-3">
              <Input
                label="이름"
                placeholder="홍길동"
                value={resetName}
                onChange={(e) => setResetName(e.target.value)}
              />
              <Input
                label="전화번호"
                placeholder="010-0000-0000"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400">
              문의 접수 후 관리자가 직접 연락드립니다.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowPasswordResetModal(false)} disabled={isSubmittingInquiry}>
                취소
              </Button>
              <Button onClick={handleSubmitPasswordResetInquiry} disabled={isSubmittingInquiry}>
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

export default CustomerLogin;
