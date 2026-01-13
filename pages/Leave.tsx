
import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/Store.tsx';
import { LeaveRequest, UserRole, User } from '../types';
import { 
  Check, 
  X, 
  Clock, 
  FileText, 
  Paperclip, 
  AlertCircle, 
  Calendar,
  CheckCircle2,
  Info,
  History,
  CalendarDays as CalendarIcon,
  ChevronRight,
  Search,
  Filter,
  Users,
  BarChart3,
  Upload,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  ArrowUpCircle,
  MoreVertical
} from 'lucide-react';

const Leave = () => {
  const { currentUser, leaves, requestLeave, approveLeave, rejectLeave, users } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalFilter, setGlobalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    type: 'SICK' as const,
    startDate: '',
    endDate: '',
    reason: '',
    substituteId: '',
    attachment: '' as string | undefined
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.CEO || currentUser?.role === UserRole.OFFICE_MANAGER;
  const isCEO = currentUser?.role === UserRole.CEO;

  const QUOTAS = {
    VACATION: 6,
    SICK: 30,
    PERSONAL: 6,
    BUSINESS: 10
  };

  const quotaStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const stats = {
      SICK: { approved: 0, pending: 0 },
      VACATION: { approved: 0, pending: 0 },
      PERSONAL: { approved: 0, pending: 0 },
      BUSINESS: { approved: 0, pending: 0 }
    };
    
    leaves
      .filter(l => l.userId === currentUser?.id)
      .forEach(l => {
        const start = new Date(l.startDate);
        if (start.getFullYear() === currentYear) {
          const end = new Date(l.endDate);
          const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          if (l.status === 'APPROVED') {
            stats[l.type].approved += diff;
          } else if (l.status === 'PENDING') {
            stats[l.type].pending += diff;
          }
        }
      });
    return stats;
  }, [leaves, currentUser]);

  const leaveDuration = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }, [formData.startDate, formData.endDate]);

  const isMedicalCertRequired = formData.type === 'SICK' && leaveDuration >= 3;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('ขนาดไฟล์ต้องไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, attachment: reader.result as string });
        setFormError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDynamicApprovalChain = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    
    const chain = [];
    if (user.approver1Id) chain.push(user.approver1Id);
    if (user.approver2Id) chain.push(user.approver2Id);
    if (user.approver3Id) chain.push(user.approver3Id);
    
    if (chain.length === 0) {
      if (user.role === UserRole.EMPLOYEE) return [UserRole.SUPERVISOR, UserRole.OFFICE_MANAGER, UserRole.CEO];
      if (user.role === UserRole.SUPERVISOR) return [UserRole.OFFICE_MANAGER, UserRole.CEO];
      return [UserRole.CEO];
    }
    return chain;
  };

  const getApproverName = (idOrRole?: string) => {
    if (!idOrRole) return 'N/A';
    const user = users.find(u => u.id === idOrRole);
    if (user) return user.name.split(' ')[0];
    return idOrRole;
  };

  const getRoleAbbreviation = (role?: string) => {
    if (!role) return 'N/A';
    switch (role) {
      case UserRole.SUPERVISOR: return 'Sup';
      case UserRole.ADMIN: return 'HR';
      case UserRole.OFFICE_MANAGER: return 'OM';
      case UserRole.FACTORY_MANAGER: return 'PM';
      case UserRole.CEO: return 'CEO';
      default: return typeof role === 'string' ? (role.length > 3 ? role.substring(0, 3) : role) : 'N/A';
    }
  };

  const getApproverInitial = (idOrRole?: string) => {
    if (!idOrRole) return 'N/A';
    const user = users.find(u => u.id === idOrRole);
    if (user) return getRoleAbbreviation(user.role);
    return getRoleAbbreviation(idOrRole);
  };

  const pendingApprovals = useMemo(() => {
    return leaves.filter(l => 
      l.status === 'PENDING' && 
      (l.currentApproverRole === currentUser?.id || l.currentApproverRole === currentUser?.role)
    );
  }, [leaves, currentUser]);

  const myLeaves = useMemo(() => {
    return leaves.filter(l => l.userId === currentUser?.id).slice().sort((a,b) => b.startDate.localeCompare(a.startDate));
  }, [leaves, currentUser]);

  const filteredGlobalLeaves = useMemo(() => {
    return leaves
      .filter(l => {
        const user = users.find(u => u.id === l.userId);
        const matchesSearch = user?.name.toLowerCase().includes(globalSearch.toLowerCase()) || l.reason.toLowerCase().includes(globalSearch.toLowerCase());
        const matchesFilter = globalFilter === 'ALL' || l.status === globalFilter;
        return matchesSearch && matchesFilter;
      })
      .slice().sort((a,b) => b.startDate.localeCompare(a.startDate));
  }, [leaves, users, globalSearch, globalFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isMedicalCertRequired && !formData.attachment) {
      setFormError('ลาป่วยตั้งแต่ 3 วันขึ้นไป จำเป็นต้องแนบใบรับรองแพทย์');
      return;
    }
    if (leaveDuration <= 0) {
      setFormError('วันที่สิ้นสุดต้องไม่ก่อนหน้าวันที่เริ่ม');
      return;
    }
    const currentStats = quotaStats[formData.type];
    const maxQuota = QUOTAS[formData.type];
    const available = maxQuota - (currentStats.approved + currentStats.pending);
    if (leaveDuration > available) {
      setFormError(`โควต้าคงเหลือไม่เพียงพอ (เหลือที่ลาได้จริง ${available} วัน)`);
      return;
    }

    requestLeave(formData);
    setShowForm(false);
    setFormData({ type: 'SICK', startDate: '', endDate: '', reason: '', substituteId: '', attachment: undefined });
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'SICK': return 'ลาป่วย';
      case 'VACATION': return 'ลาพักร้อน';
      case 'PERSONAL': return 'ลากิจ';
      case 'BUSINESS': return 'อื่น ๆ';
      default: return type;
    }
  };

  const ApprovalStepper = ({ leave }: { leave: LeaveRequest }) => {
    const chain = getDynamicApprovalChain(leave.userId);
    const currentIndex = chain.indexOf(leave.currentApproverRole as string);

    return (
      <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-2">
        {chain.map((idOrRole, idx) => {
          const isCompleted = leave.status === 'APPROVED' || (leave.status === 'PENDING' && idx < currentIndex) || (leave.status === 'REJECTED' && idx < currentIndex);
          const isCurrent = leave.status === 'PENDING' && idx === currentIndex;
          const isRejected = leave.status === 'REJECTED' && idx === currentIndex;

          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-1 shrink-0 min-w-[2.5rem]">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all relative ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 
                  isRejected ? 'bg-rose-500 border-rose-500 text-white shadow-sm' :
                  isCurrent ? 'bg-white border-amber-500 text-amber-600 shadow-md animate-pulse scale-105' : 
                  'bg-slate-50 border-slate-100 text-slate-300'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : 
                   isRejected ? <X className="w-3.5 h-3.5" /> :
                   <span className="text-[8px] font-black">{getApproverInitial(idOrRole)}</span>}
                </div>
                <span className={`text-[8px] font-bold truncate max-w-[3rem] text-center ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {getApproverName(idOrRole)}
                </span>
              </div>
              {idx < chain.length - 1 && (
                <div className={`h-[1px] w-4 shrink-0 -mt-3.5 transition-colors ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden px-1 text-slate-700 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">จัดการการลา</h1>
          <p className="text-xs md:text-sm text-slate-500">ตรวจสอบโควต้าและอนุมัติใบลา</p>
        </div>
        {!isCEO && (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <FileText className="w-4 h-4" /> สร้างคำขอลาใหม่
          </button>
        )}
      </div>

      {pendingApprovals.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-[2.5rem] p-4 md:p-6 shadow-xl animate-in slide-in-from-top duration-500">
          <h3 className="font-black text-amber-800 flex items-center gap-3 uppercase tracking-widest text-[10px] md:text-xs mb-6">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200 animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
            รอคุณพิจารณา ({pendingApprovals.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map(request => (
              <div key={request.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                   <div className="flex items-center gap-3">
                      <img src={users.find(u => u.id === request.userId)?.avatar} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{users.find(u => u.id === request.userId)?.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[120px]">{users.find(u => u.id === request.userId)?.department}</p>
                      </div>
                   </div>
                   <span className="text-[9px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black uppercase border border-indigo-100 shrink-0">{getTypeLabel(request.type)}</span>
                </div>

                <div className="space-y-1">
                   <p className="text-[11px] font-black text-slate-700 flex items-center gap-2">
                     <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                     {new Date(request.startDate).toLocaleDateString('th-TH')} - {new Date(request.endDate).toLocaleDateString('th-TH')}
                   </p>
                   <p className="text-[10px] text-indigo-600 font-bold ml-5">ระยะเวลา {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} วัน</p>
                   <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">" {request.reason} "</p>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => approveLeave(request.id)} className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 font-black shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 text-xs active:scale-95"><ThumbsUp className="w-4 h-4" /> อนุมัติ</button>
                  <button onClick={() => rejectLeave(request.id)} className="flex-1 py-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 font-black shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-xs active:scale-95"><ThumbsDown className="w-4 h-4" /> ปฏิเสธ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-base md:text-lg">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Users className="w-5 h-5" />
              </div>
              ภาพรวมการลาของพนักงานทั้งหมด
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" placeholder="ค้นชื่อ..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
              </div>
              <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-600 flex-1 sm:flex-none" value={globalFilter} onChange={e => setGlobalFilter(e.target.value as any)}>
                <option value="ALL">ทุกสถานะ</option>
                <option value="PENDING">รออนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ปฏิเสธ</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">พนักงาน</th>
                  <th className="px-6 py-4">ประเภท/เหตุผล</th>
                  <th className="px-6 py-4">ระยะเวลา</th>
                  <th className="px-6 py-4">ขั้นตอนการอนุมัติ</th>
                  <th className="px-6 py-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredGlobalLeaves.map(leave => {
                  const isMyTurn = leave.status === 'PENDING' && (leave.currentApproverRole === currentUser?.id || leave.currentApproverRole === currentUser?.role);
                  const canOverride = isAdmin && leave.status === 'PENDING' && !isMyTurn;

                  return (
                    <tr key={leave.id} className={`hover:bg-slate-50/50 transition-colors ${isMyTurn ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={users.find(u => u.id === leave.userId)?.avatar} className="w-9 h-9 rounded-full shadow-inner border border-white shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 truncate text-sm">{users.find(u => u.id === leave.userId)?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-tight">{users.find(u => u.id === leave.userId)?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-white shadow-sm border-slate-100">{getTypeLabel(leave.type)}</span>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic max-w-[150px]">"{leave.reason}"</p>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold">
                        <p className="text-slate-700">{new Date(leave.startDate).toLocaleDateString('th-TH')}</p>
                        <p className="text-indigo-500">รวม {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} วัน</p>
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <ApprovalStepper leave={leave} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === 'APPROVED' ? (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> สำเร็จ
                          </span>
                        ) : leave.status === 'REJECTED' ? (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 inline-flex items-center gap-1.5 shadow-sm">
                            <X className="w-3.5 h-3.5" /> ปฏิเสธ
                          </span>
                        ) : isMyTurn ? (
                          <div className="flex justify-end gap-2">
                             <button onClick={() => approveLeave(leave.id)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-90"><ThumbsUp className="w-3.5 h-3.5" /></button>
                             <button onClick={() => rejectLeave(leave.id)} className="p-2 bg-rose-500 text-white rounded-xl shadow-md transition-all active:scale-90"><ThumbsDown className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : canOverride ? (
                          <div className="flex justify-end gap-1">
                             <button onClick={() => approveLeave(leave.id)} className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm" title="Override"><ArrowUpCircle className="w-3.5 h-3.5" /></button>
                             <button onClick={() => rejectLeave(leave.id)} className="p-2 bg-rose-400 text-white rounded-lg shadow-sm"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-tighter">รอ: {getApproverName(leave.currentApproverRole as string)}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-slate-50">
             {filteredGlobalLeaves.map(leave => {
                const isMyTurn = leave.status === 'PENDING' && (leave.currentApproverRole === currentUser?.id || leave.currentApproverRole === currentUser?.role);
                const user = users.find(u => u.id === leave.userId);
                
                return (
                  <div key={leave.id} className={`p-4 md:p-6 space-y-4 ${isMyTurn ? 'bg-amber-50/30' : ''}`}>
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <img src={user?.avatar} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm" />
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{user?.department}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                           <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border bg-white shadow-xs border-slate-100">{getTypeLabel(leave.type)}</span>
                           <p className="text-[9px] font-bold text-indigo-500">{Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} วัน</p>
                        </div>
                     </div>

                     <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 mb-2 flex items-center gap-2">
                           <Calendar className="w-3 h-3" />
                           {new Date(leave.startDate).toLocaleDateString('th-TH')} - {new Date(leave.endDate).toLocaleDateString('th-TH')}
                        </p>
                        <p className="text-[11px] text-slate-600 italic">" {leave.reason} "</p>
                     </div>

                     <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ลำดับการอนุมัติ</p>
                        <ApprovalStepper leave={leave} />
                     </div>

                     <div className="flex justify-between items-center pt-2">
                        <div className="flex-1">
                           {leave.status === 'PENDING' && (
                              <p className="text-[10px] font-bold text-amber-600 animate-pulse">
                                รอ: {getApproverName(leave.currentApproverRole as string)}
                              </p>
                           )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                           {leave.status === 'APPROVED' ? (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว</span>
                           ) : leave.status === 'REJECTED' ? (
                              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> ปฏิเสธ</span>
                           ) : isMyTurn ? (
                              <div className="flex gap-2">
                                 <button onClick={() => approveLeave(leave.id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100"><ThumbsUp className="w-4 h-4" /></button>
                                 <button onClick={() => rejectLeave(leave.id)} className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-100"><ThumbsDown className="w-4 h-4" /></button>
                              </div>
                           ) : isAdmin && leave.status === 'PENDING' ? (
                              <button onClick={() => approveLeave(leave.id)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">Admin Override</button>
                           ) : (
                              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">กำลังพิจารณา...</span>
                           )}
                        </div>
                     </div>
                  </div>
                );
             })}
             {filteredGlobalLeaves.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-sm">ไม่พบข้อมูลตามเงื่อนไขที่กรอง</div>
             )}
          </div>
        </div>
      )}

      {!isCEO && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuotaCard label="ลาป่วย" stats={quotaStats.SICK} total={QUOTAS.SICK} color="rose" />
          <QuotaCard label="ลาพักร้อน" stats={quotaStats.VACATION} total={QUOTAS.VACATION} color="indigo" />
          <QuotaCard label="ลากิจ" stats={quotaStats.PERSONAL} total={QUOTAS.PERSONAL} color="amber" />
          <QuotaCard label="อื่น ๆ" stats={quotaStats.BUSINESS} total={QUOTAS.BUSINESS} color="emerald" />
        </div>
      )}

      {!isCEO && (
        <div className="space-y-4">
          <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4" /> ประวัติการลาของคุณ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myLeaves.map(leave => (
              <div key={leave.id} className="bg-white p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${leave.status === 'APPROVED' ? 'bg-emerald-500' : leave.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`p-2.5 rounded-2xl ${leave.type === 'SICK' ? 'bg-rose-50 text-rose-500' : leave.type === 'VACATION' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-500'}`}><CalendarIcon className="w-5 h-5" /></div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase border ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{leave.status}</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold text-slate-800 text-sm">{getTypeLabel(leave.type)}</h4>
                  <p className="text-[11px] text-slate-600 font-bold mt-1">{new Date(leave.startDate).toLocaleDateString('th-TH')} - {new Date(leave.endDate).toLocaleDateString('th-TH')}</p>
                  <p className="text-[11px] text-slate-400 mt-2 italic line-clamp-2 bg-slate-50/50 p-3 rounded-xl">"{leave.reason}"</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-50 relative z-10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">สถานะปัจจุบัน</p>
                  <ApprovalStepper leave={leave} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100"><FileText className="w-4 h-4"/></div> ยื่นคำขอลาหยุด
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in"><AlertCircle className="w-5 h-5 flex-shrink-0" /> <p className="font-bold">{formError}</p></div>
              )}

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">เลือกประเภทการลา</label>
                <div className="grid grid-cols-2 gap-3">
                  {['SICK', 'VACATION', 'PERSONAL', 'BUSINESS'].map((t) => (
                    <button key={t} type="button" onClick={() => setFormData({...formData, type: t as any})} className={`py-3 px-4 rounded-2xl border-2 text-xs font-bold transition-all text-left flex justify-between items-center ${formData.type === t ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-slate-100 bg-slate-50/50 text-slate-500'}`}>{getTypeLabel(t as any)} {formData.type === t && <CheckCircle2 className="w-4 h-4" />}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">เริ่มวันที่</label>
                  <input type="date" required className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 text-sm focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ถึงวันที่</label>
                  <input type="date" required className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 text-sm focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              {leaveDuration > 0 && (
                <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <div className="flex items-center gap-3"><Clock className="w-5 h-5 opacity-80" /> <span className="text-xs font-bold uppercase tracking-wider">ระยะเวลาทั้งหมด</span></div>
                  <span className="text-xl font-black">{leaveDuration} วัน</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">เหตุผลในการลา</label>
                <textarea required rows={3} className="w-full border border-slate-200 rounded-2xl px-4 py-4 bg-slate-50 text-sm focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner" placeholder="ระบุเหตุผลการลา..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">ยกเลิก</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm active:scale-95">ส่งคำขอ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const QuotaCard = ({ label, stats, total, color }: any) => {
  const approved = stats.approved;
  const pending = stats.pending;
  const available = total - (approved + pending);
  const usedPercentage = (approved / total) * 100;
  const pendingPercentage = (pending / total) * 100;

  const colorClasses: any = { rose: 'bg-rose-50 text-rose-600 border-rose-100', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', amber: 'bg-amber-50 text-amber-600 border-amber-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  const barClasses: any = { rose: 'bg-rose-500', indigo: 'bg-indigo-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500' };

  return (
    <div className={`p-5 rounded-[2rem] border ${colorClasses[color]} shadow-sm hover:shadow-md transition-shadow`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{label}</p>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-black">{available}</span>
        <span className="text-[10px] font-bold opacity-50">/ {total} วันคงเหลือ</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden flex">
          <div className={`h-full ${barClasses[color]} transition-all duration-500`} style={{ width: `${usedPercentage}%` }} />
          <div className="h-full bg-slate-300 opacity-50 transition-all duration-500" style={{ width: `${pendingPercentage}%` }} />
        </div>
        <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter opacity-40"><span>ใช้ไป {approved}</span><span>รอผล {pending}</span></div>
      </div>
    </div>
  );
};

export default Leave;
