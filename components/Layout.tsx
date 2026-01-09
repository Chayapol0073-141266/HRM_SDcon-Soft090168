
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  LogOut, 
  Settings, 
  PieChart, 
  Menu,
  Lock,
  X,
  MapPin,
  Calendar,
  Briefcase,
  Bell,
  ChevronRight,
  Circle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { currentUser, logout, changePassword, leaves, users } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // คำนวณรายการลาที่รอการอนุมัติเฉพาะขั้นที่ตรงกับตัวเรา (ID หรือ Role)
  const pendingLeavesForMe = useMemo(() => {
    return leaves.filter(l => 
      l.status === 'PENDING' && 
      (l.currentApproverRole === currentUser?.id || l.currentApproverRole === currentUser?.role)
    );
  }, [leaves, currentUser]);

  const pendingCount = pendingLeavesForMe.length;

  const mainMenuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.CEO, UserRole.OFFICE_MANAGER, UserRole.FACTORY_MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE] },
    { id: 'attendance', label: 'ลงเวลา', icon: Clock, roles: [UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.OFFICE_MANAGER, UserRole.FACTORY_MANAGER] },
    { id: 'leaves', label: 'การลา', icon: CalendarDays, roles: [UserRole.ADMIN, UserRole.CEO, UserRole.OFFICE_MANAGER, UserRole.FACTORY_MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE], badge: pendingCount },
    { id: 'holidays', label: 'วันหยุด', icon: Calendar, roles: [UserRole.ADMIN, UserRole.CEO, UserRole.OFFICE_MANAGER, UserRole.FACTORY_MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE] },
    { id: 'employees', label: 'พนักงาน', icon: Users, roles: [UserRole.ADMIN, UserRole.OFFICE_MANAGER, UserRole.FACTORY_MANAGER] },
    { id: 'reports', label: 'รายงาน', icon: PieChart, roles: [UserRole.ADMIN, UserRole.CEO, UserRole.OFFICE_MANAGER] },
  ];

  const configMenuItems = [
    // ปรับปรุง: ให้เฉพาะ ADMIN เท่านั้นที่เห็นเมนูการตั้งค่าโครงสร้างระบบ
    { id: 'positions', label: 'ตำแหน่ง', icon: Briefcase, roles: [UserRole.ADMIN] },
    { id: 'departments', label: 'แผนก', icon: Users, roles: [UserRole.ADMIN] },
    { id: 'shifts', label: 'กะเวลา', icon: Clock, roles: [UserRole.ADMIN] },
    { id: 'locations', label: 'จุดพิกัด', icon: MapPin, roles: [UserRole.ADMIN] },
  ];

  const userRole = currentUser?.role || UserRole.EMPLOYEE;
  const filteredMain = mainMenuItems.filter(item => item.roles.includes(userRole));
  const filteredConfig = configMenuItems.filter(item => item.roles.includes(userRole));

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
      return;
    }
    const success = changePassword(pwdForm.old, pwdForm.new);
    if (success) {
      setPwdMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อย' });
      setTimeout(() => { setIsPwdModalOpen(false); setPwdForm({ old: '', new: '', confirm: '' }); setPwdMsg(null); }, 1500);
    } else {
      setPwdMsg({ type: 'error', text: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }
  };

  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all
          ${isActive ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
        `}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
          {item.label}
        </div>
        {item.badge > 0 && (
          <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm shadow-rose-200">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center z-[60] flex-shrink-0">
        <div className="flex items-center gap-2 font-black text-orange-600">
          <Briefcase className="w-6 h-6" />
          <span className="text-lg">SD-Con HR</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
             <button onClick={() => { onNavigate('leaves'); setShowNotiDropdown(false); }} className="p-2 relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <Circle className="w-2 h-2 fill-rose-500 text-rose-500 absolute top-1.5 right-1.5" />
             </button>
          )}
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-50 rounded-lg">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-72 bg-white z-[80] md:z-10
        transform transition-transform duration-300 ease-in-out border-r border-slate-100 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-orange-600 text-2xl">
            <Briefcase className="w-8 h-8" />
            <span>SD-Con</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{currentUser?.role}</p>
            </div>
          </div>
          <div className="relative">
             <button 
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                className={`p-2 rounded-xl transition-all relative ${showNotiDropdown ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:bg-slate-50'}`}
             >
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
             </button>
             
             {showNotiDropdown && (
               <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[90] overflow-hidden animate-in fade-in slide-in-from-top-2">
                 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">การแจ้งเตือน</span>
                    {pendingCount > 0 && <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
                 </div>
                 <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {pendingLeavesForMe.length > 0 ? pendingLeavesForMe.map(l => {
                      const requester = users.find(u => u.id === l.userId);
                      return (
                        <button 
                          key={l.id}
                          onClick={() => { onNavigate('leaves'); setShowNotiDropdown(false); }}
                          className="w-full text-left p-4 hover:bg-orange-50 transition-colors flex items-start gap-3"
                        >
                           <img src={requester?.avatar} className="w-8 h-8 rounded-full border border-slate-100" />
                           <div className="min-w-0">
                              <p className="text-xs text-slate-800"><span className="font-bold">{requester?.name.split(' ')[0]}</span> ขอยื่นลา</p>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">"{l.reason}"</p>
                           </div>
                        </button>
                      );
                    }) : (
                      <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase italic">ไม่มีรายการใหม่</div>
                    )}
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6">
          <nav className="space-y-1">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เมนูหลัก</p>
            {filteredMain.map(renderMenuItem)}
          </nav>

          {filteredConfig.length > 0 && (
            <nav className="space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ตั้งค่าระบบ</p>
              {filteredConfig.map(renderMenuItem)}
            </nav>
          )}
        </div>

        <div className="p-4 border-t border-slate-50 space-y-1">
          <button onClick={() => setIsPwdModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-orange-600 rounded-lg text-sm font-bold"><Lock className="w-4 h-4" /> เปลี่ยนรหัส</button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-rose-600 rounded-lg text-sm font-bold"><LogOut className="w-4 h-4" /> ออกจากระบบ</button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full bg-slate-50 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Password Modal */}
      {isPwdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-sm shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h3>
              <button onClick={() => setIsPwdModalOpen(false)} className="text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {pwdMsg && <div className={`text-[11px] p-3 rounded-xl ${pwdMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{pwdMsg.text}</div>}
              <input type="password" required placeholder="รหัสผ่านเดิม" className="w-full border border-slate-100 rounded-xl p-3 bg-slate-50 text-sm" value={pwdForm.old} onChange={e => setPwdForm({...pwdForm, old: e.target.value})} />
              <input type="password" required placeholder="รหัสผ่านใหม่" className="w-full border border-slate-100 rounded-xl p-3 bg-slate-50 text-sm" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} />
              <input type="password" required placeholder="ยืนยันรหัสผ่านใหม่" className="w-full border border-slate-100 rounded-xl p-3 bg-slate-50 text-sm" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPwdModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-xs">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl text-xs">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
