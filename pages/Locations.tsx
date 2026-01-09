
import React, { useState } from 'react';
import { useStore } from '../context/Store.tsx';
import { LocationConfig } from '../types';
import { Plus, Trash2, MapPin, Edit2, X, Save } from 'lucide-react';

const Locations = () => {
  const { locations, addLocation, updateLocation, removeLocation } = useStore();
  const [locForm, setLocForm] = useState({ name: '', lat: 13.7563, lng: 100.5018, radius: 100 });
  const [editLoc, setEditLoc] = useState<LocationConfig | null>(null);

  const handleUpdateLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (editLoc) {
      updateLocation(editLoc);
      setEditLoc(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการจุดเช็คอิน (GPS)</h1>
          <p className="text-sm text-slate-500">กำหนดพิกัดพื้นที่ที่อนุญาตให้พนักงานลงเวลาทำงาน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-fit space-y-6">
           <h4 className="font-bold text-slate-800 flex items-center gap-2 px-1">
             <Plus className="w-4 h-4 text-rose-500" /> เพิ่มจุดใหม่
           </h4>
           <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ชื่อสถานที่</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white" value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="เช่น สำนักงานใหญ่" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">รัศมีที่อนุญาต (เมตร)</label>
                <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white" value={locForm.radius} onChange={e => setLocForm({...locForm, radius: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Latitude</label>
                  <input type="number" step="any" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white" value={locForm.lat} onChange={e => setLocForm({...locForm, lat: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Longitude</label>
                  <input type="number" step="any" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white" value={locForm.lng} onChange={e => setLocForm({...locForm, lng: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <button 
                onClick={() => { if(locForm.name) addLocation(locForm); }} 
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-black text-sm shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <MapPin className="w-4 h-4"/> บันทึกพิกัดใหม่
              </button>
           </div>
        </div>

        {/* List Container */}
        <div className="lg:col-span-2 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map(l => (
                <div key={l.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex justify-between items-center group hover:border-rose-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 rounded-2xl">
                      <MapPin className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{l.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-tight">พิกัด: {l.lat.toFixed(4)}, {l.lng.toFixed(4)} | รัศมี: {l.radius} ม.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditLoc(l)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => removeLocation(l.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
           </div>
           {locations.length === 0 && (
             <div className="bg-white p-20 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 italic">
               ยังไม่ได้กำหนดจุดเช็คอินใดๆ ในระบบ
             </div>
           )}
        </div>
      </div>

      {/* Edit Modal */}
      {editLoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Edit2 className="w-4 h-4"/></div>
                แก้ไขจุดเช็คอิน
              </h3>
              <button onClick={() => setEditLoc(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateLoc} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ชื่อสถานที่</label>
                  <input required type="text" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editLoc.name} onChange={e => setEditLoc({...editLoc, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">รัศมีที่อนุญาต (เมตร)</label>
                  <input required type="number" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editLoc.radius} onChange={e => setEditLoc({...editLoc, radius: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Latitude</label>
                    <input required type="number" step="any" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editLoc.lat} onChange={e => setEditLoc({...editLoc, lat: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Longitude</label>
                    <input required type="number" step="any" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white" value={editLoc.lng} onChange={e => setEditLoc({...editLoc, lng: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditLoc(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4"/> บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations;
