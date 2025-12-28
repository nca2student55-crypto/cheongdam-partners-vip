
import React, { useState } from 'react';
import { ViewState } from '../types';
import { Button, Input } from '../components/UI';

interface Props {
  setView: (v: ViewState) => void;
  setIsAdmin: (v: boolean) => void;
}

const AdminLogin: React.FC<Props> = ({ setView, setIsAdmin }) => {
  const [adminId, setAdminId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (adminId === 'rkddygks0') {
      setIsAdmin(true);
      setView('ADMIN_DASHBOARD');
    } else {
      setError('관리자 ID가 일치하지 않습니다.');
    }
  };

  return (
    <div className="p-6 min-h-screen flex flex-col justify-center">
      <button onClick={() => setView('MAIN')} className="text-navy-800 mb-8 absolute top-6 left-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-navy-800">관리자 로그인</h2>
        <p className="text-gray-500 mt-2">인증 ID를 입력해주세요</p>
      </div>

      <Input 
        label="관리자 ID" 
        placeholder="아이디 입력" 
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button fullWidth onClick={handleLogin}>
        확인
      </Button>
    </div>
  );
};

export default AdminLogin;
