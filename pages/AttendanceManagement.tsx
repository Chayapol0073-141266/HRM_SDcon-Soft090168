
import React, { useState, useRef } from 'react';
import { useStore } from '../context/Store.tsx';
import { AttendanceRecord, User } from '../types';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Save, 
  X,
  CalendarClock,
  Download,
  Search,
  Users
} from 'lucide-react';

const AttendanceManagement = () => {
  const { users, addBulkAttendance } = useStore();
  const [importData, setImportData] = useState<Omit<AttendanceRecord, 'id'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manualRecord, setManualRecord] = useState({
    username: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '17:00'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // ข้าม Header
      
      const parsed: Omit<AttendanceRecord, 'id'>[] = [];
      rows.forEach(row => {
        const [username, date, checkIn, checkOut] = row.split(',').map(s => s.trim());
        if (!username || !date) return;

        const user = users.find(u => u.username === username);
        if (user) {
          parsed.push({
            userId: user.id,
            date,
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            status: 'NORMAL',
            isManual: true
          });
        }
      });
      setImportData(parsed);
    };
    reader.readAsText(file);
  };

  const handleCommit = async () => {
    if (importData.length === 0) return;
    setLoading(true);
    const result = await addBulkAttendance(importData);
    if (result.success) {
      setMsg({ type: 'success', text: `นำเข้าข้อมูลสำเร็จจำนวน ${result.count} รายการ` });
      setImportData([]);
    } else {
      setMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
    }
    setLoading(false);
  };

  const addManualRecord = () => {
    const user = users.find(u => u.username === manualRecord.username);
    if (!user) {
      setMsg({ type: 'error', text: 'ไม่พบชื่อผู้ใช้งานนี้' });
      return;
    }

    const newRec: Omit<AttendanceRecord, 'id'> = {
      userId: user.id,
      date: manualRecord.date,
      checkIn: manualRecord.checkIn,
      checkOut: manualRecord.checkOut,
      status: 'NORMAL',
      isManual: true
    };

    setImportData([...importData, newRec]);
    setManualRecord({ ...manualRecord, username: '' });
  };

  const removePreviewItem = (index: number) => {
    setImportData(importData.filter((_, i) => i !== index));
  };

  const getUsernameById = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการการลงเวลา</h1>
          <p className="text-sm text-slate-500">ลงเวลาย้อนหลัง คีย์มือ หรือนำเข้าข้อมูลจากไฟล์ CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Plus className="w-4 h-4 text-indigo-600" /> คีย์ข้อมูลรายบุคคล
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ชื่อผู้ใช้งาน (Username)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none"
                    placeholder="ค้นหา username..."
                    value={manualRecord.username}
                    onChange={e => setManualRecord({...manualRecord, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">วันที่</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none"
                  value={manualRecord.date}
                  onChange={e => setManualRecord({...manualRecord, date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เวลาเข้า</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none"
                    value={manualRecord.checkIn}
                    onChange={e => setManualRecord({...manualRecord, checkIn: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เวลาออก</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none"
                    value={manualRecord.checkOut}
                    onChange={e => setManualRecord({...manualRecord, checkOut: e.target.value})}
                  />
                </div>
              </div>

              <button 
                onClick={addManualRecord}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                เพิ่มเข้าตาราง Preview
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
            <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-xs mb-4">
              <Upload className="w-4 h-4" /> นำเข้าผ่าน CSV
            </h3>
            <p className="text-[10px] opacity-80 mb-6 leading-relaxed">
              เหมาะสำหรับการนำเข้าข้อมูลจำนวนมาก <br/>
              <b>รูปแบบไฟล์:</b> username, date(YYYY-MM-DD), timeIn(HH:mm), timeOut(HH:mm)
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-white/20"
              >
                <FileText className="w-4 h-4" /> เลือกไฟล์ CSV
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <Download className="w-3 h-3" /> ตัวอย่างไฟล์นำเข้า
             </h4>
             <div className="bg-white p-3 rounded-xl border border-slate-100 font-mono text-[9px] text-slate-500 overflow-x-auto">
               username,date,checkIn,checkOut<br/>
               emp1,2025-01-10,08:00,17:00<br/>
               emp1,2025-01-11,08:15,17:05<br/>
               sup,2025-01-10,07:30,16:30
             </div>
          </div>
        </div>

        {/* Right: Preview and Action */}
        <div className="lg:col-span-2 space-y-6">
          {msg && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{msg.text}</span>
              <button onClick={() => setMsg(null)} className="ml-auto p-1 hover:bg-black/5 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">ตารางตรวจสอบก่อนบันทึก ({importData.length})</h3>
              </div>
              <button 
                onClick={handleCommit}
                disabled={loading || importData.length === 0}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                บันทึกลงฐานข้อมูล
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">พนักงาน</th>
                    <th className="px-6 py-4">วันที่</th>
                    <th className="px-6 py-4 text-center">เข้างาน</th>
                    <th className="px-6 py-4 text-center">ออกงาน</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {importData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Users className="w-4 h-4 text-indigo-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{getUsernameById(row.userId)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {new Date(row.date).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-mono font-bold">
                          {row.checkIn || '--:--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-mono font-bold">
                          {row.checkOut || '--:--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removePreviewItem(idx)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {importData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                         <div className="flex flex-col items-center gap-3 opacity-20">
                           <FileText className="w-12 h-12" />
                           <p className="text-sm font-bold uppercase tracking-widest">ไม่มีข้อมูลสำหรับการนำเข้า</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
