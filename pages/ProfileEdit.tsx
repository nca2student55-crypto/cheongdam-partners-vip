
import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input, Card } from '../components/UI';

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

  const handleSave = () => {
    onUpdateCustomer({
      ...user,
      company: isIndividual ? '' : company,
      isIndividual
    });
    alert('정보가 수정되었습니다.');
    setView('CUSTOMER_DASHBOARD');
  };

  const handleWithdraw = () => {
    onUpdateCustomer({
      ...user,
      status: UserStatus.WITHDRAWN,
      withdrawnAt: new Date().toISOString()
    });
    alert('회원 탈퇴 처리가 완료되었습니다.');
    onLogout();
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
          <Input label="이름" value={user.name} disabled className="bg-gray-100 text-gray-500" />
          <Input label="전화번호" value={user.phone} disabled className="bg-gray-100 text-gray-500" />
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
    </div>
  );
};

export default ProfileEdit;
