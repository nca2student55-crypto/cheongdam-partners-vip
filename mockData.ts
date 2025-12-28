
import { Customer, UserStatus, PointHistory, Notification } from './types';

export const initialCustomers: Customer[] = [
  {
    id: 'CUS_001',
    name: '홍길동',
    phone: '01012345678',
    password: 'password123',
    company: 'ABC 주식회사',
    isIndividual: false,
    totalPoints: 1500,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'CUS_002',
    name: '김철수',
    phone: '01023456789',
    password: 'password123',
    company: '',
    isIndividual: true,
    totalPoints: 800,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-05T14:30:00Z'
  },
  {
    id: 'CUS_003',
    name: '이영희',
    phone: '01034567890',
    password: 'password123',
    company: 'XYZ 글로벌',
    isIndividual: false,
    totalPoints: 2100,
    status: UserStatus.WITHDRAWN,
    createdAt: '2023-12-15T09:00:00Z',
    withdrawnAt: '2024-02-10T15:00:00Z'
  }
];

export const initialPointHistory: PointHistory[] = [
  { id: 'PH_001', customerId: 'CUS_001', points: 500, createdAt: '2024-01-15T14:30:00Z', isRead: true },
  { id: 'PH_002', customerId: 'CUS_001', points: 300, createdAt: '2024-01-10T10:15:00Z', isRead: true },
  { id: 'PH_003', customerId: 'CUS_001', points: 700, createdAt: '2024-01-05T16:45:00Z', isRead: true }
];

export const initialNotifications: Notification[] = [
  {
    id: 'NT_001',
    customerId: 'CUS_001',
    title: '포인트 적립 알림',
    content: '500 포인트가 적립되었습니다.',
    createdAt: '2024-01-15T14:30:00Z',
    isRead: false
  }
];
