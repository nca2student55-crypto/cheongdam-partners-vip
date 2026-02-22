
import React, { useState, useEffect, useRef } from 'react';
import { Customer, UserStatus, Announcement, AdminNotification } from '../types';
import { Button, Input, Card, AlertModal, AlertModalState, initialAlertState } from '../components/UI';
import { api } from '../api/client';
import { supabase } from '../api/supabase';

interface Props {
  customers: Customer[];
  onAddPoints: (ids: string[], amount: number) => void;
  onDeductPoints: (ids: string[], amount: number, reason: string) => Promise<void>;
  onUpdateCustomer: (c: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  handleLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({
  customers,
  onAddPoints,
  onDeductPoints,
  onUpdateCustomer,
  onDeleteCustomer,
  handleLogout
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'customers' | 'messages' | 'announcements' | 'alerts'>('customers');
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  // 관리자 알림 상태
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [deleteNotificationId, setDeleteNotificationId] = useState<string | null>(null);
  const notifLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState('');
  const [pointInput, setPointInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    phone: true,
    company: true
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editModalTab, setEditModalTab] = useState<'info' | 'points' | 'account'>('info');

  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState<{
    type: 'withdraw' | 'restore' | 'delete' | 'logout' | null;
    isOpen: boolean;
  }>({ type: null, isOpen: false });
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // 포인트 조정 상태
  const [pointAdjustMode, setPointAdjustMode] = useState<'earn' | 'deduct'>('earn');
  const [pointAdjustAmount, setPointAdjustAmount] = useState('');
  const [pointAdjustReason, setPointAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // 메시지 발송 상태
  const [messageTarget, setMessageTarget] = useState<'all' | 'selected'>('selected');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // 공지사항 상태
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    isPinned: false,
    expiresAt: ''
  });
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // AlertModal 상태
  const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertState);

  // Alert 표시 헬퍼 함수
  const showAlert = (type: AlertModalState['type'], title: string, message: string) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertModal(initialAlertState);
  };

  // Android 뒤로가기 차단
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      showAlert('warning', '뒤로가기 불가', '나가려면 우상단 로그아웃 버튼을 눌러주세요.');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 대기 고객, 공지사항, 알림 로드
  useEffect(() => {
    loadPendingCustomers();
    loadAnnouncements();
    loadAdminNotifications();
  }, []);

  // Supabase Realtime 구독 - 관리자 알림 및 고객 변경 실시간 동기화
  useEffect(() => {
    // admin_notifications 테이블 구독
    const adminNotifChannel = supabase
      .channel('admin-notifications-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif: AdminNotification = {
              id: payload.new.id,
              type: payload.new.type,
              referenceType: payload.new.reference_type,
              referenceId: payload.new.reference_id,
              title: payload.new.title,
              content: payload.new.content,
              isRead: payload.new.is_read,
              createdAt: payload.new.created_at,
            };
            setAdminNotifications(prev => [newNotif, ...prev]);
            if (!newNotif.isRead) setUnreadAlertCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setAdminNotifications(prev =>
              prev.map(n => n.id === payload.new.id
                ? { ...n, isRead: payload.new.is_read }
                : n
              )
            );
            if (payload.new.is_read && !payload.old?.is_read) {
              setUnreadAlertCount(prev => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'DELETE') {
            setAdminNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
          }
        }
      ).subscribe();

    // customers 테이블 구독 - pending 고객 실시간 갱신
    const customersChannel = supabase
      .channel('admin-customers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            loadPendingCustomers();
          } else if (payload.eventType === 'UPDATE') {
            // 상태 변경 시 pending 목록 갱신
            loadPendingCustomers();
          }
        }
      ).subscribe();

    // announcements 테이블 구독
    const announcementsChannel = supabase
      .channel('admin-announcements-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => loadAnnouncements()
      ).subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(adminNotifChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, []);

  const loadPendingCustomers = async () => {
    try {
      const pending = await api.getPendingCustomers();
      setPendingCustomers(pending);
    } catch (error) {
      console.error('대기 고객 로드 실패:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    }
  };

  const loadAdminNotifications = async () => {
    try {
      const [notifications, unreadCount] = await Promise.all([
        api.getAdminNotifications(),
        api.getUnreadAdminNotificationCount()
      ]);
      setAdminNotifications(notifications);
      setUnreadAlertCount(unreadCount);
    } catch (error) {
      console.error('관리자 알림 로드 실패:', error);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await api.markAdminNotificationAsRead(notificationId);
      setAdminNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadAlertCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await api.markAllAdminNotificationsAsRead();
      setAdminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadAlertCount(0);
      showAlert('success', '완료', '모든 알림을 읽음 처리했습니다.');
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error);
      showAlert('error', '실패', '읽음 처리에 실패했습니다.');
    }
  };

  const handleNotifLongPressStart = (id: string) => {
    notifLongPressTimerRef.current = setTimeout(() => setDeleteNotificationId(id), 500);
  };

  const handleNotifLongPressEnd = () => {
    if (notifLongPressTimerRef.current) {
      clearTimeout(notifLongPressTimerRef.current);
      notifLongPressTimerRef.current = null;
    }
  };

  const handleDeleteAdminNotification = async () => {
    if (!deleteNotificationId) return;
    try {
      await api.deleteAdminNotification(deleteNotificationId);
      const deleted = adminNotifications.find(n => n.id === deleteNotificationId);
      setAdminNotifications(prev => prev.filter(n => n.id !== deleteNotificationId));
      if (deleted && !deleted.isRead) {
        setUnreadAlertCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    } finally {
      setDeleteNotificationId(null);
    }
  };

  // 알림 타입별 스타일
  const getNotificationBadge = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_signup':
        return { bg: 'bg-green-100', text: 'text-green-700', label: '신규가입' };
      case 'inquiry':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: '문의' };
      case 'withdrawal':
        return { bg: 'bg-red-100', text: 'text-red-700', label: '탈퇴' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: '알림' };
    }
  };

  // 고객 목록에서 PENDING 상태 제외 (승인된 고객만 표시)
  const approvedCustomers = customers.filter(c => c.status !== UserStatus.PENDING);

  const filteredCustomers = approvedCustomers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();

    if (searchFilters.name && c.name.toLowerCase().includes(s)) return true;
    if (searchFilters.phone && c.phone.slice(-4).includes(s)) return true;
    if (searchFilters.company && c.company.toLowerCase().includes(s)) return true;

    return false;
  });

  const activeCount = customers.filter(c => c.status === UserStatus.ACTIVE).length;
  const withdrawnCount = customers.filter(c => c.status === UserStatus.WITHDRAWN).length;
  const totalPointsSum = customers
    .filter(c => c.status === UserStatus.ACTIVE)
    .reduce((sum, c) => sum + c.totalPoints, 0);
  const pendingCount = pendingCustomers.length;

  // 승인 핸들러
  const handleApproveCustomer = async (customerId: string) => {
    setIsApproving(true);
    try {
      await api.approveCustomer(customerId);
      setPendingCustomers(prev => prev.filter(c => c.id !== customerId));
      showAlert('success', '승인 완료', '승인이 완료되었습니다.');
    } catch (error) {
      console.error('승인 실패:', error);
      showAlert('error', '승인 실패', '승인에 실패했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) {
      showAlert('warning', '선택 필요', '승인할 고객을 선택해주세요.');
      return;
    }

    setIsApproving(true);
    try {
      await api.approveCustomers(selectedPendingIds);
      setPendingCustomers(prev => prev.filter(c => !selectedPendingIds.includes(c.id)));
      setSelectedPendingIds([]);
      showAlert('success', '일괄 승인 완료', `${selectedPendingIds.length}명의 고객이 승인되었습니다.`);
    } catch (error) {
      console.error('일괄 승인 실패:', error);
      showAlert('error', '일괄 승인 실패', '일괄 승인에 실패했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  const togglePendingSelect = (id: string) => {
    setSelectedPendingIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 포인트 조정 핸들러
  const handlePointAdjust = async () => {
    if (!editingCustomer) return;

    const amount = parseInt(pointAdjustAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('warning', '입력 오류', '올바른 포인트를 입력해주세요.');
      return;
    }

    if (pointAdjustMode === 'deduct' && !pointAdjustReason.trim()) {
      showAlert('warning', '입력 필요', '차감 사유를 입력해주세요.');
      return;
    }

    setIsAdjusting(true);
    try {
      if (pointAdjustMode === 'earn') {
        // 적립
        onAddPoints([editingCustomer.id], amount);
        setEditingCustomer({
          ...editingCustomer,
          totalPoints: editingCustomer.totalPoints + amount
        });
        showAlert('success', '포인트 적립', `${amount.toLocaleString()} 포인트가 적립되었습니다.`);
      } else {
        // 차감 - App.tsx의 핸들러 사용하여 상태 동기화
        await onDeductPoints([editingCustomer.id], amount, pointAdjustReason);
        const newPoints = Math.max(0, editingCustomer.totalPoints - amount);
        setEditingCustomer({
          ...editingCustomer,
          totalPoints: newPoints
        });
        showAlert('success', '포인트 차감', `${amount.toLocaleString()} 포인트가 차감되었습니다.`);
      }
      // 입력 초기화
      setPointAdjustAmount('');
      setPointAdjustReason('');
    } catch (error) {
      console.error('포인트 조정 실패:', error);
      showAlert('error', '조정 실패', '포인트 조정에 실패했습니다.');
    } finally {
      setIsAdjusting(false);
    }
  };

  // 메시지 발송 핸들러
  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      showAlert('warning', '입력 필요', '제목과 내용을 입력해주세요.');
      return;
    }

    if (messageTarget === 'selected' && selectedMessageIds.length === 0) {
      showAlert('warning', '선택 필요', '메시지를 보낼 고객을 선택해주세요.');
      return;
    }

    setIsSendingMessage(true);
    try {
      let result;
      if (messageTarget === 'all') {
        result = await api.sendMessageToAll(messageTitle, messageContent);
      } else {
        result = await api.sendMessage(selectedMessageIds, messageTitle, messageContent);
      }

      showAlert('success', '발송 완료', `${result.successCount}명에게 메시지가 발송되었습니다.`);
      setMessageTitle('');
      setMessageContent('');
      setSelectedMessageIds([]);
    } catch (error) {
      console.error('메시지 발송 실패:', error);
      showAlert('error', '발송 실패', '메시지 발송에 실패했습니다.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const toggleMessageSelect = (id: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 공지사항 핸들러
  const handleSaveAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      showAlert('warning', '입력 필요', '제목과 내용을 입력해주세요.');
      return;
    }

    setIsSavingAnnouncement(true);
    try {
      if (editingAnnouncement) {
        // 수정
        const updated = await api.updateAnnouncement({
          ...editingAnnouncement,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          isPinned: newAnnouncement.isPinned,
          expiresAt: newAnnouncement.expiresAt || undefined,
        });
        setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
        showAlert('success', '수정 완료', '공지가 수정되었습니다.');
      } else {
        // 신규 생성
        const created = await api.createAnnouncement({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          isActive: true,
          isPinned: newAnnouncement.isPinned,
          expiresAt: newAnnouncement.expiresAt || undefined,
        });
        setAnnouncements(prev => [created, ...prev]);
        showAlert('success', '등록 완료', '공지가 등록되었습니다.');
      }
      closeAnnouncementModal();
    } catch (error) {
      console.error('공지 저장 실패:', error);
      showAlert('error', '저장 실패', '공지 저장에 실패했습니다.');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // 공지 삭제 확인 상태
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  const handleDeleteAnnouncement = async (id: string) => {
    setDeleteAnnouncementId(id);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!deleteAnnouncementId) return;

    try {
      await api.deleteAnnouncement(deleteAnnouncementId);
      setAnnouncements(prev => prev.filter(a => a.id !== deleteAnnouncementId));
      closeAnnouncementModal();
      showAlert('success', '삭제 완료', '공지가 삭제되었습니다.');
    } catch (error) {
      console.error('공지 삭제 실패:', error);
      showAlert('error', '삭제 실패', '공지 삭제에 실패했습니다.');
    } finally {
      setDeleteAnnouncementId(null);
    }
  };

  const openNewAnnouncementModal = () => {
    setEditingAnnouncement(null);
    setNewAnnouncement({ title: '', content: '', isPinned: false, expiresAt: '' });
    setIsAnnouncementModalOpen(true);
  };

  const openEditAnnouncementModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
      expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
    });
    setIsAnnouncementModalOpen(true);
  };

  const closeAnnouncementModal = () => {
    setIsAnnouncementModalOpen(false);
    setEditingAnnouncement(null);
    setNewAnnouncement({ title: '', content: '', isPinned: false, expiresAt: '' });
  };

  const handlePointSubmit = () => {
    const amount = parseInt(pointInput);
    if (isNaN(amount) || amount <= 0) {
      showAlert('warning', '입력 오류', '올바른 포인트를 입력해주세요.');
      return;
    }
    if (selectedIds.length === 0) {
      showAlert('warning', '선택 필요', '고객을 선택해주세요.');
      return;
    }
    onAddPoints(selectedIds, amount);
    setPointInput('');
    setSelectedIds([]);
    showAlert('success', '지급 완료', '포인트 지급이 완료되었습니다.');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 탈퇴 처리
  const handleWithdraw = () => {
    if (!editingCustomer) return;
    const updated = {
      ...editingCustomer,
      status: UserStatus.WITHDRAWN,
      withdrawnAt: new Date().toISOString()
    };
    onUpdateCustomer(updated);
    setEditingCustomer(updated);
    setConfirmModal({ type: null, isOpen: false });
    showAlert('success', '탈퇴 처리', '탈퇴 처리가 완료되었습니다.');
  };

  // 탈퇴 복구
  const handleRestore = () => {
    if (!editingCustomer) return;
    const updated = {
      ...editingCustomer,
      status: UserStatus.ACTIVE,
      withdrawnAt: undefined
    };
    onUpdateCustomer(updated);
    setEditingCustomer(updated);
    setConfirmModal({ type: null, isOpen: false });
    showAlert('success', '탈퇴 복구', '탈퇴가 복구되었습니다.');
  };

  // 영구 삭제
  const handlePermanentDelete = () => {
    if (!editingCustomer) return;
    if (deleteConfirmName !== editingCustomer.name) {
      showAlert('error', '이름 불일치', '고객 이름이 일치하지 않습니다.');
      return;
    }
    onDeleteCustomer(editingCustomer.id);
    setEditingCustomer(null);
    setConfirmModal({ type: null, isOpen: false });
    setDeleteConfirmName('');
    showAlert('success', '삭제 완료', '고객이 영구 삭제되었습니다.');
  };

  // 모달 닫기 시 초기화
  const closeEditModal = () => {
    setEditingCustomer(null);
    setEditModalTab('info');
    setPointAdjustAmount('');
    setPointAdjustReason('');
    setPointAdjustMode('earn');
    setConfirmModal({ type: null, isOpen: false });
    setDeleteConfirmName('');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-navy-800 text-white p-4 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-white">관리자 모드</span>
        <button onClick={() => setConfirmModal({ type: 'logout', isOpen: true })} className="text-xs bg-navy-900 px-3 py-1 rounded">로그아웃</button>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b bg-white">
        <button
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'pending'
              ? 'text-navy-800 border-b-2 border-navy-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          승인 대기
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'customers'
              ? 'text-navy-800 border-b-2 border-navy-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('customers')}
        >
          고객 목록
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'messages'
              ? 'text-navy-800 border-b-2 border-navy-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('messages')}
        >
          메시지
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'announcements'
              ? 'text-navy-800 border-b-2 border-navy-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('announcements')}
        >
          공지
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'alerts'
              ? 'text-navy-800 border-b-2 border-navy-800'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('alerts')}
        >
          알림
          {unreadAlertCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unreadAlertCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats - Show on customers tab */}
      {activeTab === 'customers' && (
        <div className="p-4 grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-xs text-gray-500">총 고객</div>
            <div className="text-lg font-bold text-navy-800">{approvedCustomers.length}명</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xs text-gray-500">승인 대기</div>
            <div className="text-lg font-bold text-orange-500">{pendingCount}명</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xs text-gray-500">활성/탈퇴</div>
            <div className="text-sm font-semibold">
              <span className="text-green-600">{activeCount}</span>/<span className="text-red-500">{withdrawnCount}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Pending Tab Content */}
      {activeTab === 'pending' && (
        <div className="flex-1 flex flex-col">
          {/* Bulk Approve Bar */}
          <div className="p-4 bg-gray-100 flex items-center justify-between sticky top-[104px] z-10 shadow-sm">
            <span className="text-sm text-gray-600">
              {selectedPendingIds.length > 0
                ? `${selectedPendingIds.length}명 선택됨`
                : '승인할 고객을 선택하세요'}
            </span>
            <Button
              variant="primary"
              className="text-sm py-2 px-4"
              onClick={handleBulkApprove}
              disabled={selectedPendingIds.length === 0 || isApproving}
            >
              {isApproving ? '처리 중...' : '일괄 승인'}
            </Button>
          </div>

          {/* Pending Customer List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {pendingCustomers.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-300">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 15h8M9 9h.01M15 9h.01"/>
                </svg>
                승인 대기 중인 고객이 없습니다.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">
                      <input
                        type="checkbox"
                        checked={selectedPendingIds.length === pendingCustomers.length && pendingCustomers.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelectedPendingIds(pendingCustomers.map(c => c.id));
                          else setSelectedPendingIds([]);
                        }}
                      />
                    </th>
                    <th className="px-2 py-3 font-medium">고객명</th>
                    <th className="px-2 py-3 font-medium">전화번호</th>
                    <th className="px-2 py-3 font-medium">업체</th>
                    <th className="px-2 py-3 font-medium">신청일</th>
                    <th className="px-2 py-3 font-medium w-16">승인</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPendingIds.includes(c.id)}
                          onChange={() => togglePendingSelect(c.id)}
                        />
                      </td>
                      <td className="px-2 py-4">{c.name}</td>
                      <td className="px-2 py-4">{c.phone}</td>
                      <td className="px-2 py-4 truncate max-w-[80px]">
                        {c.isIndividual ? '개인' : c.company}
                      </td>
                      <td className="px-2 py-4 text-gray-500 text-xs">
                        {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-2 py-4">
                        <button
                          onClick={() => handleApproveCustomer(c.id)}
                          disabled={isApproving}
                          className="bg-green-500 text-white text-xs px-3 py-1.5 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          승인
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Customers Tab Content */}
      {activeTab === 'customers' && (
        <>
          {/* Search & Filter */}
          <div className="px-4 mb-4">
            <div className="flex space-x-2 mb-2">
              <input
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="검색어 입력..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center space-x-1 text-xs text-gray-600">
                <input type="checkbox" checked={searchFilters.name} onChange={e => setSearchFilters({...searchFilters, name: e.target.checked})} />
                <span>이름</span>
              </label>
              <label className="flex items-center space-x-1 text-xs text-gray-600">
                <input type="checkbox" checked={searchFilters.phone} onChange={e => setSearchFilters({...searchFilters, phone: e.target.checked})} />
                <span>전화번호(뒷4)</span>
              </label>
              <label className="flex items-center space-x-1 text-xs text-gray-600">
                <input type="checkbox" checked={searchFilters.company} onChange={e => setSearchFilters({...searchFilters, company: e.target.checked})} />
                <span>업체명</span>
              </label>
            </div>
          </div>

          {/* Bulk Point Entry */}
          <div className="p-4 bg-gray-100 flex items-center space-x-3 sticky top-[104px] z-10 shadow-sm">
            {/* 총 보유 포인트 - 좌측 */}
            <div className="flex flex-col items-center shrink-0 w-[90px]">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider whitespace-nowrap">총 보유 포인트</span>
              <span
                className={`font-bold whitespace-nowrap ${
                  totalPointsSum >= 1_000_000_000 ? 'text-[9px]' :
                  totalPointsSum >= 100_000_000  ? 'text-[10px]' :
                  totalPointsSum >= 10_000_000   ? 'text-[11px]' :
                  totalPointsSum >= 1_000_000    ? 'text-xs' : 'text-sm'
                }`}
                style={{ color: '#F97114' }}
              >
                {totalPointsSum.toLocaleString()} P
              </span>
            </div>
            {/* 지급 포인트 입력 - 중앙 */}
            <div className="flex-1">
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="지급 포인트"
                value={pointInput}
                onChange={(e) => setPointInput(e.target.value)}
              />
            </div>
            {/* 매출 지급 - 우측 */}
            <Button variant="gold" className="text-sm py-2 px-4 shrink-0" onClick={handlePointSubmit}>
              매출 지급
            </Button>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left border-b">
                <tr>
                  <th className="px-4 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={e => {
                        if (e.target.checked) setSelectedIds(filteredCustomers.map(c => c.id));
                        else setSelectedIds([]);
                      }}
                    />
                  </th>
                  <th className="px-2 py-3 font-medium">고객명</th>
                  <th className="px-2 py-3 font-medium">전화번호</th>
                  <th className="px-2 py-3 font-medium">포인트</th>
                  <th className="px-2 py-3 font-medium">업체</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map(c => (
                  <tr
                    key={c.id}
                    className={`${c.status === UserStatus.WITHDRAWN ? 'bg-gray-50 text-gray-400' : ''} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => setEditingCustomer(c)}
                  >
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="px-2 py-4">
                      {c.name}
                      {c.status === UserStatus.WITHDRAWN && <span className="ml-1 text-[10px] bg-gray-200 px-1 rounded">탈퇴</span>}
                    </td>
                    <td className="px-2 py-4">{c.phone}</td>
                    <td className="px-2 py-4 font-semibold text-navy-800">{c.totalPoints.toLocaleString()} P</td>
                    <td className="px-2 py-4 truncate max-w-[80px]">{c.isIndividual ? '개인' : c.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="p-20 text-center text-gray-400">검색 결과가 없습니다.</div>
            )}
          </div>
        </>
      )}

      {/* Messages Tab Content */}
      {activeTab === 'messages' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 space-y-4">
            {/* 발송 대상 선택 */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-navy-800 mb-3">발송 대상</div>
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    messageTarget === 'all'
                      ? 'bg-navy-800 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setMessageTarget('all')}
                >
                  전체 고객 ({activeCount}명)
                </button>
                <button
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    messageTarget === 'selected'
                      ? 'bg-navy-800 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setMessageTarget('selected')}
                >
                  선택 고객 ({selectedMessageIds.length}명)
                </button>
              </div>

              {/* 선택 고객 모드일 때 고객 목록 표시 */}
              {messageTarget === 'selected' && (
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {approvedCustomers.filter(c => c.status === UserStatus.ACTIVE).map(c => (
                    <label
                      key={c.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMessageIds.includes(c.id)}
                        onChange={() => toggleMessageSelect(c.id)}
                        className="mr-3"
                      />
                      <span className="text-sm">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{c.phone}</span>
                    </label>
                  ))}
                  {approvedCustomers.filter(c => c.status === UserStatus.ACTIVE).length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">활성 고객이 없습니다.</div>
                  )}
                </div>
              )}
            </div>

            {/* 메시지 내용 */}
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
              <div className="text-sm font-medium text-navy-800">메시지 내용</div>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="제목을 입력하세요"
                value={messageTitle}
                onChange={e => setMessageTitle(e.target.value)}
              />
              <textarea
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={5}
                placeholder="내용을 입력하세요"
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
              />
            </div>

            {/* 발송 버튼 */}
            <Button
              fullWidth
              onClick={handleSendMessage}
              disabled={isSendingMessage}
            >
              {isSendingMessage ? '발송 중...' : '메시지 발송'}
            </Button>
          </div>
        </div>
      )}

      {/* Announcements Tab Content */}
      {activeTab === 'announcements' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <Button fullWidth onClick={openNewAnnouncementModal}>
              새 공지 작성
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {announcements.length === 0 ? (
              <div className="p-20 text-center text-gray-400">등록된 공지가 없습니다.</div>
            ) : (
              announcements.map(a => (
                <Card
                  key={a.id}
                  className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${a.isPinned ? 'border-l-4 border-l-gold-400' : ''}`}
                  onClick={() => openEditAnnouncementModal(a)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {a.isPinned && (
                          <span className="text-xs bg-gold-400 text-white px-2 py-0.5 rounded">고정</span>
                        )}
                        {!a.isActive && (
                          <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded">비활성</span>
                        )}
                      </div>
                      <div className="font-medium text-navy-800">{a.title}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                    {a.expiresAt && ` · 만료: ${new Date(a.expiresAt).toLocaleDateString('ko-KR')}`}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab Content */}
      {activeTab === 'alerts' && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gray-100 flex items-center justify-between sticky top-[104px] z-10 shadow-sm">
            <span className="text-sm text-gray-600">
              전체 {adminNotifications.length}건 (읽지 않음 {unreadAlertCount}건)
            </span>
            <Button
              variant="secondary"
              className="text-xs py-1.5 px-3"
              onClick={handleMarkAllNotificationsAsRead}
              disabled={unreadAlertCount === 0}
            >
              모두 읽음
            </Button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {adminNotifications.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-300">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                알림이 없습니다.
              </div>
            ) : (
              <div className="divide-y">
                {adminNotifications.map(notification => {
                  const badge = getNotificationBadge(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors select-none ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkNotificationAsRead(notification.id);
                        }
                      }}
                      onTouchStart={() => handleNotifLongPressStart(notification.id)}
                      onTouchEnd={handleNotifLongPressEnd}
                      onTouchMove={handleNotifLongPressEnd}
                      onMouseDown={() => handleNotifLongPressStart(notification.id)}
                      onMouseUp={handleNotifLongPressEnd}
                      onMouseLeave={handleNotifLongPressEnd}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start gap-3">
                        {/* 읽지 않음 표시 */}
                        <div className="pt-1">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {notification.isRead && (
                            <div className="w-2 h-2"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* 배지 및 제목 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                            <span className="font-medium text-navy-800 truncate">
                              {notification.title}
                            </span>
                          </div>

                          {/* 내용 */}
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.content}
                          </p>

                          {/* 날짜 */}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 관리자 알림 삭제 확인 팝업 */}
      {deleteNotificationId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-800">알림 삭제</h3>
              <p className="text-sm text-gray-500">이 알림을 삭제하시겠습니까?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteNotificationId(null)}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAdminNotification}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-navy-800">
              {editingAnnouncement ? '공지 수정' : '새 공지 작성'}
            </h3>

            <div className="space-y-3">
              <Input
                label="제목"
                value={newAnnouncement.title}
                onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  rows={6}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newAnnouncement.isPinned}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                />
                <span className="text-sm">상단 고정</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">만료일 (선택)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={newAnnouncement.expiresAt}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingAnnouncement && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDeleteAnnouncement(editingAnnouncement.id)}
                >
                  삭제
                </Button>
              )}
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSaveAnnouncement}
                disabled={isSavingAnnouncement}
              >
                {isSavingAnnouncement ? '저장 중...' : '저장'}
              </Button>
            </div>
            <Button variant="ghost" fullWidth onClick={closeAnnouncementModal}>
              닫기
            </Button>
          </Card>
        </div>
      )}

      {/* Edit Modal - Tab Based */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-navy-800 text-white rounded-t-xl">
              <div>
                <h3 className="font-bold text-lg">{editingCustomer.name}</h3>
                <p className="text-sm opacity-80">{editingCustomer.phone}</p>
              </div>
              <div className="text-right">
                <div className="text-gold-400 font-bold text-lg">
                  {editingCustomer.totalPoints.toLocaleString()} P
                </div>
                {editingCustomer.status === UserStatus.WITHDRAWN && (
                  <span className="text-xs bg-red-500 px-2 py-0.5 rounded">탈퇴됨</span>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b bg-gray-50">
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  editModalTab === 'info'
                    ? 'bg-white text-navy-800 border-b-2 border-navy-800'
                    : 'text-gray-500'
                }`}
                onClick={() => setEditModalTab('info')}
              >
                기본정보
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  editModalTab === 'points'
                    ? 'bg-white text-navy-800 border-b-2 border-navy-800'
                    : 'text-gray-500'
                }`}
                onClick={() => setEditModalTab('points')}
              >
                포인트
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  editModalTab === 'account'
                    ? 'bg-white text-navy-800 border-b-2 border-navy-800'
                    : 'text-gray-500'
                }`}
                onClick={() => setEditModalTab('account')}
              >
                계정관리
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 기본정보 탭 */}
              {editModalTab === 'info' && (
                <div className="space-y-4">
                  <Input
                    label="이름"
                    value={editingCustomer.name}
                    onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                  />
                  <Input
                    label="전화번호"
                    value={editingCustomer.phone}
                    onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  />
                  <Input
                    label="업체명"
                    value={editingCustomer.company}
                    onChange={e => setEditingCustomer({...editingCustomer, company: e.target.value})}
                  />
                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        onUpdateCustomer(editingCustomer);
                        showAlert('success', '저장 완료', '변경사항이 저장되었습니다.');
                      }}
                    >
                      변경사항 저장
                    </Button>
                  </div>
                </div>
              )}

              {/* 포인트 탭 */}
              {editModalTab === 'points' && (
                <div className="space-y-4">
                  <div className="text-center py-4 bg-navy-50 rounded-lg">
                    <div className="text-sm text-gray-500">현재 보유 포인트</div>
                    <div className="text-3xl font-bold text-navy-800">
                      {editingCustomer.totalPoints.toLocaleString()} P
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={`flex-1 py-3 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        pointAdjustMode === 'earn'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setPointAdjustMode('earn')}
                    >
                      <span className="text-lg">+</span> 적립
                    </button>
                    <button
                      className={`flex-1 py-3 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        pointAdjustMode === 'deduct'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setPointAdjustMode('deduct')}
                    >
                      <span className="text-lg">-</span> 차감
                    </button>
                  </div>

                  <Input
                    label="금액"
                    type="number"
                    placeholder="포인트 금액 입력"
                    value={pointAdjustAmount}
                    onChange={e => setPointAdjustAmount(e.target.value)}
                  />

                  {pointAdjustMode === 'deduct' && (
                    <Input
                      label="차감 사유"
                      placeholder="차감 사유를 입력하세요 (필수)"
                      value={pointAdjustReason}
                      onChange={e => setPointAdjustReason(e.target.value)}
                    />
                  )}

                  <Button
                    fullWidth
                    variant={pointAdjustMode === 'earn' ? 'primary' : 'danger'}
                    onClick={handlePointAdjust}
                    disabled={isAdjusting}
                  >
                    {isAdjusting ? '처리 중...' : pointAdjustMode === 'earn' ? '포인트 적립' : '포인트 차감'}
                  </Button>
                </div>
              )}

              {/* 계정관리 탭 */}
              {editModalTab === 'account' && (
                <div className="space-y-4">
                  {/* 비밀번호 초기화 */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-navy-800 mb-2">비밀번호 관리</div>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={async () => {
                        const newPassword = prompt('새 비밀번호를 입력하세요 (4자 이상):');
                        if (newPassword && newPassword.length >= 4) {
                          try {
                            await api.resetCustomerPassword(editingCustomer.id, newPassword);
                            showAlert('success', '초기화 완료', '비밀번호가 초기화되었습니다.');
                          } catch (err) {
                            showAlert('error', '초기화 실패', '비밀번호 초기화에 실패했습니다.');
                          }
                        } else if (newPassword) {
                          showAlert('warning', '입력 오류', '비밀번호는 4자 이상이어야 합니다.');
                        }
                      }}
                    >
                      비밀번호 초기화
                    </Button>
                  </div>

                  {/* 탈퇴/복구 */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-sm font-medium text-orange-800 mb-2">회원 상태 관리</div>
                    {editingCustomer.status === UserStatus.WITHDRAWN ? (
                      <Button
                        fullWidth
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => setConfirmModal({ type: 'restore', isOpen: true })}
                      >
                        탈퇴 복구
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => setConfirmModal({ type: 'withdraw', isOpen: true })}
                      >
                        탈퇴 처리
                      </Button>
                    )}
                    <p className="text-xs text-orange-600 mt-2">
                      {editingCustomer.status === UserStatus.WITHDRAWN
                        ? '탈퇴 복구 시 다시 로그인할 수 있습니다.'
                        : '탈퇴 처리 시 로그인이 차단되지만 데이터는 유지됩니다.'}
                    </p>
                  </div>

                  {/* 영구 삭제 */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span className="text-sm font-medium text-red-800">위험 영역</span>
                    </div>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => setConfirmModal({ type: 'delete', isOpen: true })}
                    >
                      영구 삭제
                    </Button>
                    <p className="text-xs text-red-600 mt-2">
                      영구 삭제 시 모든 데이터가 복구 불가능하게 삭제됩니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t">
              <Button variant="ghost" fullWidth onClick={closeEditModal}>
                닫기
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && confirmModal.type === 'logout' && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3" style={{backgroundColor: '#E8EAF6'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A237E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">로그아웃</h3>
              <p className="text-sm text-gray-500 mt-2">정말 로그아웃 하시겠습니까?</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setConfirmModal({ type: null, isOpen: false })}>
                취소
              </Button>
              <Button variant="primary" fullWidth onClick={() => { setConfirmModal({ type: null, isOpen: false }); handleLogout(); }}>
                로그아웃
              </Button>
            </div>
          </Card>
        </div>
      )}

      {confirmModal.isOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 space-y-4">
            {/* 탈퇴 처리 확인 */}
            {confirmModal.type === 'withdraw' && (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">탈퇴 처리</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>{editingCustomer.name}</strong> 고객을 탈퇴 처리하시겠습니까?
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    탈퇴 시 로그인이 차단되지만 데이터는 유지됩니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setConfirmModal({ type: null, isOpen: false })}>
                    취소
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white flex-1" onClick={handleWithdraw}>
                    탈퇴 처리
                  </Button>
                </div>
              </>
            )}

            {/* 탈퇴 복구 확인 */}
            {confirmModal.type === 'restore' && (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">탈퇴 복구</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>{editingCustomer.name}</strong> 고객의 탈퇴를 복구하시겠습니까?
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    복구 시 다시 로그인할 수 있습니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setConfirmModal({ type: null, isOpen: false })}>
                    취소
                  </Button>
                  <Button className="bg-green-500 hover:bg-green-600 text-white flex-1" onClick={handleRestore}>
                    복구하기
                  </Button>
                </div>
              </>
            )}

            {/* 영구 삭제 확인 */}
            {confirmModal.type === 'delete' && (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-red-600">영구 삭제</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    이 작업은 <strong>되돌릴 수 없습니다.</strong>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    삭제를 확인하려면 고객 이름을 입력하세요.
                  </p>
                </div>
                <Input
                  placeholder={`"${editingCustomer.name}" 입력`}
                  value={deleteConfirmName}
                  onChange={e => setDeleteConfirmName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => {
                    setConfirmModal({ type: null, isOpen: false });
                    setDeleteConfirmName('');
                  }}>
                    취소
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handlePermanentDelete}
                    disabled={deleteConfirmName !== editingCustomer.name}
                  >
                    영구 삭제
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* 공지 삭제 확인 모달 */}
      {deleteAnnouncementId && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">공지 삭제</h3>
              <p className="text-sm text-gray-500 mt-2">정말 이 공지를 삭제하시겠습니까?</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setDeleteAnnouncementId(null)}>
                취소
              </Button>
              <Button variant="danger" fullWidth onClick={confirmDeleteAnnouncement}>
                삭제
              </Button>
            </div>
          </Card>
        </div>
      )}


      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </div>
  );
};

export default AdminDashboard;
