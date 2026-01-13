
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
  UserCog,
  Briefcase,
  ChevronDown,
  MapPinOff,
  ToggleLeft,
  ToggleRight,
  FileText,
  RotateCcw,
  CheckCircle2
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
            </>
          ) : (
            <span className="text-sm text-slate-400">เลือกผู้อนุมัติ...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <input 
              autoFocus
              type="text"
              placeholder="ค้นหาพนักงาน..."
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.map(user => (
              <div 
                key={user.id}
                onClick={() => { onChange(user.id); setIsOpen(false); }}
                className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer"
              >
                <img src={user.avatar} className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Employees = () => {
  const { 
    currentUser, users, addUser, updateUser, adminResetPassword,
    positions, departments, shifts
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
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
    skipGPS: false,
    skipGPSReason: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editFormData, setEditFormData] = useState<User | null>(null);

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

  const handleResetPassword = async () => {
    if (editFormData) {
      const success = await adminResetPassword(editFormData.id, '123456');
      if (success) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.OFFICE_MANAGER;

  const renderFormFields = (data: any, setData: any, isEdit = false) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-2">
      {/* ข้อมูลพนักงาน */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <UsersIcon className="w-3.5 h-3.5" /> ข้อมูลพนักงาน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">ชื่อ - นามสกุล</label>
            <input required type="text" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">ตำแหน่ง</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm" value={data.position} onChange={e => setData({...data, position: e.target.value})}>
              {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">แผนก</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm" value={data.department} onChange={e => setData({...data, department: e.target.value})}>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          {!isEdit && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">ชื่อผู้ใช้</label>
              <input required type="text" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none" value={data.username} onChange={e => setData({...data, username: e.target.value})} />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">สิทธิ์การใช้งาน</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm" value={data.role} onChange={e => setData({...data, role: e.target.value as UserRole})}>
              {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* รีเซ็ตรหัสผ่าน (เฉพาะหน้าแก้ไข) */}
      {isEdit && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> ความปลอดภัยของบัญชี
          </h3>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-800">รีเซ็ตรหัสผ่านพนักงาน</p>
              <p className="text-[9px] text-rose-600/70">รหัสผ่านจะถูกเปลี่ยนเป็น "123456" ทันที</p>
            </div>
            <button 
              type="button"
              onClick={handleResetPassword}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all active:scale-95 ${
                resetSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {resetSuccess ? <><CheckCircle2 className="w-3 h-3" /> รีเซ็ตสำเร็จ!</> : <><RotateCcw className="w-3 h-3" /> รีเซ็ตเป็น 123456</>}
            </button>
          </div>
        </div>
      )}

      {/* ตั้งค่าการลงเวลา */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> เงื่อนไขการลงเวลา
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">ประเภทการลงเวลา</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm" 
              value={data.attendanceCondition} 
              onChange={e => setData({...data, attendanceCondition: e.target.value as AttendanceCondition})}
            >
              <option value="SHIFT">ลงตามเวลา (กะทำงาน)</option>
              <option value="FLEXIBLE">ยืดหยุ่น (เวลาไหนก็ได้)</option>
              <option value="NONE">ไม่ต้องลงเวลา</option>
            </select>
          </div>
          
          {data.attendanceCondition === 'SHIFT' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">เลือกกะการทำงาน</label>
              <select 
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm" 
                value={data.shiftId || ''} 
                onChange={e => setData({...data, shiftId: e.target.value})}
              >
                <option value="">-- เลือกกะงาน --</option>
                {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <MapPinOff className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-indigo-800">ข้ามการตรวจสอบ GPS</p>
                <p className="text-[9px] text-indigo-600/70">อนุญาตให้ลงเวลาได้ทุกที่โดยไม่ต้องเช็คระยะ</p>
              </div>
            </div>
            <button type="button" onClick={() => setData({...data, skipGPS: !data.skipGPS})}>
              {data.skipGPS ? <ToggleRight className="w-10 h-10 text-indigo-600" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
            </button>
          </div>
          {data.skipGPS && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">เหตุผลการยกเว้น</label>
              <input 
                type="text" 
                placeholder="ระบุเหตุผล เช่น งานนอกสถานที่ประจำ" 
                className="w-full mt-1 px-4 py-2 rounded-xl border border-indigo-200 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                value={data.skipGPSReason || ''}
                onChange={e => setData({...data, skipGPSReason: e.target.value})}
              />
            </div>
          )}
        </div>
      </div>

      {/* ผู้อนุมัติ */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> ลำดับการอนุมัติลา
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(level => (
            <SearchableSelect 
              key={level}
              label={`ผู้อนุมัติลำดับที่ ${level}`}
              value={data[`approver${level}Id` as keyof typeof data] || ''}
              options={users.filter(u => u.id !== (isEdit ? data.id : ''))}
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
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl shadow-lg font-bold text-sm">+ เพิ่มพนักงาน</button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white outline-none text-sm"
          placeholder="ค้นหาพนักงาน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all">
            <div className="flex items-start gap-4 mb-4">
              <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-slate-50 object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 truncate text-sm">{user.name}</h3>
                  {canManage && (
                    <button onClick={() => { setEditFormData(user); setIsEditModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <p className="text-[10px] text-indigo-500 font-black uppercase">{user.position}</p>
                <div className="flex items-center gap-2 mt-2">
                   {user.skipGPS && (
                     <div className="group relative">
                       <MapPinOff className="w-3.5 h-3.5 text-rose-500" />
                       <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                         ข้าม GPS: {user.skipGPSReason || 'ไม่ได้ระบุเหตุผล'}
                       </div>
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-[1.5rem] p-3 border border-slate-100">
               <div className="flex items-center gap-1.5 overflow-hidden">
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

      {/* Modal: เพิ่มพนักงาน */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h2 className="text-xl font-bold text-slate-800">เพิ่มพนักงานใหม่</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {renderFormFields(formData, setFormData)}
              <div className="flex gap-4 pt-6 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 font-bold text-sm text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-100 active:scale-95">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: แก้ไขพนักงาน */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h2 className="text-xl font-bold text-slate-800">แก้ไขข้อมูล: {editFormData.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              {renderFormFields(editFormData, setEditFormData, true)}
              <div className="flex gap-4 pt-6 border-t mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 font-bold text-sm text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-100 active:scale-95">อัปเดตข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
