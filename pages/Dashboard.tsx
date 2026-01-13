
import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole } from '../types';
import { FINANCIAL_DATA } from '../constants';
import { generateHRInsights } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Sparkles, TrendingUp, Users, AlertCircle, DollarSign, Package, Clock, MapPin, CheckCircle, AlertTriangle, Bell, ChevronRight, X, Navigation, Newspaper, Calendar as CalendarIcon, Megaphone, Camera } from 'lucide-react';

const COLORS = ['#818CF8', '#34D399', '#F472B6', '#FBBF24', '#60A5FA', '#A78BFA', '#F87171'];

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser, users, attendance, leaves, holidays } = useStore();
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const myTodayRecord = attendance.find(a => a.userId === currentUser?.id && a.date === today);

  const pendingApprovalsCount = leaves.filter(
    l => l.status === 'PENDING' && l.currentApproverRole === currentUser?.role
  ).length;

  const personnelStats = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(user => {
      const dept = user.department || 'ไม่ระบุแผนก';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const calculateWorkTime = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffMinutes < 0) diffMinutes += 1440;
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h} ชม. ${m} นาที`;
  };

  const isExecutive = currentUser?.role === UserRole.CEO || currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.OFFICE_MANAGER || currentUser?.role === UserRole.FACTORY_MANAGER;
  const isCEO = currentUser?.role === UserRole.CEO;
  const canSeeFinancials = currentUser?.role === UserRole.CEO || currentUser?.role === UserRole.OFFICE_MANAGER;

  const myRecentAttendance = attendance
    .filter(rec => rec.userId === currentUser?.id)
    .slice(-5)
    .reverse();

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const context = JSON.stringify({
      role: currentUser?.role,
      name: currentUser?.name,
      financials: canSeeFinancials ? FINANCIAL_DATA.slice(-3) : [],
      personnel: isExecutive ? personnelStats : [],
      attendance: {
        present: attendance.filter(a => a.status === 'NORMAL').length,
        late: attendance.filter(a => a.status === 'LATE').length,
      },
      pendingLeaves: leaves.filter(l => l.status === 'PENDING').length
    });
    
    const result = await generateHRInsights(context);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-6">
      {showNotification && pendingApprovalsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 md:p-5 shadow-lg shadow-amber-200/50 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div className="text-white">
              <h4 className="font-black text-sm md:text-base">แจ้งเตือนผู้อนุมัติ!</h4>
              <p className="text-[11px] md:text-xs font-medium text-amber-50 opacity-90">คุณมีคำขอลาจากพนักงานค้างอยู่ {pendingApprovalsCount} รายการ ที่รอการอนุมัติ</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => onNavigate && onNavigate('leaves')}
              className="flex-1 md:flex-none bg-white text-orange-600 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors shadow-sm active:scale-95"
            >
              ตรวจสอบเลย <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowNotification(false)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">ยินดีต้อนรับ, {currentUser?.name.split(' ')[0]} 👋</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">สรุปสถานการณ์ประจำวันของคุณ</p>
        </div>
        <button 
          onClick={handleGetInsight}
          disabled={loadingInsight}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm font-bold active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          {loadingInsight ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำ AI'}
        </button>
      </div>

      {insight && (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-5 md:p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top duration-500">
          <h3 className="flex items-center gap-2 font-bold text-indigo-700 mb-2 text-sm md:text-base">
            <Sparkles className="w-5 h-5" /> บทวิเคราะห์จาก Gemini
          </h3>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed text-xs md:text-sm">{insight}</p>
        </div>
      )}

      {isExecutive && (
        <div className={`grid gap-3 md:gap-4 ${canSeeFinancials ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          {canSeeFinancials && <MetricCard title="รายรับรวม" value="฿450,200" trend="+12.5%" icon={DollarSign} color="text-emerald-500" />}
          <MetricCard title="พนักงานทั้งหมด" value={users.length} trend={`+${users.length}`} icon={Users} color="text-blue-500" />
          {canSeeFinancials && <MetricCard title="สต๊อกรวม" value="฿1.2M" trend="-2.1%" icon={Package} color="text-orange-500" />}
          {canSeeFinancials && <MetricCard title="ระดับความเสี่ยง" value="ต่ำ" trend="คงที่" icon={AlertCircle} color="text-indigo-500" />}
        </div>
      )}

      {!isCEO && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 text-base md:text-lg">
                <Clock className="w-5 h-5 text-orange-500" /> ลงเวลาทำงานของคุณ
              </h3>
           </div>

           <div className="p-6 md:p-10 bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <CalendarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">ประจำวันที่: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-slate-400">กรุณาถ่ายรูปเพื่อยืนยันการลงเวลางาน</p>
                  </div>
                </div>

                <div className="w-full">
                  {!myTodayRecord?.checkIn ? (
                    <button
                      onClick={() => onNavigate && onNavigate('attendance')}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-8 md:py-12 rounded-[2.5rem] transition-all shadow-2xl shadow-orange-200 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 active:scale-95 group"
                    >
                      <Camera className="w-10 h-10 md:w-16 md:h-16 group-hover:scale-110 transition-transform" />
                      <span className="text-3xl md:text-5xl uppercase tracking-tight">ลงเวลาเข้างาน</span>
                    </button>
                  ) : !myTodayRecord?.checkOut ? (
                    <button
                      onClick={() => onNavigate && onNavigate('attendance')}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-8 md:py-12 rounded-[2.5rem] transition-all shadow-2xl shadow-rose-200 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 active:scale-95 group"
                    >
                      <Camera className="w-10 h-10 md:w-16 md:h-16 group-hover:scale-110 transition-transform" />
                      <span className="text-3xl md:text-5xl uppercase tracking-tight">ลงเวลาเลิกงาน</span>
                    </button>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center py-10 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100 shadow-inner">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                      <p className="text-2xl font-black text-emerald-700">ลงเวลาครบถ้วนแล้ว</p>
                      <p className="text-lg font-bold text-emerald-600 mt-2">
                        {myTodayRecord.checkIn} - {myTodayRecord.checkOut}
                      </p>
                    </div>
                  )}
                </div>
              </div>
           </div>

           <div className="p-4 md:p-6 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">ประวัติล่าสุด</p>
              {myRecentAttendance.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${rec.status === 'NORMAL' ? 'bg-emerald-400' : 'bg-rose-400 shadow-lg shadow-rose-200'}`}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">เข้า: {rec.checkIn} {rec.checkOut && `| ออก: ${rec.checkOut}`}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {new Date(rec.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            {rec.checkOut && <span className="text-emerald-600 ml-2 font-bold"> (ทำงาน {calculateWorkTime(rec.checkIn, rec.checkOut)})</span>}
                          </p>
                        </div>
                    </div>
                    {rec.photoIn && (
                      <img src={rec.photoIn} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-50 shadow-sm" alt="CheckIn Thumb" />
                    )}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, trend, icon: Icon, color }: any) => (
  <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div className="min-w-0">
      <p className="text-slate-500 text-[10px] md:text-sm font-medium truncate">{title}</p>
      <h4 className="text-lg md:text-2xl font-bold text-slate-800 mt-1">{value}</h4>
      <p className="text-[9px] md:text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        {trend}
      </p>
    </div>
    <div className={`p-2 md:p-3 rounded-xl bg-slate-50 ${color} flex-shrink-0`}>
      <Icon className="w-5 h-5 md:w-6 h-6" />
    </div>
  </div>
);

export default Dashboard;
