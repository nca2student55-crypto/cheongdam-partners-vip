
export enum UserStatus {
  PENDING = '대기',
  ACTIVE = '활성',
  WITHDRAWN = '탈퇴'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  password?: string;
  company: string;
  isIndividual: boolean;
  totalPoints: number;
  status: UserStatus;
  memo?: string;
  createdAt: string;
  withdrawnAt?: string;
}

export interface PointHistory {
  id: string;
  customerId: string;
  points: number;
  type?: 'earn' | 'use' | 'adjust';
  reason?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  customerId: string;
  title: string;
  content: string;
  type?: 'system' | 'message' | 'announcement';
  createdAt: string;
  isRead: boolean;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  name?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  expiresAt?: string;
}

export type ViewState =
  | 'MAIN'
  | 'CUSTOMER_LOGIN'
  | 'SIGNUP'
  | 'ADMIN_LOGIN'
  | 'ADMIN_DASHBOARD'
  | 'CUSTOMER_DASHBOARD'
  | 'PASSWORD_RESET'
  | 'POINT_HISTORY'
  | 'PROFILE_EDIT'
  | 'NOTIFICATIONS'
  | 'CUSTOMER_ANNOUNCEMENTS';

// 회원가입 단계
export type SignupStep = 'TERMS' | 'FORM';

// 문의 타입
export type InquiryType = 'profile_change' | 'password_reset';
export type InquiryStatus = 'pending' | 'resolved';

export interface InquiryContent {
  field?: 'name' | 'phone';  // profile_change용
  currentValue?: string;
  name?: string;             // password_reset용
  phone?: string;
}

export interface Inquiry {
  id: string;
  customerId: string | null;
  type: InquiryType;
  content: InquiryContent;
  status: InquiryStatus;
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

// 관리자 알림 타입
export type AdminNotificationType = 'new_signup' | 'inquiry' | 'withdrawal';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  referenceType: 'customer' | 'inquiry';
  referenceId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
