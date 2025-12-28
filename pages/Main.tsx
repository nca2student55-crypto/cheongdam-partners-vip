
import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/UI';

interface Props {
  setView: (v: ViewState) => void;
}

const MainScreen: React.FC<Props> = ({ setView }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-12">
      <Button
        variant="ghost"
        onClick={() => setView('ADMIN_LOGIN')}
        className="absolute top-4 right-4"
      >
        관리자
      </Button>

      <div className="space-y-4">
        <div className="w-24 h-24 bg-navy-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3">
          <span className="text-gold-400 text-4xl font-bold">VIP</span>
        </div>
        <h1 className="text-3xl font-bold text-navy-800">청담 파트너 VIP</h1>
        <p className="text-gray-500">프리미엄 고객 관리 솔루션</p>
      </div>

      <div className="w-full space-y-4">
        <Button fullWidth variant="primary" onClick={() => setView('CUSTOMER_LOGIN')}>
          로그인
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setView('SIGNUP')}>
          회원가입
        </Button>
      </div>
    </div>
  );
};

export default MainScreen;
