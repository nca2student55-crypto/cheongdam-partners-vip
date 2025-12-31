
import React, { useState } from 'react';
import { ViewState } from '../types';
import { Button, Input } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  setIsAdmin: (v: boolean) => void;
}

const AdminLogin: React.FC<Props> = ({ setView, setIsAdmin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 고정 계정 'admin'으로 비밀번호만 확인
      const admin = await api.verifyAdmin('admin', password);

      if (admin) {
        setIsAdmin(true);
        setView('ADMIN_DASHBOARD');
      } else {
        setError('비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('관리자 로그인 실패:', err);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
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

      {error && <p className="text-red-500 text-sm mt-4 mb-4">{error}</p>}

      <Button fullWidth onClick={handleLogin} disabled={isLoading} className="mt-6">
        {isLoading ? '로그인 중...' : '확인'}
      </Button>
    </div>
  );
};

export default AdminLogin;
