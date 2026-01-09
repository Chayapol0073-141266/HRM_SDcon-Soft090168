
import React, { useState } from 'react';
import { useStore } from '../context/Store.tsx';
import { WorkShift } from '../types';
import { Plus, Trash2, Clock, Save, Edit2, X } from 'lucide-react';

const Shifts = () => {
  const { shifts, addShift, updateShift, removeShift } = useStore();
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '08:00', endTime: '17:00', lateThreshold: 15 });
  const [editShift, setEditShift] = useState<WorkShift | null>(null);

  const handleUpdateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (editShift) {
      updateShift(editShift);
      setEditShift(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการกะเวลาทำงาน</h1>
          <p className="text-sm text-slate-500">กำหนดเวลาเข้า-ออกงาน และเงื่อนไขการมาสาย</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-fit space-y-6">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> สร้างกะใหม่
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ชื่อกะงาน</label>
              <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none" placeholder="เช่น Office Hour" value={shiftForm.name} onChange={e => setShiftForm({...shiftForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เวลาเริ่มงาน</label>
                <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เวลาเลิกงาน</label>
                <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">สายได้ไม่เกิน (นาที)</label>
              <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none" value={shiftForm.lateThreshold} onChange={e => setShiftForm({...shiftForm, lateThreshold: parseInt(e.target.value) || 0})} />
            </div>
            <button 
              onClick={() => { if(shiftForm.name) { addShift(shiftForm); setShiftForm({ name: '', startTime: '08:00', endTime: '17:00', lateThreshold: 15 }); } }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" /> บันทึกกะทำงาน
            </button>
          </div>
        </div>

        {/* Shift List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map(s => (
              <div key={s.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex justify-between items-center group hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl">
                    <Clock className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{s.startTime} - {s.endTime} (สายได้ {s.lateThreshold} น.)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditShift(s)} 
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={() => removeShift(s.id)} 
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {shifts.length === 0 && (
            <div className="bg-white p-20 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 italic">
              ไม่มีข้อมูลกะการทำงานในระบบ
            </div>
          )}
        </div>
      </div>

      {/* Edit Shift Modal */}
      {editShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Edit2 className="w-4 h-4"/></div>
                แก้ไขกะเวลาทำงาน
              </h3>
              <button onClick={() => setEditShift(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateShift} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ชื่อกะงาน</label>
                  <input required type="text" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editShift.name} onChange={e => setEditShift({...editShift, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เวลาเริ่มงาน</label>
                    <input required type="time" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editShift.startTime} onChange={e => setEditShift({...editShift, startTime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เวลาเลิกงาน</label>
                    <input required type="time" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editShift.endTime} onChange={e => setEditShift({...editShift, endTime: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">สายได้ไม่เกิน (นาที)</label>
                  <input required type="number" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editShift.lateThreshold} onChange={e => setEditShift({...editShift, lateThreshold: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditShift(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4"/> บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
