// Google Sheets API 클라이언트
// Google Apps Script 웹 앱 URL을 설정하세요

import { Customer, PointHistory, Notification } from '../types';

// Apps Script 웹 앱 URL (배포 후 설정)
const API_URL = import.meta.env.VITE_API_URL || '';

// 로컬 스토리지 키 (폴백용)
const STORAGE_KEYS = {
  CUSTOMERS: 'cp_customers',
  POINT_HISTORY: 'cp_point_history',
  NOTIFICATIONS: 'cp_notifications'
};

// API 사용 가능 여부 확인
export const isApiAvailable = (): boolean => {
  return !!API_URL;
};

// ===== API 호출 헬퍼 =====

async function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API Error');
  }

  return result.data;
}

async function apiPost<T>(action: string, data: any): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...data }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API Error');
  }

  return result.data;
}

// ===== 데이터 인터페이스 =====

export interface AllData {
  customers: Customer[];
  pointHistory: PointHistory[];
  notifications: Notification[];
}

export interface AddPointsResult {
  customers: Customer[];
  pointHistory: PointHistory[];
  notifications: Notification[];
}

// ===== API 함수들 =====

export const api = {
  // 모든 데이터 가져오기
  async getAllData(): Promise<AllData> {
    if (!isApiAvailable()) {
      return getLocalData();
    }

    try {
      return await apiGet<AllData>('getAllData');
    } catch (error) {
      console.error('API Error, falling back to localStorage:', error);
      return getLocalData();
    }
  },

  // === Customers ===
  async getCustomers(): Promise<Customer[]> {
    if (!isApiAvailable()) {
      return getLocalCustomers();
    }

    try {
      return await apiGet<Customer[]>('getCustomers');
    } catch (error) {
      console.error('API Error:', error);
      return getLocalCustomers();
    }
  },

  async addCustomer(customer: Customer): Promise<Customer> {
    if (!isApiAvailable()) {
      return addLocalCustomer(customer);
    }

    try {
      const result = await apiPost<Customer>('addCustomer', { data: customer });
      return result;
    } catch (error) {
      console.error('API Error:', error);
      return addLocalCustomer(customer);
    }
  },

  async updateCustomer(customer: Customer): Promise<Customer> {
    if (!isApiAvailable()) {
      return updateLocalCustomer(customer);
    }

    try {
      const result = await apiPost<Customer>('updateCustomer', { data: customer });
      return result;
    } catch (error) {
      console.error('API Error:', error);
      return updateLocalCustomer(customer);
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    if (!isApiAvailable()) {
      return deleteLocalCustomer(id);
    }

    try {
      await apiPost('deleteCustomer', { id });
    } catch (error) {
      console.error('API Error:', error);
      return deleteLocalCustomer(id);
    }
  },

  // === Point History ===
  async getPointHistory(customerId?: string): Promise<PointHistory[]> {
    if (!isApiAvailable()) {
      return getLocalPointHistory(customerId);
    }

    try {
      const params = customerId ? { customerId } : {};
      return await apiGet<PointHistory[]>('getPointHistory', params);
    } catch (error) {
      console.error('API Error:', error);
      return getLocalPointHistory(customerId);
    }
  },

  // === Notifications ===
  async getNotifications(customerId?: string): Promise<Notification[]> {
    if (!isApiAvailable()) {
      return getLocalNotifications(customerId);
    }

    try {
      const params = customerId ? { customerId } : {};
      return await apiGet<Notification[]>('getNotifications', params);
    } catch (error) {
      console.error('API Error:', error);
      return getLocalNotifications(customerId);
    }
  },

  async updateNotification(notification: Notification): Promise<Notification> {
    if (!isApiAvailable()) {
      return updateLocalNotification(notification);
    }

    try {
      const result = await apiPost<Notification>('updateNotification', { data: notification });
      return result;
    } catch (error) {
      console.error('API Error:', error);
      return updateLocalNotification(notification);
    }
  },

  // === Combined Operations ===
  async addPoints(customerIds: string[], amount: number): Promise<AddPointsResult> {
    if (!isApiAvailable()) {
      return addLocalPoints(customerIds, amount);
    }

    try {
      return await apiPost<AddPointsResult>('addPoints', { customerIds, amount });
    } catch (error) {
      console.error('API Error:', error);
      return addLocalPoints(customerIds, amount);
    }
  }
};

// ===== LocalStorage 폴백 함수들 =====

function getLocalData(): AllData {
  return {
    customers: getLocalCustomers(),
    pointHistory: getLocalPointHistory(),
    notifications: getLocalNotifications()
  };
}

function getLocalCustomers(): Customer[] {
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  return data ? JSON.parse(data) : [];
}

function addLocalCustomer(customer: Customer): Customer {
  const customers = getLocalCustomers();
  customers.push(customer);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  return customer;
}

function updateLocalCustomer(customer: Customer): Customer {
  const customers = getLocalCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index !== -1) {
    customers[index] = customer;
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }
  return customer;
}

function deleteLocalCustomer(id: string): void {
  const customers = getLocalCustomers().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

function getLocalPointHistory(customerId?: string): PointHistory[] {
  const data = localStorage.getItem(STORAGE_KEYS.POINT_HISTORY);
  const history: PointHistory[] = data ? JSON.parse(data) : [];
  return customerId ? history.filter(h => h.customerId === customerId) : history;
}

function addLocalPointHistory(history: PointHistory): PointHistory {
  const allHistory = getLocalPointHistory();
  allHistory.push(history);
  localStorage.setItem(STORAGE_KEYS.POINT_HISTORY, JSON.stringify(allHistory));
  return history;
}

function getLocalNotifications(customerId?: string): Notification[] {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  const notifications: Notification[] = data ? JSON.parse(data) : [];
  return customerId ? notifications.filter(n => n.customerId === customerId) : notifications;
}

function addLocalNotification(notification: Notification): Notification {
  const notifications = getLocalNotifications();
  notifications.push(notification);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return notification;
}

function updateLocalNotification(notification: Notification): Notification {
  const notifications = getLocalNotifications();
  const index = notifications.findIndex(n => n.id === notification.id);
  if (index !== -1) {
    notifications[index] = notification;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }
  return notification;
}

function addLocalPoints(customerIds: string[], amount: number): AddPointsResult {
  const now = new Date().toISOString();
  const result: AddPointsResult = {
    customers: [],
    pointHistory: [],
    notifications: []
  };

  const customers = getLocalCustomers();

  customerIds.forEach(customerId => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      customer.totalPoints = (customer.totalPoints || 0) + amount;
      result.customers.push(customer);

      const history: PointHistory = {
        id: `PH_${Math.random().toString(36).substr(2, 9)}`,
        customerId,
        points: amount,
        createdAt: now,
        isRead: false
      };
      addLocalPointHistory(history);
      result.pointHistory.push(history);

      const notification: Notification = {
        id: `NT_${Math.random().toString(36).substr(2, 9)}`,
        customerId,
        title: '포인트 적립',
        content: `${amount} 포인트가 적립되었습니다.`,
        createdAt: now,
        isRead: false
      };
      addLocalNotification(notification);
      result.notifications.push(notification);
    }
  });

  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

  return result;
}

export default api;
