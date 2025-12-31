// Supabase API 클라이언트

import { supabase } from './supabase';
import { Customer, PointHistory, Notification, Admin, UserStatus, Announcement, Inquiry, InquiryContent, AdminNotification, AdminNotificationType } from '../types';

// ===== 헬퍼 함수: DB ↔ Frontend 변환 =====

// DB row → Customer
export function toCustomer(row: any): Customer {
  let status: UserStatus;
  switch (row.status) {
    case 'active':
      status = UserStatus.ACTIVE;
      break;
    case 'pending':
      status = UserStatus.PENDING;
      break;
    case 'withdrawn':
    default:
      status = UserStatus.WITHDRAWN;
  }
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    password: row.password,
    company: row.company || '',
    isIndividual: row.is_individual,
    totalPoints: row.total_points || 0,
    status,
    memo: row.memo,
    createdAt: row.created_at,
    withdrawnAt: row.withdrawn_at,
  };
}

// Customer → DB row
function fromCustomer(customer: Customer): any {
  let status: string;
  switch (customer.status) {
    case UserStatus.ACTIVE:
      status = 'active';
      break;
    case UserStatus.PENDING:
      status = 'pending';
      break;
    case UserStatus.WITHDRAWN:
    default:
      status = 'withdrawn';
  }
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    password: customer.password,
    company: customer.company,
    is_individual: customer.isIndividual,
    total_points: customer.totalPoints,
    status,
    memo: customer.memo,
    created_at: customer.createdAt,
    withdrawn_at: customer.withdrawnAt,
  };
}

// DB row → PointHistory
function toPointHistory(row: any): PointHistory {
  return {
    id: row.id,
    customerId: row.customer_id,
    points: row.points,
    type: row.type,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

// DB row → Notification
export function toNotification(row: any): Notification {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    content: row.content,
    type: row.type || 'system',
    createdAt: row.created_at,
    isRead: row.is_read,
  };
}

// DB row → Admin
function toAdmin(row: any): Admin {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    name: row.name,
    createdAt: row.created_at,
  };
}

// DB row → Announcement
export function toAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isActive: row.is_active,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

// DB row → Inquiry
function toInquiry(row: any): Inquiry {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    content: row.content,
    status: row.status,
    adminNote: row.admin_note,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

// DB row → AdminNotification
export function toAdminNotification(row: any): AdminNotification {
  return {
    id: row.id,
    type: row.type,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    title: row.title,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
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

// API 사용 가능 여부 (항상 true - Supabase 사용)
export const isApiAvailable = (): boolean => true;

// ===== API 함수들 =====

export const api = {
  // 모든 데이터 가져오기
  async getAllData(): Promise<AllData> {
    const [customersRes, historyRes, notificationsRes] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('point_history').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ]);

    return {
      customers: (customersRes.data || []).map(toCustomer),
      pointHistory: (historyRes.data || []).map(toPointHistory),
      notifications: (notificationsRes.data || []).map(toNotification),
    };
  },

  // === Customers ===
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCustomer);
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    let status: string;
    switch (customer.status) {
      case UserStatus.ACTIVE:
        status = 'active';
        break;
      case UserStatus.PENDING:
        status = 'pending';
        break;
      case UserStatus.WITHDRAWN:
      default:
        status = 'withdrawn';
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customer.name,
        phone: customer.phone,
        password: customer.password,
        company: customer.company,
        is_individual: customer.isIndividual,
        total_points: customer.totalPoints || 0,
        status,
        memo: customer.memo,
      })
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },

  async updateCustomer(customer: Customer): Promise<Customer> {
    let status: string;
    switch (customer.status) {
      case UserStatus.ACTIVE:
        status = 'active';
        break;
      case UserStatus.PENDING:
        status = 'pending';
        break;
      case UserStatus.WITHDRAWN:
      default:
        status = 'withdrawn';
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        phone: customer.phone,
        password: customer.password,
        company: customer.company,
        is_individual: customer.isIndividual,
        total_points: customer.totalPoints,
        status,
        memo: customer.memo,
        withdrawn_at: customer.withdrawnAt,
      })
      .eq('id', customer.id)
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // === Point History ===
  async getPointHistory(customerId?: string): Promise<PointHistory[]> {
    let query = supabase
      .from('point_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toPointHistory);
  },

  // === Notifications ===
  async getNotifications(customerId?: string): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toNotification);
  },

  async updateNotification(notification: Notification): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: notification.isRead,
      })
      .eq('id', notification.id)
      .select()
      .single();

    if (error) throw error;
    return toNotification(data);
  },

  // === Combined Operations ===
  async addPoints(customerIds: string[], amount: number): Promise<AddPointsResult> {
    const now = new Date().toISOString();
    const result: AddPointsResult = {
      customers: [],
      pointHistory: [],
      notifications: [],
    };

    for (const customerId of customerIds) {
      // 1. 고객 포인트 업데이트
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('total_points')
        .eq('id', customerId)
        .single();

      if (customerError) continue;

      const newPoints = (customerData.total_points || 0) + amount;

      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ total_points: newPoints })
        .eq('id', customerId)
        .select()
        .single();

      if (updateError) continue;
      result.customers.push(toCustomer(updatedCustomer));

      // 2. 포인트 이력 추가
      const { data: historyData, error: historyError } = await supabase
        .from('point_history')
        .insert({
          customer_id: customerId,
          points: amount,
          type: 'earn',
        })
        .select()
        .single();

      if (!historyError && historyData) {
        result.pointHistory.push(toPointHistory(historyData));
      }

      // 3. 알림 추가
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          customer_id: customerId,
          title: '포인트 적립',
          content: `${amount.toLocaleString()} 포인트가 적립되었습니다.`,
          is_read: false,
        })
        .select()
        .single();

      if (!notificationError && notificationData) {
        result.notifications.push(toNotification(notificationData));
      }
    }

    return result;
  },

  // === Admin ===
  async getAdminByUsername(username: string): Promise<Admin | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) return null;
    return toAdmin(data);
  },

  async verifyAdmin(username: string, password: string): Promise<Admin | null> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return null;
    if (admin.password !== password) return null;
    return admin;
  },

  // === Customer Auth ===
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    // 전화번호 정규화 (숫자만 추출)
    const normalizedPhone = phone.replace(/[^0-9]/g, '');

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`phone.eq.${normalizedPhone},phone.eq.0${normalizedPhone}`)
      .single();

    if (error || !data) return null;
    return toCustomer(data);
  },

  async verifyCustomer(phone: string, password: string): Promise<Customer | null> {
    const normalizedPhone = phone.replace(/[^0-9]/g, '');

    // 전화번호로 고객 조회 (앞에 0이 있는 경우와 없는 경우 모두 처리)
    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error || !data) return null;

    // 전화번호 정규화해서 비교
    const customer = data.find(c => {
      const dbPhone = String(c.phone).replace(/[^0-9]/g, '').replace(/^0+/, '');
      const inputPhone = normalizedPhone.replace(/^0+/, '');
      return dbPhone === inputPhone && c.password === password;
    });

    if (!customer) return null;
    return toCustomer(customer);
  },

  // === Password Reset (Admin only) ===
  async resetCustomerPassword(customerId: string, newPassword: string): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ password: newPassword })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },

  // === Pending Customer Approval ===
  async getPendingCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(toCustomer);
  },

  async approveCustomer(customerId: string): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ status: 'active' })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },

  async approveCustomers(customerIds: string[]): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .update({ status: 'active' })
      .in('id', customerIds)
      .select();

    if (error) throw error;
    return (data || []).map(toCustomer);
  },

  // === Point Deduction ===
  async deductPoints(customerIds: string[], amount: number, reason: string): Promise<AddPointsResult> {
    const result: AddPointsResult = {
      customers: [],
      pointHistory: [],
      notifications: [],
    };

    for (const customerId of customerIds) {
      // 1. 고객 현재 포인트 조회
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('total_points')
        .eq('id', customerId)
        .single();

      if (customerError) continue;

      const currentPoints = customerData.total_points || 0;
      const newPoints = Math.max(0, currentPoints - amount); // 음수 방지

      // 2. 고객 포인트 업데이트
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ total_points: newPoints })
        .eq('id', customerId)
        .select()
        .single();

      if (updateError) continue;
      result.customers.push(toCustomer(updatedCustomer));

      // 3. 포인트 이력 추가 (음수 값으로 기록)
      const { data: historyData, error: historyError } = await supabase
        .from('point_history')
        .insert({
          customer_id: customerId,
          points: -amount,
          type: 'adjust',
          reason: reason,
        })
        .select()
        .single();

      if (!historyError && historyData) {
        result.pointHistory.push(toPointHistory(historyData));
      }

      // 4. 알림 추가
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          customer_id: customerId,
          title: '포인트 차감',
          content: `${amount.toLocaleString()} 포인트가 차감되었습니다. (사유: ${reason})`,
          is_read: false,
        })
        .select()
        .single();

      if (!notificationError && notificationData) {
        result.notifications.push(toNotification(notificationData));
      }
    }

    return result;
  },

  // === Message Sending ===
  async sendMessage(customerIds: string[], title: string, content: string): Promise<{ notifications: Notification[]; successCount: number }> {
    const result: { notifications: Notification[]; successCount: number } = {
      notifications: [],
      successCount: 0,
    };

    for (const customerId of customerIds) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          customer_id: customerId,
          title: title,
          content: content,
          type: 'message',
          is_read: false,
        })
        .select()
        .single();

      if (!error && data) {
        result.notifications.push(toNotification(data));
        result.successCount++;
      }
    }

    return result;
  },

  // 전체 고객에게 메시지 발송
  async sendMessageToAll(title: string, content: string): Promise<{ notifications: Notification[]; successCount: number }> {
    // 활성 고객만 조회
    const { data: activeCustomers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('status', 'active');

    if (customerError || !activeCustomers) {
      return { notifications: [], successCount: 0 };
    }

    const customerIds = activeCustomers.map(c => c.id);
    return this.sendMessage(customerIds, title, content);
  },

  // === Announcements ===
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toAnnouncement);
  },

  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toAnnouncement);
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: announcement.title,
        content: announcement.content,
        is_active: announcement.isActive,
        is_pinned: announcement.isPinned,
        expires_at: announcement.expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return toAnnouncement(data);
  },

  async updateAnnouncement(announcement: Announcement): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        title: announcement.title,
        content: announcement.content,
        is_active: announcement.isActive,
        is_pinned: announcement.isPinned,
        expires_at: announcement.expiresAt,
      })
      .eq('id', announcement.id)
      .select()
      .single();

    if (error) throw error;
    return toAnnouncement(data);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== Inquiries (고객 문의) =====

  // 프로필 수정 문의 생성
  async createProfileChangeInquiry(customerId: string, field: 'name' | 'phone', currentValue: string): Promise<Inquiry> {
    const content: InquiryContent = { field, currentValue };

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        customer_id: customerId,
        type: 'profile_change',
        content,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    const inquiry = toInquiry(data);

    // 관리자 알림 자동 생성
    const fieldLabel = field === 'name' ? '이름' : '전화번호';
    await this.createAdminNotification(
      'inquiry',
      'inquiry',
      inquiry.id,
      `[정보 수정] ${fieldLabel} 변경 문의`,
      `${fieldLabel} 수정 문의가 접수되었습니다. (현재: ${currentValue})`
    );

    return inquiry;
  },

  // 비밀번호 찾기 문의 생성
  async createPasswordResetInquiry(name: string, phone: string): Promise<Inquiry> {
    const content: InquiryContent = { name, phone };

    // 해당 전화번호로 고객 조회
    const customer = await this.getCustomerByPhone(phone);

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        customer_id: customer?.id || null,
        type: 'password_reset',
        content,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    const inquiry = toInquiry(data);

    // 관리자 알림 자동 생성
    await this.createAdminNotification(
      'inquiry',
      'inquiry',
      inquiry.id,
      '[비밀번호 찾기] 문의',
      `${name}(${phone}) 고객의 비밀번호 찾기 문의입니다.`
    );

    return inquiry;
  },

  // 문의 목록 조회 (관리자용)
  async getInquiries(status?: string): Promise<Inquiry[]> {
    let query = supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toInquiry);
  },

  // 문의 상태 업데이트 (관리자용)
  async resolveInquiry(inquiryId: string, adminNote?: string): Promise<Inquiry> {
    const { data, error } = await supabase
      .from('inquiries')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq('id', inquiryId)
      .select()
      .single();

    if (error) throw error;
    return toInquiry(data);
  },

  // ===== Admin Notifications (관리자 알림) =====

  // 관리자 알림 생성
  async createAdminNotification(
    type: AdminNotificationType,
    referenceType: 'customer' | 'inquiry',
    referenceId: string,
    title: string,
    content: string
  ): Promise<AdminNotification> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({
        type,
        reference_type: referenceType,
        reference_id: referenceId,
        title,
        content,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return toAdminNotification(data);
  },

  // 신규 가입 알림 생성
  async createSignupNotification(customer: Customer): Promise<AdminNotification> {
    return this.createAdminNotification(
      'new_signup',
      'customer',
      customer.id,
      '신규 가입 신청',
      `${customer.name}(${customer.phone}) 고객이 가입을 신청했습니다.`
    );
  },

  // 탈퇴 알림 생성
  async createWithdrawalNotification(customer: Customer): Promise<AdminNotification> {
    return this.createAdminNotification(
      'withdrawal',
      'customer',
      customer.id,
      '회원 탈퇴',
      `${customer.name}(${customer.phone}) 고객이 탈퇴했습니다.`
    );
  },

  // 관리자 알림 목록 조회
  async getAdminNotifications(unreadOnly: boolean = false): Promise<AdminNotification[]> {
    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toAdminNotification);
  },

  // 읽지 않은 알림 수 조회
  async getUnreadAdminNotificationCount(): Promise<number> {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // 알림 읽음 처리
  async markAdminNotificationAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  },

  // 모든 알림 읽음 처리
  async markAllAdminNotificationsAsRead(): Promise<void> {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);
  },
};

export default api;
