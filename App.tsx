
import React, { useState, useEffect } from 'react';
import { ViewState, Customer, UserStatus, PointHistory, Notification } from './types';
import { initialCustomers, initialPointHistory, initialNotifications } from './mockData';

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

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('MAIN');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Persistence (Mocking Google Sheets with LocalStorage)
  useEffect(() => {
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
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('MAIN');
  };

  const updateCustomer = (updated: Customer) => {
    const next = customers.map(c => c.id === updated.id ? updated : c);
    setCustomers(next);
    saveToStorage('cp_customers', next);
    if (currentUser?.id === updated.id) setCurrentUser(updated);
  };

  const addPointToCustomer = (ids: string[], amount: number) => {
    const now = new Date().toISOString();
    
    // Update customers
    const updatedCustomers = customers.map(c => {
      if (ids.includes(c.id)) {
        return { ...c, totalPoints: c.totalPoints + amount };
      }
      return c;
    });

    // Create history entries
    const newHistories: PointHistory[] = ids.map(id => ({
      id: `PH_${Math.random().toString(36).substr(2, 9)}`,
      customerId: id,
      points: amount,
      createdAt: now,
      isRead: false
    }));

    // Create notifications
    const newNotifications: Notification[] = ids.map(id => ({
      id: `NT_${Math.random().toString(36).substr(2, 9)}`,
      customerId: id,
      title: '포인트 적립',
      content: `${amount} 포인트가 적립되었습니다.`,
      createdAt: now,
      isRead: false
    }));

    setCustomers(updatedCustomers);
    setPointHistory([...pointHistory, ...newHistories]);
    setNotifications([...notifications, ...newNotifications]);

    saveToStorage('cp_customers', updatedCustomers);
    saveToStorage('cp_point_history', [...pointHistory, ...newHistories]);
    saveToStorage('cp_notifications', [...notifications, ...newNotifications]);
  };

  const deleteCustomer = (id: string) => {
    const next = customers.filter(c => c.id !== id);
    setCustomers(next);
    saveToStorage('cp_customers', next);
  };

  const renderView = () => {
    switch (view) {
      case 'MAIN':
        return <MainScreen setView={setView} />;
      case 'CUSTOMER_LOGIN':
        return <CustomerLogin setView={setView} customers={customers} setCurrentUser={setCurrentUser} />;
      case 'SIGNUP':
        return <Signup setView={setView} customers={customers} setCustomers={(c) => {
          setCustomers(c);
          saveToStorage('cp_customers', c);
        }} />;
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
          setNotifications={(nList) => {
            const others = notifications.filter(n => n.customerId !== currentUser?.id);
            const next = [...others, ...nList];
            setNotifications(next);
            saveToStorage('cp_notifications', next);
          }}
        />;
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
