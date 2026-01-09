
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole, User, AttendanceCondition } from '../types';
import { 
  Download, 
  Search, 
  X, 
  Edit2, 
  Shield, 
  Clock, 
  Users as UsersIcon, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  User as UserIconAlt, 
  ArrowDownAz, 
  ArrowUpAz,
  UserCog,
  Briefcase,
  ChevronDown,
  Check,
  MapPinOff,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const ApproverTag = ({ employee }: { employee?: User }) => {
  const getRoleAbbreviation = (role: string) => {
    switch (role) {
      case UserRole.SUPERVISOR: return 'Sup';
      case UserRole.ADMIN: return 'HR';
      case UserRole.OFFICE_MANAGER: return 'OM';
      case UserRole.FACTORY_MANAGER: return 'PM';
      case UserRole.CEO: return 'CEO';
      case UserRole.EMPLOYEE: return 'Emp';
      default: return 'N/A';
    }
  };

  const displayName = employee ? employee.name : 'N/A';
  const roleAbbr = employee ? getRoleAbbreviation(employee.role) : 'N/A';

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
       <div className={`text-[7px] font-black px-1.5 h-3.5 min-w-[1.75rem] rounded-full flex items-center justify-center mb-0.5 border ${employee ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
          {roleAbbr}
       </div>
       <span className="text-[8px] font-bold text-slate-600 truncate w-full text-center">{displayName.split(' ')[0]}</span>
    </div>
  );
};

interface SearchableSelectProps {
  label: string;
  value: string;
  options: User[];
  onChange: (id: string) => void;
  excludeId?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, value, options, onChange, excludeId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedUser = options.find(u => u.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(u => {
    if (u.id === excludeId) return false;
    const searchLower = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.username.toLowerCase().includes(searchLower) ||
      u.position.toLowerCase().includes(searchLower) ||
      u.department.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border transition-all cursor-pointer flex items-center justify-between group ${
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500 bg-white' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedUser ? (
            <>
              <img src={selectedUser.avatar} className="w-5 h-5 rounded-full border border-slate-200" />
              <span className="text-sm font-bold text-slate-700 truncate">{selectedUser.name}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">(@{selectedUser.username})</span>
            </>
          ) : (
            <span className="text-sm text-slate-400">เลือกผู้อนุมัติ...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {value && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                autoFocus
                type="text"
                placeholder="พิมพ์เพื่อค้นหาพนักงาน..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(search === '' && e.target.value === ' ' ? '' : e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(user => (
                <div 
                  key={user.id}
                  onClick={() => { onChange(user.id); setIsOpen(false); setSearch(''); }}
                  className={`flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors cursor-pointer group ${
                    value === user.id ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      {user.position} • {user.department}
                    </p>
                  </div>
                  {value === user.id && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">ไม่พบข้อมูลพนักงาน</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Employees = () => {
  const { 
    currentUser, users, addUser, updateUser,
    positions, departments, shifts
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'username' | 'position'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const initialFormData = {
    name: '',
    username: '',
    password: '',
    position: positions[0]?.name || '',
    department: departments[0]?.name || '',
    role: UserRole.EMPLOYEE,
    approver1Id: '',
    approver2Id: '',
    approver3Id: '',
    shiftId: shifts[0]?.id || '',
    attendanceCondition: 'SHIFT' as AttendanceCondition,
    skipGPS: false
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editFormData, setEditFormData] = useState<User | null>(null);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Username,Role,Department,Position,Condition,SkipGPS\n"
      + users.map(u => `${u.id},${u.name},${u.username},${u.role},${u.department},${u.position},${u.attendanceCondition},${u.skipGPS}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUser(formData);
    setIsModalOpen(false);
    setFormData(initialFormData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
      updateUser(editFormData);
      setIsEditModalOpen(false);
      setEditFormData(null);
    }
  };

  const handleResetToDefault = () => {
    if (editFormData) {
      setEditFormData({ ...editFormData, password: '1234' });
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const openEditModal = (user: User) => {
    setEditFormData({ 
      ...user,
      approver1Id: user.approver1Id || '',
      approver2Id: user.approver2Id || '',
      approver3Id: user.approver3Id || '',
      shiftId: user.shiftId || '',
      skipGPS: user.skipGPS || false
    });
    setIsEditModalOpen(true);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    if (sortBy === newSort) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortOrder('asc');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAndFilteredUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, 'th');
    } else if (sortBy === 'username') {
      comparison = a.username.localeCompare(b.username, 'en');
    } else if (sortBy === 'position') {
      comparison = a.position.localeCompare(b.position, 'th');
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const canManage = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.CEO || currentUser?.role === UserRole.OFFICE_MANAGER;
  const potentialApprovers = [...users].sort((a, b) => a.name.localeCompare(b.name, 'th'));

  const renderFormFields = (data: any, setData: any, isEdit = false) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-2">
      <div className="space-y-4">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <UsersIcon className="w-3.5 h-3.5" /> ข้อมูลพื้นฐานพนักงาน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">ชื่อ - นามสกุล</label>
            <input required type="text" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">ตำแหน่ง</label>
            <select className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.position} onChange={e => setData({...data, position: e.target.value})}>
              <option value="">เลือกตำแหน่ง</option>
              {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">แผนก</label>
            <select className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.department} onChange={e => setData({...data, department: e.target.value})}>
              <option value="">เลือกแผนก</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          {!isEdit ? (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">ชื่อผู้ใช้ (Username)</label>
                <input required type="text" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.username} onChange={e => setData({...data, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">รหัสผ่าน</label>
                <input required type="password" placeholder="4 ตัวขึ้นไป" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
              </div>
            </>
          ) : (
            <div className="md:col-span-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-700">ความปลอดภัยของบัญชี</p>
                <p className="text-[10px] text-orange-600/70">Username: @{data.username}</p>
              </div>
              <button 
                type="button" 
                onClick={handleResetToDefault}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  resetSuccess 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-orange-600 hover:bg-orange-600 hover:text-white'
                }`}
              >
                {resetSuccess ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                {resetSuccess ? 'เตรียมรีเซ็ตแล้ว' : 'รีเซ็ตเป็น 1234'}
              </button>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">สิทธิ์การใช้งาน</label>
            <select className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.role} onChange={e => setData({...data, role: e.target.value as UserRole})}>
              {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> ตั้งค่าการทำงานและลงเวลา
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">กะการทำงาน</label>
            <select className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.shiftId} onChange={e => setData({...data, shiftId: e.target.value})}>
              <option value="">ไม่ระบุกะ</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">เงื่อนไขการลงเวลา</label>
            <select className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={data.attendanceCondition} onChange={e => setData({...data, attendanceCondition: e.target.value as AttendanceCondition})}>
              <option value="SHIFT">ลงตามเวลา (กะทำงาน)</option>
              <option value="FLEXIBLE">ลงเมื่อไหร่ก็ได้ในวัน</option>
              <option value="NONE">ไม่ต้องลงเวลางาน</option>
            </select>
          </div>
          <div className="md:col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-200 rounded-lg text-indigo-700">
                <MapPinOff className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-800">ข้ามการตรวจสอบ GPS</p>
                <p className="text-[9px] text-indigo-600/70">อนุญาตให้ลงเวลาได้ทุกที่โดยไม่เช็คพิกัด</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setData({...data, skipGPS: !data.skipGPS})}
              className="transition-transform active:scale-90"
            >
              {data.skipGPS ? (
                <ToggleRight className="w-10 h-10 text-indigo-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> ลำดับการอนุมัติลา
        </h3>
        <div className="grid grid-cols-1 gap-5">
          {[1, 2, 3].map(level => (
            <SearchableSelect 
              key={level}
              label={`ผู้อนุมัติลำดับที่ ${level}`}
              value={data[`approver${level}Id` as keyof typeof data] || ''}
              options={potentialApprovers}
              excludeId={isEdit ? data.id : ''}
              onChange={(id) => setData({...data, [`approver${level}Id`]: id})}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <h1 className="text-2xl font-bold text-slate-800">จัดการบุคลากร</h1>
        <div className="flex w-full md:w-auto gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold text-sm transition-all active:scale-95">+ เพิ่มพนักงาน</button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm"
            placeholder="ค้นหาชื่อ, Username, ตำแหน่ง หรือแผนก..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-sm overflow-x-auto whitespace-nowrap">
           <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">เรียงลำดับ:</div>
           {[
             { id: 'name', label: 'ก-ฮ', icon: sortOrder === 'asc' ? ArrowDownAz : ArrowUpAz },
             { id: 'username', label: 'Username', icon: UserCog },
             { id: 'position', label: 'ตำแหน่ง', icon: Briefcase }
           ].map((option) => {
             const Icon = option.icon;
             const isActive = sortBy === option.id;
             return (
               <button
                 key={option.id}
                 onClick={() => handleSortChange(option.id as any)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                   isActive 
                   ? 'bg-indigo-600 text-white shadow-md' 
                   : 'text-slate-500 hover:bg-slate-50'
                 }`}
               >
                 <Icon className="w-3.5 h-3.5" />
                 {option.label}
                 {isActive && (
                   <span className="ml-1 text-[8px] opacity-70">
                     {sortOrder === 'asc' ? '↑' : '↓'}
                   </span>
                 )}
               </button>
             );
           })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedAndFilteredUsers.map((user) => (
          <div key={user.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-4 mb-4">
              <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-slate-50 shadow-inner object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 truncate text-sm">{user.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <UserIconAlt className="w-2.5 h-2.5" /> @{user.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{user.position}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{user.department}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold border ${
                  user.attendanceCondition === 'SHIFT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  user.attendanceCondition === 'FLEXIBLE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                  'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {user.attendanceCondition === 'SHIFT' ? 'ลงตามกะ' : user.attendanceCondition === 'FLEXIBLE' ? 'ยืดหยุ่น' : 'ไม่ต้องลงเวลา'}
                </span>
                {user.shiftId && (
                  <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    <Clock className="w-2.5 h-2.5 inline mr-1" /> {shifts.find(s => s.id === user.shiftId)?.name}
                  </span>
                )}
                {user.skipGPS && (
                  <span className="text-[9px] text-rose-600 font-black bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 flex items-center gap-1">
                    <MapPinOff className="w-2.5 h-2.5" /> ไม่เช็คพิกัด
                  </span>
                )}
            </div>

            <div className="bg-slate-50/50 rounded-[1.5rem] p-3 border border-slate-100 mt-auto">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                 <Shield className="w-2.5 h-2.5" /> สายงานอนุมัติ
               </p>
               <div className="flex items-center gap-1.5 overflow-x-hidden">
                  <ApproverTag employee={users.find(u => u.id === user.approver1Id)} />
                  <ChevronRight className="w-2 h-2 text-slate-300" />
                  <ApproverTag employee={users.find(u => u.id === user.approver2Id)} />
                  <ChevronRight className="w-2 h-2 text-slate-300" />
                  <ApproverTag employee={users.find(u => u.id === user.approver3Id)} />
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><UsersIcon className="w-4 h-4"/></div>
                เพิ่มพนักงานใหม่
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {renderFormFields(formData, setFormData)}
              <div className="flex gap-4 pt-6 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm active:scale-95">บันทึกข้อมูลพนักงาน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Edit2 className="w-4 h-4"/></div>
                แก้ไขพนักงาน: {editFormData.name}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              {renderFormFields(editFormData, setEditFormData, true)}
              <div className="flex gap-4 pt-6 border-t mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all text-sm active:scale-95">อัปเดตข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
