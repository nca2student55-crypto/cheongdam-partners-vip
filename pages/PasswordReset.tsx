
import React, { useState } from 'react';
import { ViewState, Customer } from '../types';
import { Button, Input } from '../components/UI';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  onUpdateCustomer: (c: Customer) => void;
}

const PasswordReset: React.FC<Props> = ({ setView, customers, onUpdateCustomer }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: input phone, 2: input otp, 3: reset pw
  const [targetUser, setTargetUser] = useState<Customer | null>(null);

  const handleSendOtp = () => {
    const user = customers.find(c => c.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''));
    if (user) {
      setTargetUser(user);
      alert('인증번호(123456)가 발송되었습니다.');
      setStep(2);
    } else {
      alert('등록되지 않은 전화번호입니다.');
    }
  };

  const handleVerifyOtp = () => {
    if (otp === '123456') {
      setStep(3);
    } else {
      alert('인증번호가 일치하지 않습니다.');
    }
  };

  const handleResetPassword = () => {
    if (newPassword.length < 4) {
      alert('비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (targetUser) {
      onUpdateCustomer({ ...targetUser, password: newPassword });
      alert('비밀번호가 변경되었습니다.');
      setView('CUSTOMER_LOGIN');
    }
  };

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <button onClick={() => setView('CUSTOMER_LOGIN')} className="text-navy-800 mb-8 self-start">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <h2 className="text-2xl font-bold text-navy-800 mb-8">비밀번호 찾기</h2>

      {step === 1 && (
        <div className="space-y-4">
          <Input label="등록된 전화번호" placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
          <Button fullWidth onClick={handleSendOtp}>인증번호 발송</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Input label="인증번호 입력" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} />
          <Button fullWidth onClick={handleVerifyOtp}>확인</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Input label="새 비밀번호" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <Input label="새 비밀번호 확인" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <Button fullWidth onClick={handleResetPassword}>비밀번호 변경</Button>
        </div>
      )}
    </div>
  );
};

export default PasswordReset;
