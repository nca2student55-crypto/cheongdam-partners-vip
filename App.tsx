
import React, { useState, useEffect } from 'react';
import { ViewState, Customer, PointHistory, Notification } from './types';
import { initialCustomers, initialPointHistory, initialNotifications } from './mockData';
import { api, isApiAvailable } from './api/client';

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
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      if (isApiAvailable()) {
        const data = await api.getAllData();
        setCustomers(data.customers.length > 0 ? data.customers : initialCustomers);
        setPointHistory(data.pointHistory.length > 0 ? data.pointHistory : initialPointHistory);
        setNotifications(data.notifications.length > 0 ? data.notifications : initialNotifications);
      } else {
        const storedCustomers = localStorage.getItem('cp_customers');
        const storedHistory = localStorage.getItem('cp_point_history');
        const storedNotifications = localStorage.getItem('cp_notifications');

        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        else {
          setCustomers(initialCustomers);
          localStorage.setItem('cp_customers', JSON.stringify(initialCustomers));
        }

        if (storedHistory) setPointHistory(JSON.parse(storedHistory));
        else {
          setPointHistory(initialPointHistory);
          localStorage.setItem('cp_point_history', JSON.stringify(initialPointHistory));
        }

        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
        else {
          setNotifications(initialNotifications);
          localStorage.setItem('cp_notifications', JSON.stringify(initialNotifications));
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      const storedCustomers = localStorage.getItem('cp_customers');
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      else setCustomers(initialCustomers);
    } finally {
      setIsLoading(false);
    }
  };

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
      if (!isApiAvailable()) {
        localStorage.setItem('cp_customers', JSON.stringify(next));
      }
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
      if (!isApiAvailable()) {
        localStorage.setItem('cp_customers', JSON.stringify(updatedCustomers));
        localStorage.setItem('cp_point_history', JSON.stringify([...pointHistory, ...result.pointHistory]));
        localStorage.setItem('cp_notifications', JSON.stringify([...notifications, ...result.notifications]));
      }
    } catch (error) {
      console.error('포인트 적립 실패:', error);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      const next = customers.filter(c => c.id !== id);
      setCustomers(next);
      if (!isApiAvailable()) {
        localStorage.setItem('cp_customers', JSON.stringify(next));
      }
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
    if (!isApiAvailable()) {
      localStorage.setItem('cp_customers', JSON.stringify(newCustomers));
    }
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
    if (!isApiAvailable()) {
      localStorage.setItem('cp_notifications', JSON.stringify(next));
    }
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
          setView={setView}
          customers={customers}
          onAddPoints={addPointToCustomer}
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
        />;
      case 'PASSWORD_RESET':
        return <PasswordReset setView={setView} customers={customers} onUpdateCustomer={updateCustomer} />;
      case 'POINT_HISTORY':
        return <PointHistoryView
          setView={setView}
          user={currentUser!}
          history={pointHistory.filter(h => h.customerId === currentUser?.id)}
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
