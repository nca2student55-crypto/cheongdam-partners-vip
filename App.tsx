
import React, { useState, useEffect } from 'react';
import { ViewState, Customer, PointHistory, Notification, Announcement } from './types';
import { api, isApiAvailable, toCustomer, toNotification, toAnnouncement } from './api/client';
import { supabase } from './api/supabase';

// Pages
import MainScreen from './pages/Main';
import CustomerLogin from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import PasswordReset from './pages/PasswordReset';
import PointHistoryView from './pages/PointHistory';
import ProfileEdit from './pages/ProfileEdit';
import NotificationList from './pages/NotificationList';
import CustomerAnnouncements from './pages/CustomerAnnouncements';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('MAIN');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [data, activeAnnouncements] = await Promise.all([
        api.getAllData(),
        api.getActiveAnnouncements(),
      ]);
      setCustomers(data.customers);
      setPointHistory(data.pointHistory);
      setNotifications(data.notifications);
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // Supabase 연결 실패 시 빈 배열로 시작
      setCustomers([]);
      setPointHistory([]);
      setNotifications([]);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase Realtime 구독 - 실시간 데이터 동기화
  useEffect(() => {
    if (isLoading || !isApiAvailable()) return;

    // customers 테이블 구독
    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers(prev => [toCustomer(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = toCustomer(payload.new);
            setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
            if (currentUser?.id === updated.id) setCurrentUser(updated);
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => prev.filter(c => c.id !== (payload.old as any).id));
          }
        }
      ).subscribe();

    // notifications 테이블 구독
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [toNotification(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = toNotification(payload.new);
            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
          }
        }
      ).subscribe();

    // announcements 테이블 구독
    const announcementsChannel = supabase
      .channel('announcements-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAnn = toAnnouncement(payload.new);
            if (newAnn.isActive) setAnnouncements(prev => [newAnn, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = toAnnouncement(payload.new);
            setAnnouncements(prev => {
              if (!updated.isActive) return prev.filter(a => a.id !== updated.id);
              const exists = prev.some(a => a.id === updated.id);
              if (!exists) return [updated, ...prev];
              return prev.map(a => a.id === updated.id ? updated : a);
            });
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => prev.filter(a => a.id !== (payload.old as any).id));
          }
        }
      ).subscribe();

    // point_history 테이블 구독
    const pointHistoryChannel = supabase
      .channel('point-history-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'point_history' },
        (payload) => {
          const newHistory = {
            id: payload.new.id,
            customerId: payload.new.customer_id,
            points: payload.new.points,
            type: payload.new.type as 'earn' | 'use' | 'adjust',
            reason: payload.new.reason || '',
            createdAt: payload.new.created_at,
          };
          setPointHistory(prev => [newHistory, ...prev]);
        }
      ).subscribe();

    // Cleanup: 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(pointHistoryChannel);
    };
  }, [isLoading, currentUser?.id]);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('MAIN');
  };

  const updateCustomer = async (updated: Customer) => {
    try {
      await api.updateCustomer(updated);
      const next = customers.map(c => c.id === updated.id ? updated : c);
      setCustomers(next);
      if (currentUser?.id === updated.id) setCurrentUser(updated);
    } catch (error) {
      console.error('고객 정보 업데이트 실패:', error);
    }
  };

  const addPointToCustomer = async (ids: string[], amount: number) => {
    try {
      const result = await api.addPoints(ids, amount);
      const updatedCustomers = customers.map(c => {
        const updated = result.customers.find(uc => uc.id === c.id);
        return updated || c;
      });
      setCustomers(updatedCustomers);
      setPointHistory([...pointHistory, ...result.pointHistory]);
      setNotifications([...notifications, ...result.notifications]);
    } catch (error) {
      console.error('포인트 적립 실패:', error);
    }
  };

  const deductPointFromCustomer = async (ids: string[], amount: number, reason: string) => {
    try {
      const result = await api.deductPoints(ids, amount, reason);
      const updatedCustomers = customers.map(c => {
        const updated = result.customers.find(uc => uc.id === c.id);
        return updated || c;
      });
      setCustomers(updatedCustomers);
      setPointHistory([...pointHistory, ...result.pointHistory]);
      setNotifications([...notifications, ...result.notifications]);
    } catch (error) {
      console.error('포인트 차감 실패:', error);
      throw error;
    }
  };

  const deletePointHistory = (id: string) => {
    setPointHistory(prev => prev.filter(h => h.id !== id));
  };

  const deleteCustomer = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      const next = customers.filter(c => c.id !== id);
      setCustomers(next);
    } catch (error) {
      console.error('고객 삭제 실패:', error);
    }
  };

  const handleSetCustomers = async (newCustomers: Customer[]) => {
    const addedCustomer = newCustomers.find(nc => !customers.some(c => c.id === nc.id));
    if (addedCustomer) {
      try {
        await api.addCustomer(addedCustomer);
      } catch (error) {
        console.error('고객 추가 실패:', error);
      }
    }
    setCustomers(newCustomers);
  };

  const handleSetNotifications = async (nList: Notification[]) => {
    const others = notifications.filter(n => n.customerId !== currentUser?.id);
    const next = [...others, ...nList];
    for (const notification of nList) {
      const original = notifications.find(n => n.id === notification.id);
      if (original && original.isRead !== notification.isRead) {
        try {
          await api.updateNotification(notification);
        } catch (error) {
          console.error('알림 업데이트 실패:', error);
        }
      }
    }
    setNotifications(next);
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy-900 to-navy-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
            <p className="text-gold-400">로딩 중...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'MAIN':
        return <MainScreen setView={setView} />;
      case 'CUSTOMER_LOGIN':
        return <CustomerLogin setView={setView} customers={customers} setCurrentUser={setCurrentUser} />;
      case 'SIGNUP':
        return <Signup setView={setView} customers={customers} setCustomers={handleSetCustomers} />;
      case 'ADMIN_LOGIN':
        return <AdminLogin setView={setView} setIsAdmin={setIsAdmin} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard
          customers={customers}
          onAddPoints={addPointToCustomer}
          onDeductPoints={deductPointFromCustomer}
          onUpdateCustomer={updateCustomer}
          onDeleteCustomer={deleteCustomer}
          handleLogout={handleLogout}
        />;
      case 'CUSTOMER_DASHBOARD':
        return <CustomerDashboard
          setView={setView}
          user={currentUser!}
          totalCount={customers.length}
          notifications={notifications.filter(n => n.customerId === currentUser?.id)}
          announcements={announcements}
        />;
      case 'PASSWORD_RESET':
        return <PasswordReset setView={setView} customers={customers} onUpdateCustomer={updateCustomer} />;
      case 'POINT_HISTORY':
        return <PointHistoryView
          setView={setView}
          user={currentUser!}
          history={pointHistory.filter(h => h.customerId === currentUser?.id)}
          onDeleteHistory={deletePointHistory}
        />;
      case 'PROFILE_EDIT':
        return <ProfileEdit
          setView={setView}
          user={currentUser!}
          onUpdateCustomer={updateCustomer}
          onLogout={handleLogout}
        />;
      case 'NOTIFICATIONS':
        return <NotificationList
          setView={setView}
          user={currentUser!}
          notifications={notifications.filter(n => n.customerId === currentUser?.id)}
          setNotifications={handleSetNotifications}
        />;
      case 'CUSTOMER_ANNOUNCEMENTS':
        return <CustomerAnnouncements setView={setView} />;
      default:
        return <MainScreen setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-xl overflow-x-hidden relative">
      {renderView()}
    </div>
  );
};

export default App;
