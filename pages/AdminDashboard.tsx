
import React, { useState, useEffect } from 'react';
import { ViewState, Customer, UserStatus, Announcement } from '../types';
import { Button, Input, Card } from '../components/UI';
import { api } from '../api/client';

interface Props {
  setView: (v: ViewState) => void;
  customers: Customer[];
  onAddPoints: (ids: string[], amount: number) => void;
  onUpdateCustomer: (c: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  handleLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({ 
  setView, 
  customers, 
  onAddPoints, 
  onUpdateCustomer, 
  onDeleteCustomer,
  handleLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'customers' | 'messages' | 'announcements'>('customers');
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  const [search, setSearch] = useState('');
  const [pointInput, setPointInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    phone: true,
    company: true
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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

  // 대기 고객 및 공지사항 로드
  useEffect(() => {
    loadPendingCustomers();
    loadAnnouncements();
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
  const pendingCount = pendingCustomers.length;

  // 승인 핸들러
  const handleApproveCustomer = async (customerId: string) => {
    setIsApproving(true);
    try {
      await api.approveCustomer(customerId);
      setPendingCustomers(prev => prev.filter(c => c.id !== customerId));
      alert('승인이 완료되었습니다.');
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) {
      alert('승인할 고객을 선택해주세요.');
      return;
    }

    setIsApproving(true);
    try {
      await api.approveCustomers(selectedPendingIds);
      setPendingCustomers(prev => prev.filter(c => !selectedPendingIds.includes(c.id)));
      setSelectedPendingIds([]);
      alert(`${selectedPendingIds.length}명의 고객이 승인되었습니다.`);
    } catch (error) {
      console.error('일괄 승인 실패:', error);
      alert('일괄 승인에 실패했습니다.');
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
      alert('올바른 포인트를 입력해주세요.');
      return;
    }

    if (pointAdjustMode === 'deduct' && !pointAdjustReason.trim()) {
      alert('차감 사유를 입력해주세요.');
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
        alert(`${amount.toLocaleString()} 포인트가 적립되었습니다.`);
      } else {
        // 차감
        const result = await api.deductPoints([editingCustomer.id], amount, pointAdjustReason);
        if (result.customers.length > 0) {
          const updatedCustomer = result.customers[0];
          setEditingCustomer({
            ...editingCustomer,
            totalPoints: updatedCustomer.totalPoints
          });
          onUpdateCustomer(updatedCustomer);
          alert(`${amount.toLocaleString()} 포인트가 차감되었습니다.`);
        }
      }
      // 입력 초기화
      setPointAdjustAmount('');
      setPointAdjustReason('');
    } catch (error) {
      console.error('포인트 조정 실패:', error);
      alert('포인트 조정에 실패했습니다.');
    } finally {
      setIsAdjusting(false);
    }
  };

  // 메시지 발송 핸들러
  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (messageTarget === 'selected' && selectedMessageIds.length === 0) {
      alert('메시지를 보낼 고객을 선택해주세요.');
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

      alert(`${result.successCount}명에게 메시지가 발송되었습니다.`);
      setMessageTitle('');
      setMessageContent('');
      setSelectedMessageIds([]);
    } catch (error) {
      console.error('메시지 발송 실패:', error);
      alert('메시지 발송에 실패했습니다.');
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
      alert('제목과 내용을 입력해주세요.');
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
        alert('공지가 수정되었습니다.');
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
        alert('공지가 등록되었습니다.');
      }
      closeAnnouncementModal();
    } catch (error) {
      console.error('공지 저장 실패:', error);
      alert('공지 저장에 실패했습니다.');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await api.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      closeAnnouncementModal();
      alert('공지가 삭제되었습니다.');
    } catch (error) {
      console.error('공지 삭제 실패:', error);
      alert('공지 삭제에 실패했습니다.');
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
      alert('올바른 포인트를 입력해주세요.');
      return;
    }
    if (selectedIds.length === 0) {
      alert('고객을 선택해주세요.');
      return;
    }
    onAddPoints(selectedIds, amount);
    setPointInput('');
    setSelectedIds([]);
    alert('포인트 지급이 완료되었습니다.');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-navy-800 text-white p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <button onClick={() => setView('MAIN')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="font-bold">관리자 모드</span>
        </div>
        <button onClick={handleLogout} className="text-xs bg-navy-900 px-3 py-1 rounded">로그아웃</button>
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
          <div className="p-4 bg-gray-100 flex items-center space-x-2 sticky top-[104px] z-10 shadow-sm">
            <div className="flex-1">
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="지급 포인트"
                value={pointInput}
                onChange={(e) => setPointInput(e.target.value)}
              />
            </div>
            <Button variant="gold" className="text-sm py-2 px-4" onClick={handlePointSubmit}>
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

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-navy-800">고객 정보 수정</h3>
              <div className="text-navy-800 font-bold bg-navy-50 px-2 py-1 rounded text-xs">
                {editingCustomer.totalPoints.toLocaleString()} P
              </div>
            </div>
            <div className="space-y-3">
              <Input label="이름" value={editingCustomer.name} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} />
              <Input label="전화번호" value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} />
              <Input label="업체명" value={editingCustomer.company} onChange={e => setEditingCustomer({...editingCustomer, company: e.target.value})} />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingCustomer.status === UserStatus.WITHDRAWN}
                  onChange={e => setEditingCustomer({...editingCustomer, status: e.target.checked ? UserStatus.WITHDRAWN : UserStatus.ACTIVE})}
                />
                <span className="text-sm">탈퇴 처리</span>
              </div>
            </div>

            {/* 포인트 조정 섹션 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-navy-800">포인트 조정</div>
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    pointAdjustMode === 'earn'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setPointAdjustMode('earn')}
                >
                  적립
                </button>
                <button
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    pointAdjustMode === 'deduct'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setPointAdjustMode('deduct')}
                >
                  차감
                </button>
              </div>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="금액 입력"
                value={pointAdjustAmount}
                onChange={e => setPointAdjustAmount(e.target.value)}
              />
              {pointAdjustMode === 'deduct' && (
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="차감 사유 (필수)"
                  value={pointAdjustReason}
                  onChange={e => setPointAdjustReason(e.target.value)}
                />
              )}
              <button
                className="w-full py-2 bg-navy-800 text-white text-sm rounded-lg hover:bg-navy-900 disabled:opacity-50"
                onClick={handlePointAdjust}
                disabled={isAdjusting}
              >
                {isAdjusting ? '처리 중...' : '포인트 적용'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="danger" className="text-sm" onClick={() => {
                if (confirm('정말 삭제하시겠습니까? 데이터가 영구 삭제됩니다.')) {
                  onDeleteCustomer(editingCustomer.id);
                  setEditingCustomer(null);
                }
              }}>삭제</Button>
              <Button variant="primary" className="text-sm" onClick={() => {
                onUpdateCustomer(editingCustomer);
                setEditingCustomer(null);
              }}>저장</Button>
            </div>
            <Button
              variant="secondary"
              fullWidth
              className="text-sm"
              onClick={async () => {
                const newPassword = prompt('새 비밀번호를 입력하세요 (4자 이상):');
                if (newPassword && newPassword.length >= 4) {
                  try {
                    await api.resetCustomerPassword(editingCustomer.id, newPassword);
                    alert('비밀번호가 초기화되었습니다.');
                  } catch (err) {
                    alert('비밀번호 초기화에 실패했습니다.');
                  }
                } else if (newPassword) {
                  alert('비밀번호는 4자 이상이어야 합니다.');
                }
              }}
            >
              비밀번호 초기화
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setEditingCustomer(null)}>닫기</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
