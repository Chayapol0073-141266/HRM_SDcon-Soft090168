
import React, { useState } from 'react';
import { useStore } from '../context/Store.tsx';
import { Position } from '../types';
import { Plus, Trash2, Briefcase, Edit2, X, Save } from 'lucide-react';

const Positions = () => {
  const { positions, addPosition, updatePosition, removePosition } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [editPosition, setEditPosition] = useState<Position | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      addPosition(inputValue.trim());
      setInputValue('');
    }
  };

  const handleStartEdit = (p: Position) => {
    setEditPosition(p);
    setEditValue(p.name);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPosition && editValue.trim()) {
      updatePosition(editPosition.id, editValue.trim());
      setEditPosition(null);
      setEditValue('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการตำแหน่ง</h1>
          <p className="text-sm text-slate-500">กำหนดโครงสร้างตำแหน่งพนักงานในองค์กร</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex gap-3">
          <input 
            type="text" 
            className="flex-1 px-5 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            placeholder="ชื่อตำแหน่งใหม่ (เช่น Marketing Manager, Senior Developer)..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-4 h-4" /> เพิ่มตำแหน่ง
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map(p => (
            <div key={p.id} className="flex justify-between items-center p-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-bold text-slate-700">{p.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => handleStartEdit(p)} 
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                  title="แก้ไขชื่อตำแหน่ง"
                >
                  <Edit2 className="w-4 h-4"/>
                </button>
                <button 
                  onClick={() => removePosition(p.id)} 
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                  title="ลบตำแหน่ง"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
          {positions.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              ยังไม่มีข้อมูลตำแหน่งในระบบ
            </div>
          )}
        </div>
      </div>

      {/* Edit Position Modal */}
      {editPosition && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Edit2 className="w-4 h-4"/></div>
                แก้ไขชื่อตำแหน่ง
              </h3>
              <button onClick={() => setEditPosition(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ชื่อตำแหน่งพนักงาน</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" 
                  value={editValue} 
                  onChange={e => setEditValue(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditPosition(null)} 
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4"/> บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;
