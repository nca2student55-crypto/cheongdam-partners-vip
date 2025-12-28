
import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input } from '../components/UI';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  setCurrentUser: (c: Customer) => void;
}

const CustomerLogin: React.FC<Props> = ({ setView, customers, setCurrentUser }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const user = customers.find(c => c.phone.replace(/[^0-9]/g, '') === cleanPhone && c.password === password);
    
    if (user) {
      if (user.status === UserStatus.WITHDRAWN) {
        setError('탈퇴한 계정입니다. 관리자에게 문의하세요.');
      } else {
        setCurrentUser(user);
        setView('CUSTOMER_DASHBOARD');
      }
    } else {
      setError('전화번호 또는 비밀번호가 일치하지 않습니다.');
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

      <Button fullWidth onClick={handleLogin} className="mt-4">
        로그인
      </Button>

      <button 
        onClick={() => setView('PASSWORD_RESET')}
        className="mt-6 text-gray-500 text-sm hover:text-navy-800 transition-colors"
      >
        비밀번호를 잊으셨나요?
      </button>
    </div>
  );
};

export default CustomerLogin;
