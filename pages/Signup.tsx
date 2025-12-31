import React, { useState } from 'react';
import { ViewState, Customer, UserStatus, SignupStep } from '../types';
import { Button, Input } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
}

const Signup: React.FC<Props> = ({ setView, customers, setCustomers }) => {
  const [step, setStep] = useState<SignupStep>('TERMS');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    isIndividual: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 전화번호 정규화 (숫자만 추출 후 앞 0 제거)
  const normalizePhone = (phone: string | number): string => {
    return String(phone).replace(/[^0-9]/g, '').replace(/^0+/, '');
  };

  // 회원가입 처리
  const handleSignup = async () => {
    const { name, phone, password, confirmPassword } = formData;

    if (!name || !phone || !password || !confirmPassword) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 전화번호 중복 확인
    const normalizedInputPhone = normalizePhone(phone);
    const existingCustomer = customers.find(c => normalizePhone(c.phone) === normalizedInputPhone);

    if (existingCustomer) {
      setError('이미 가입된 전화번호입니다. 로그인을 이용해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Supabase에 고객 추가 (승인 대기 상태로 생성)
      const newCustomer = await api.addCustomer({
        name: formData.name,
        phone: formData.phone.replace(/[^0-9]/g, ''), // 숫자만 저장
        password: formData.password,
        company: formData.isIndividual ? '' : formData.company,
        isIndividual: formData.isIndividual,
        totalPoints: 0,
        status: UserStatus.PENDING,
      });

      setCustomers([...customers, newCustomer]);
      setSignupComplete(true);
    } catch (err: any) {
      console.error('회원가입 실패:', err);
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError('이미 가입된 전화번호입니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 뒤로가기 처리
  const handleBack = () => {
    if (step === 'FORM') {
      setStep('TERMS');
    } else {
      setView('MAIN');
    }
  };

  // 약관 동의 화면
  const renderTermsStep = () => (
    <div className="p-6 min-h-screen flex flex-col pb-12">
      <button onClick={handleBack} className="text-navy-800 mb-6 self-start">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <h2 className="text-2xl font-bold text-navy-800 mb-2">약관 동의</h2>
      <p className="text-gray-500 text-sm mb-6">서비스 이용을 위해 아래 내용을 확인해주세요</p>

      {/* 개인정보 수집 동의 내용 */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-6 overflow-y-auto max-h-[400px] text-sm text-gray-700 leading-relaxed">
        <h3 className="font-bold text-navy-800 mb-3">[개인정보 수집 및 이용 동의]</h3>

        <p className="mb-4">
          청담 파트너 VIP 서비스 이용을 위해 아래와 같이 개인정보를 수집 및 이용합니다.
        </p>

        <div className="mb-4">
          <p className="font-semibold text-navy-800 mb-1">1. 수집 목적</p>
          <ul className="list-disc list-inside ml-2 text-gray-600">
            <li>VIP 고객 포인트 적립 및 관리</li>
            <li>서비스 이용 관련 안내</li>
          </ul>
        </div>

        <div className="mb-4">
          <p className="font-semibold text-navy-800 mb-1">2. 수집 항목</p>
          <ul className="list-disc list-inside ml-2 text-gray-600">
            <li>필수: 이름, 휴대전화번호, 비밀번호</li>
            <li>선택: 업체명</li>
          </ul>
        </div>

        <div className="mb-4">
          <p className="font-semibold text-navy-800 mb-1">3. 보유 및 이용 기간</p>
          <ul className="list-disc list-inside ml-2 text-gray-600">
            <li>회원 탈퇴 시까지</li>
            <li>탈퇴 후 즉시 파기</li>
          </ul>
        </div>

        <div className="mb-2">
          <p className="font-semibold text-navy-800 mb-1">4. 동의 거부권 안내</p>
          <p className="ml-2 text-gray-600">
            귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.
            다만, 동의를 거부하실 경우 서비스 이용이 제한됩니다.
          </p>
        </div>
      </div>

      {/* 동의 체크박스 */}
      <label className="flex items-start space-x-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-navy-800 focus:ring-navy-800"
        />
        <span className="text-sm text-gray-700">
          위 내용을 확인하였으며, <span className="font-semibold text-navy-800">개인정보 수집 및 이용에 동의합니다.</span>
        </span>
      </label>

      {/* 다음 버튼 */}
      <Button
        fullWidth
        onClick={() => setStep('FORM')}
        disabled={!agreedToTerms}
      >
        다음으로
      </Button>

      <p className="text-center text-sm text-gray-500 mt-6">
        이미 계정이 있으신가요?{' '}
        <button
          onClick={() => setView('CUSTOMER_LOGIN')}
          className="text-navy-800 font-medium hover:underline"
        >
          로그인
        </button>
      </p>
    </div>
  );

  // 회원가입 폼 화면
  const renderFormStep = () => (
    <div className="p-6 min-h-screen flex flex-col pb-12">
      <button onClick={handleBack} className="text-navy-800 mb-6 self-start">
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
          label="비밀번호 * (4자 이상)"
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

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <Button fullWidth onClick={handleSignup} disabled={isLoading}>
        {isLoading ? '가입 중...' : '회원가입'}
      </Button>

      <p className="text-center text-sm text-gray-500 mt-6">
        이미 계정이 있으신가요?{' '}
        <button
          onClick={() => setView('CUSTOMER_LOGIN')}
          className="text-navy-800 font-medium hover:underline"
        >
          로그인
        </button>
      </p>
    </div>
  );

  // 회원가입 완료 (승인 대기) 화면
  const renderCompletionScreen = () => (
    <div className="p-6 min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        {/* 시계 아이콘 */}
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-navy-800">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-navy-800 mb-3">가입 신청 완료</h2>
        <p className="text-gray-600 mb-2">회원가입 신청이 완료되었습니다.</p>
        <p className="text-gray-500 text-sm mb-8">
          관리자 승인 후 로그인이 가능합니다.<br />
          승인까지 1-2일 소요될 수 있습니다.
        </p>

        <Button fullWidth onClick={() => setView('MAIN')}>
          메인으로 돌아가기
        </Button>
      </div>
    </div>
  );

  if (signupComplete) {
    return renderCompletionScreen();
  }

  return step === 'TERMS' ? renderTermsStep() : renderFormStep();
};

export default Signup;
