
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole, User, AttendanceRecord, LeaveRequest } from '../types';
import html2pdf from 'html2pdf.js';
import { 
  Calendar, 
  Search, 
  FileDown, 
  Filter, 
  UserCheck, 
  UserMinus, 
  Clock, 
  AlertCircle,
  MapPin,
  X,
  Navigation,
  Loader2,
  ChevronRight,
  Camera,
  Maximize2,
  Activity
} from 'lucide-react';

const Reports = () => {
  const { users, attendance, leaves } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [viewLocation, setViewLocation] = useState<{ lat: number; lng: number; userName: string; time: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const departments = useMemo(() => {
    const depts = users.map(u => u.department);
    return ['ALL', ...Array.from(new Set(depts))];
  }, [users]);

  const reportData = useMemo(() => {
    return users
      .filter(u => deptFilter === 'ALL' || u.department === deptFilter)
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(user => {
        const attend = attendance.find(a => a.userId === user.id && a.date === selectedDate);
        const leave = leaves.find(l => 
          l.userId === user.id && 
          l.status === 'APPROVED' && 
          selectedDate >= l.startDate && 
          selectedDate <= l.endDate
        );

        let status: 'NORMAL' | 'LATE' | 'LEAVE' | 'ABSENT' | 'PENDING' = 'PENDING';
        let checkInTime = attend?.checkIn || '-';
        let checkOutTime = attend?.checkOut || '-';

        if (leave) {
          status = 'LEAVE';
        } else if (user.attendanceCondition === 'NONE') {
          status = 'NORMAL';
          checkInTime = 'Flexible';
          checkOutTime = 'Flexible';
        } else if (attend) {
          status = attend.status === 'LATE' ? 'LATE' : 'NORMAL';
        } else {
          const now = new Date();
          const isToday = selectedDate === now.toISOString().split('T')[0];
          if (isToday && now.getHours() >= 10) {
            status = 'ABSENT';
          } else if (!isToday) {
            status = 'ABSENT';
          }
        }

        return { 
          user, 
          checkIn: checkInTime, 
          checkOut: checkOutTime, 
          status, 
          location: attend?.location,
          photoIn: attend?.photoIn,
          photoOut: attend?.photoOut
        };
      })
      .filter(row => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ABSENT_PENDING') return row.status === 'ABSENT' || row.status === 'PENDING';
        return row.status === statusFilter;
      });
  }, [users, attendance, leaves, selectedDate, deptFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    // We calculate stats from unfiltered data to show total correctly
    const allData = users.map(user => {
      const attend = attendance.find(a => a.userId === user.id && a.date === selectedDate);
      const leave = leaves.find(l => l.userId === user.id && l.status === 'APPROVED' && selectedDate >= l.startDate && selectedDate <= l.endDate);
      if (leave) return 'LEAVE';
      if (user.attendanceCondition === 'NONE') return 'NORMAL';
      if (attend) return attend.status === 'LATE' ? 'LATE' : 'NORMAL';
      return 'ABSENT';
    });

    return {
      total: allData.length,
      present: allData.filter(s => s === 'NORMAL').length,
      late: allData.filter(s => s === 'LATE').length,
      leave: allData.filter(s => s === 'LEAVE').length,
      absent: allData.filter(s => s === 'ABSENT').length,
    };
  }, [users, attendance, leaves, selectedDate]);

  const handleExportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    setIsExporting(true);
    const opt = {
      margin: [0.5, 0.5],
      filename: `attendance_report_${selectedDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL': return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">มาทำงาน</span>;
      case 'LATE': return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">มาสาย</span>;
      case 'LEAVE': return <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">ลาหยุด</span>;
      case 'ABSENT': return <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100">ขาดงาน</span>;
      default: return <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">ยังไม่ลงเวลา</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">รายงานการเข้างาน</h1>
          <p className="text-slate-500 text-xs md:text-sm">สรุปสถานการณ์ประจำวัน</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow-lg disabled:opacity-50 min-h-[40px]"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {isExporting ? 'Creating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div id="report-content" className="space-y-6 bg-slate-50/50 p-1 md:p-2 rounded-xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="มาทำงาน" value={stats.present} total={stats.total} icon={UserCheck} color="emerald" onClick={() => setStatusFilter('NORMAL')} active={statusFilter === 'NORMAL'} />
          <StatCard title="มาสาย" value={stats.late} total={stats.total} icon={Clock} color="amber" onClick={() => setStatusFilter('LATE')} active={statusFilter === 'LATE'} />
          <StatCard title="ลาหยุด" value={stats.leave} total={stats.total} icon={AlertCircle} color="indigo" onClick={() => setStatusFilter('LEAVE')} active={statusFilter === 'LEAVE'} />
          <StatCard title="ขาด/รอ" value={stats.absent} total={stats.total} icon={UserMinus} color="rose" onClick={() => setStatusFilter('ABSENT_PENDING')} active={statusFilter === 'ABSENT_PENDING'} />
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-3 items-center no-print">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-56">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white cursor-pointer"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'ALL' ? 'ทุกแผนก' : dept}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-56">
              <Activity className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="NORMAL">มาทำงาน</option>
                <option value="LATE">มาสาย</option>
                <option value="LEAVE">ลาหยุด</option>
                <option value="ABSENT_PENDING">ขาด/ยังไม่ลงเวลา</option>
              </select>
            </div>
            { (statusFilter !== 'ALL' || deptFilter !== 'ALL' || searchTerm !== '') && (
              <button 
                onClick={() => { setStatusFilter('ALL'); setDeptFilter('ALL'); setSearchTerm(''); }}
                className="text-rose-500 hover:text-rose-600 text-xs font-bold px-4 py-2 whitespace-nowrap"
              >
                ล้างการกรอง
              </button>
            )}
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 bg-slate-50 border-b border-slate-100 py-3 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="col-span-4">พนักงาน</div>
            <div className="col-span-2">แผนก / ตำแหน่ง</div>
            <div className="col-span-2 text-center">เข้างาน (Photo)</div>
            <div className="col-span-2 text-center">ออกงาน (Photo)</div>
            <div className="col-span-2 text-right">สถานะ</div>
          </div>

          <div className="divide-y divide-slate-100">
            {reportData.map((row) => (
              <div key={row.user.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors">
                <div className="flex md:hidden flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img src={row.user.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{row.user.name}</p>
                        <p className="text-[10px] text-slate-400">{row.user.department}</p>
                      </div>
                    </div>
                    {getStatusBadge(row.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">IN</p>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-sm font-mono font-bold ${row.checkIn === 'Flexible' ? 'text-indigo-400 italic' : 'text-slate-700'}`}>{row.checkIn}</span>
                        {row.photoIn && (
                          <div className="relative group cursor-pointer" onClick={() => setPreviewImage({ url: row.photoIn!, title: `เข้างาน: ${row.user.name}` })}>
                             <img src={row.photoIn} className="w-12 h-12 rounded-lg object-cover border border-white shadow-sm" />
                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"><Maximize2 className="w-3 h-3 text-white"/></div>
                          </div>
                        )}
                        {row.location && (
                          <button onClick={() => setViewLocation({...row.location!, userName: row.user.name, time: row.checkIn})} className="text-indigo-500"><MapPin className="w-3 h-3"/></button>
                        )}
                      </div>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">OUT</p>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-sm font-mono font-bold ${row.checkOut === 'Flexible' ? 'text-indigo-400 italic' : 'text-slate-700'}`}>{row.checkOut}</span>
                        {row.photoOut && (
                          <div className="relative group cursor-pointer" onClick={() => setPreviewImage({ url: row.photoOut!, title: `เลิกงาน: ${row.user.name}` })}>
                             <img src={row.photoOut} className="w-12 h-12 rounded-lg object-cover border border-white shadow-sm" />
                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"><Maximize2 className="w-3 h-3 text-white"/></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-12 items-center text-sm">
                  <div className="col-span-4 flex items-center gap-3">
                    <img src={row.user.avatar} className="w-8 h-8 rounded-full" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{row.user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{row.user.username}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-700 text-xs truncate">{row.user.department}</p>
                    <p className="text-[10px] text-slate-400 truncate">{row.user.position}</p>
                  </div>
                  <div className="col-span-2 flex flex-col items-center justify-center gap-1.5">
                    <div className="flex items-center gap-1">
                       <span className={`font-mono font-bold ${row.checkIn === 'Flexible' ? 'text-indigo-400 italic text-xs' : ''}`}>{row.checkIn}</span>
                       {row.location && (
                         <button onClick={() => setViewLocation({...row.location!, userName: row.user.name, time: row.checkIn})} className="text-indigo-400 hover:text-indigo-600 no-print"><MapPin className="w-3 h-3"/></button>
                       )}
                    </div>
                    {row.photoIn && (
                      <div className="relative group cursor-pointer no-print" onClick={() => setPreviewImage({ url: row.photoIn!, title: `เข้างาน: ${row.user.name}` })}>
                        <img src={row.photoIn} className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                          <Maximize2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 flex flex-col items-center justify-center gap-1.5">
                    <span className={`font-mono font-bold ${row.checkOut === 'Flexible' ? 'text-indigo-400 italic text-xs' : ''}`}>{row.checkOut}</span>
                    {row.photoOut && (
                      <div className="relative group cursor-pointer no-print" onClick={() => setPreviewImage({ url: row.photoOut!, title: `เลิกงาน: ${row.user.name}` })}>
                        <img src={row.photoOut} className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                          <Maximize2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    {getStatusBadge(row.status)}
                  </div>
                </div>
              </div>
            ))}
            {reportData.length === 0 && (
              <div className="p-12 text-center text-slate-400 italic text-sm">ไม่พบข้อมูลตามเงื่อนไขที่กรอง</div>
            )}
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {viewLocation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">พิกัดเช็คอิน</h3>
              <button onClick={() => setViewLocation(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">{viewLocation.userName}</p>
              <p className="text-xs text-slate-500 mb-6">เช็คอินตอน {viewLocation.time}</p>
              <a 
                href={`https://www.google.com/maps?q=${viewLocation.lat},${viewLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-xs"
              >
                เปิดใน Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-lg w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10" onClick={e => e.stopPropagation()}>
             <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full z-10 hover:bg-black/60 transition-colors">
               <X className="w-6 h-6"/>
             </button>
             <div className="p-6 text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 w-full z-10">
                <p className="text-sm font-bold">{previewImage.title}</p>
                <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">{selectedDate}</p>
             </div>
             <img src={previewImage.url} className="w-full aspect-[3/4] object-cover" />
             <div className="p-4 bg-white/5 backdrop-blur-md flex justify-center border-t border-white/10">
                <button onClick={() => setPreviewImage(null)} className="px-8 py-3 bg-white text-black rounded-xl font-bold text-sm">ปิดรูปตัวอย่าง</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, total, icon: Icon, color, onClick, active }: any) => {
  const barColorMap: any = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', indigo: 'bg-indigo-500', rose: 'bg-rose-500' };
  const colorMap: any = { 
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
    amber: 'bg-amber-50 text-amber-600 border-amber-100', 
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', 
    rose: 'bg-rose-50 text-rose-600 border-rose-100' 
  };
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${colorMap[color]} ${active ? 'ring-2 ring-offset-2 ring-indigo-300 scale-[1.02]' : 'hover:scale-[1.01] hover:shadow-md'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <Icon className="w-3 h-3 opacity-60" />
        <span className="text-[9px] font-bold uppercase opacity-60">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <h4 className="text-lg font-bold">{value}</h4>
        <span className="text-[10px] opacity-40">/ {total}</span>
      </div>
      <div className="mt-2 h-1 w-full bg-black/5 rounded-full overflow-hidden">
        <div className={`h-full ${barColorMap[color]} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default Reports;
