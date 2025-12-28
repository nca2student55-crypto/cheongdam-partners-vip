
export enum UserStatus {
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
  createdAt: string;
  withdrawnAt?: string;
}

export interface PointHistory {
  id: string;
  customerId: string;
  points: number;
  createdAt: string;
  isRead: boolean;
  message?: string;
}

export interface Notification {
  id: string;
  customerId: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
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
  | 'NOTIFICATIONS';
