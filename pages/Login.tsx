
import React, { useState } from 'react';
import { useStore } from '../context/Store.tsx';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, dbError } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
           <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
             <img src="https://cdn-icons-png.flaticon.com/512/912/912318.png" className="w-10 h-10 object-contain" alt="Logo" />
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">SD-Con HR</h1>
           <p className="text-slate-400 text-sm mt-1 font-medium italic">ระบบบริหารจัดการพนักงานยุคใหม่</p>
        </div>

        {dbError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-600 leading-relaxed">
              <p className="font-bold">พบข้อผิดพลาดด้านสิทธิ์ (Firebase):</p>
              <p>{dbError}</p>
              <p className="mt-2 text-[10px] opacity-70 italic">โปรดตรวจสอบว่าเปิดใช้งาน Anonymous Auth และตั้งค่า Firestore Rules แล้ว</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อผู้ใช้งาน (Username)</label>
            <input
              type="text"
              required
              disabled={loading}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
              placeholder="กรอกชื่อผู้ใช้งาน"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน (Password)</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                className="w-full px-5 py-4 pr-14 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-rose-50 text-rose-500 text-xs rounded-xl border border-rose-100 font-bold animate-shake leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF9F43] hover:bg-[#FF8C1A] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-100 active:scale-[0.98] text-base flex items-center justify-center gap-2 disabled:opacity-70 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                เข้าสู่ระบบ
                <span className="group-hover:translate-x-1 transition-transform">🚀</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2025 SD-Con Soft. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
