import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  setCurrentUser: (c: Customer) => void;
}

const CustomerLogin: React.FC<Props> = ({ setView, customers, setCurrentUser }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('전화번호와 비밀번호를 입력해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await api.verifyCustomer(phone, password);

      if (user) {
        if (user.status === UserStatus.PENDING) {
          setError('관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.');
        } else if (user.status === UserStatus.WITHDRAWN) {
          setError('탈퇴한 계정입니다. 관리자에게 문의하세요.');
        } else {
          setCurrentUser(user);
          setView('CUSTOMER_DASHBOARD');
        }
      } else {
        setError('전화번호 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('로그인 실패:', err);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
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
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="비밀번호"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button fullWidth onClick={handleLogin} disabled={isLoading} className="mt-4">
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>

      <p className="text-center text-sm text-gray-500 mt-6">
        비밀번호를 잊으셨나요?{' '}
        <span className="text-navy-800">관리자에게 문의하세요</span>
      </p>
    </div>
  );
};

export default CustomerLogin;
