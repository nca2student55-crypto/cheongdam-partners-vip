
import React, { useState } from 'react';
import { ViewState, Customer, UserStatus } from '../types';
import { Button, Input, Card } from '../components/UI';

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
  const [search, setSearch] = useState('');
  const [pointInput, setPointInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    phone: true,
    company: true
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    
    if (searchFilters.name && c.name.toLowerCase().includes(s)) return true;
    if (searchFilters.phone && c.phone.slice(-4).includes(s)) return true;
    if (searchFilters.company && c.company.toLowerCase().includes(s)) return true;
    
    return false;
  });

  const activeCount = customers.filter(c => c.status === UserStatus.ACTIVE).length;
  const withdrawnCount = customers.filter(c => c.status === UserStatus.WITHDRAWN).length;

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

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-xs text-gray-500">총 등록 고객</div>
          <div className="text-xl font-bold text-navy-800">{customers.length}명</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-gray-500">활성 / 탈퇴</div>
          <div className="text-sm font-semibold">
            <span className="text-green-600">{activeCount}</span> / <span className="text-red-500">{withdrawnCount}</span>
          </div>
        </Card>
      </div>

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
      <div className="p-4 bg-gray-100 flex items-center space-x-2 sticky top-[56px] z-10 shadow-sm">
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
            <Button variant="ghost" fullWidth onClick={() => setEditingCustomer(null)}>닫기</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
