
import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input } from '../components/UI';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
}

const Signup: React.FC<Props> = ({ setView, customers, setCustomers }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    isIndividual: false
  });
  const [error, setError] = useState('');

  const handleSignup = () => {
    const { name, phone, password, confirmPassword, company, isIndividual } = formData;

    if (!name || !phone || !password || !confirmPassword) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (customers.some(c => c.phone.replace(/[^0-9]/g, '') === cleanPhone)) {
      setError('이미 가입된 전화번호입니다.');
      return;
    }

    const newCustomer: Customer = {
      id: `CUS_${Math.random().toString(36).substr(2, 9)}`,
      name,
      phone,
      password,
      company: isIndividual ? '' : company,
      isIndividual,
      totalPoints: 0,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString()
    };

    setCustomers([...customers, newCustomer]);
    alert('회원가입이 완료되었습니다.');
    setView('CUSTOMER_LOGIN');
  };

  return (
    <div className="p-6 min-h-screen flex flex-col pb-12">
      <button onClick={() => setView('MAIN')} className="text-navy-800 mb-6 self-start">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <h2 className="text-2xl font-bold text-navy-800 mb-6">회원가입</h2>

      <div className="space-y-2">
        <Input 
          label="고객명 *" 
          placeholder="홍길동" 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input 
          label="전화번호 *" 
          placeholder="010-0000-0000" 
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input 
          label="비밀번호 *" 
          type="password" 
          placeholder="••••••••" 
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <Input 
          label="비밀번호 확인 *" 
          type="password" 
          placeholder="••••••••" 
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        />
        
        <div className="mt-2">
          <Input 
            label="업체명" 
            placeholder="ABC 주식회사" 
            disabled={formData.isIndividual}
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
          <label className="flex items-center space-x-2 text-sm text-gray-600 mt-[-8px] mb-4">
            <input 
              type="checkbox" 
              checked={formData.isIndividual}
              onChange={(e) => setFormData({ ...formData, isIndividual: e.target.checked })}
              className="rounded border-gray-300 text-navy-800 focus:ring-navy-800"
            />
            <span>개인입니다 (업체 없음)</span>
          </label>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button fullWidth onClick={handleSignup}>
        가입하기
      </Button>
    </div>
  );
};

export default Signup;
