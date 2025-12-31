
import React, { useState } from 'react';
import { ViewState } from '../types';
import { Button, Input, AlertModal, AlertModalState, initialAlertState } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  setIsAdmin: (v: boolean) => void;
}

const AdminLogin: React.FC<Props> = ({ setView, setIsAdmin }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // AlertModal 상태
  const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertState);

  const showAlert = (type: AlertModalState['type'], title: string, message: string) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertModal(initialAlertState);
  };

  const handleLogin = async () => {
    if (!password) {
      showAlert('warning', '입력 필요', '비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 고정 계정 'admin'으로 비밀번호만 확인
      const admin = await api.verifyAdmin('admin', password);

      if (admin) {
        setIsAdmin(true);
        setView('ADMIN_DASHBOARD');
      } else {
        showAlert('error', '로그인 실패', '비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('관리자 로그인 실패:', err);
      showAlert('error', '오류 발생', '로그인에 실패했습니다.\n다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen flex flex-col justify-center">
      <button onClick={() => setView('MAIN')} className="text-navy-800 mb-8 absolute top-6 left-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-navy-800">관리자 로그인</h2>
        <p className="text-gray-500 mt-2">관리자 비밀번호를 입력해주세요</p>
      </div>

      <Input
        label="비밀번호"
        type="password"
        placeholder="비밀번호 입력"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button fullWidth onClick={handleLogin} disabled={isLoading} className="mt-6">
        {isLoading ? '로그인 중...' : '확인'}
      </Button>

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

export default AdminLogin;
