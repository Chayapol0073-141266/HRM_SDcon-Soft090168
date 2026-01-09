
import React, { useState } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole } from '../types';
import { Plus, Trash2, Calendar, Sparkles, ShieldCheck, Eye } from 'lucide-react';

const Holidays = () => {
  const { currentUser, holidays, addHoliday, removeHoliday } = useStore();
  const [holForm, setHolForm] = useState({ name: '', date: '' });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">วันหยุดประจำปี</h1>
          <p className="text-sm text-slate-500">ตรวจสอบวันหยุดนักขัตฤกษ์และวันหยุดพิเศษของบริษัท</p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">โหมดอ่านอย่างเดียว</span>
          </div>
        )}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
        {/* Only show management form for Admin */}
        {isAdmin && (
          <div className="flex flex-col md:flex-row gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <div className="flex-[2]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ชื่อวันหยุด</label>
              <input 
                type="text" 
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                placeholder="เช่น วันสงกรานต์, วันปีใหม่..."
                value={holForm.name}
                onChange={e => setHolForm({...holForm, name: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">วันที่</label>
              <input 
                type="date" 
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                value={holForm.date}
                onChange={e => setHolForm({...holForm, date: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => { if(holForm.name && holForm.date) { addHoliday(holForm); setHolForm({ name: '', date: '' }); } }}
                className="w-full md:w-auto bg-amber-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 active:scale-95"
              >
                <Plus className="w-4 h-4" /> เพิ่มวันหยุด
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => {
             const hDate = new Date(h.date);
             const isUpcoming = hDate >= new Date();

             return (
                <div key={h.id} className={`flex justify-between items-center p-5 rounded-[1.5rem] group transition-all border ${
                  isUpcoming ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50/50 border-slate-100 grayscale opacity-60'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isUpcoming ? 'bg-amber-100' : 'bg-slate-200'}`}>
                      <Calendar className={`w-5 h-5 ${isUpcoming ? 'text-amber-600' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 flex items-center gap-2">
                        {h.name} {isUpcoming && <Sparkles className="w-3 h-3 text-amber-500" />}
                      </p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {hDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Only show delete button for Admin */}
                  {isAdmin && (
                    <button 
                      onClick={() => removeHoliday(h.id)} 
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
             );
          })}
          {holidays.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              ยังไม่มีข้อมูลวันหยุดในระบบ
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest py-4">
        <ShieldCheck className="w-4 h-4" />
        Official Company Holiday Calendar {new Date().getFullYear() + 543}
      </div>
    </div>
  );
};

export default Holidays;
