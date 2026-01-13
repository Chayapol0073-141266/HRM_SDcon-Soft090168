
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole, LocationConfig } from '../types';
import { MapPin, Clock, AlertTriangle, CheckCircle, Navigation, Info, LogOut, Camera, X, RotateCcw, CameraIcon, ShieldAlert, Settings, MapPinned, MapPinOff, FileText } from 'lucide-react';

const Attendance = () => {
  const { currentUser, attendance, checkIn, checkOut, shifts, locations } = useStore();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentDistanceInfo, setCurrentDistanceInfo] = useState<{ name: string, distance: number, inRange: boolean } | null>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'IN' | 'OUT' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const myRecord = attendance.find(a => a.userId === currentUser?.id && a.date === today);
  const myShift = shifts.find(s => s.id === currentUser?.shiftId);

  const shouldBypassGPS = currentUser?.role === UserRole.CEO || currentUser?.role === UserRole.ADMIN || currentUser?.skipGPS;

  const isCurrentlyLate = useMemo(() => {
    if (currentUser?.attendanceCondition !== 'SHIFT' || !myShift) return false;
    const now = new Date();
    const [h, m] = myShift.startTime.split(':').map(Number);
    const shiftStart = new Date();
    shiftStart.setHours(h, m, 0, 0);
    const limit = new Date(shiftStart.getTime() + (myShift.lateThreshold || 0) * 60000);
    return now > limit;
  }, [currentUser, myShift]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!currentUser || shouldBypassGPS || myRecord?.checkIn) return;

    const checkProximity = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            let closest: { name: string, distance: number, inRange: boolean } | null = null;
            locations.forEach(loc => {
              const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
              if (!closest || dist < closest.distance) {
                closest = { name: loc.name, distance: dist, inRange: dist <= loc.radius };
              }
            });
            setCurrentDistanceInfo(closest);
          },
          null,
          { enableHighAccuracy: true }
        );
      }
    };

    checkProximity();
    const interval = setInterval(checkProximity, 30000);
    return () => clearInterval(interval);
  }, [currentUser, locations, shouldBypassGPS, myRecord]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'ไม่สามารถเปิดกล้องได้' });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (showCamera) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [showCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  };

  const handleAction = (type: 'IN' | 'OUT') => {
    setPendingAction(type);
    setShowCamera(true);
    setCapturedPhoto(null);
  };

  const processAttendance = async (photo: string) => {
    setLoading(true);
    setShowCamera(false);
    if (pendingAction === 'IN') {
      const result = await checkIn(photo);
      setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    } else {
      await checkOut(photo);
      setMsg({ type: 'success', text: 'ลงเวลาเลิกงานสำเร็จ' });
    }
    setLoading(false);
  };

  if (currentUser?.attendanceCondition === 'NONE') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <CheckCircle className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold">บัญชีนี้ไม่ต้องลงเวลางาน</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 px-4 pb-20">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-800">ระบบลงเวลาดิจิทัล</h1>
        <p className="text-slate-500 font-medium">ยืนยันตัวตนด้วยภาพถ่ายและพิกัด GPS</p>
      </div>

      {!myRecord?.checkIn && (
        <div className="space-y-4">
          {shouldBypassGPS ? (
            <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl flex-shrink-0">
                <MapPinOff className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">สิทธิพิเศษส่วนบุคคล</p>
                <p className="font-bold text-lg">ข้ามการตรวจสอบพื้นที่ GPS ได้</p>
                {currentUser?.skipGPSReason && (
                   <div className="mt-2 flex items-center gap-2 opacity-90">
                     <FileText className="w-4 h-4" />
                     <p className="text-sm font-medium italic">"{currentUser.skipGPSReason}"</p>
                   </div>
                )}
              </div>
            </div>
          ) : currentDistanceInfo && (
            <div className={`p-6 rounded-[2.5rem] flex items-center justify-between border-2 shadow-sm transition-all ${currentDistanceInfo.inRange ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'}`}>
               <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-xl ${currentDistanceInfo.inRange ? 'bg-emerald-200/50' : 'bg-rose-200/50'}`}>
                    <MapPinned className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">จุดตรวจพิกัด</p>
                    <p className="text-lg font-bold">{currentDistanceInfo.name}</p>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-sm font-black uppercase tracking-tight">{currentDistanceInfo.inRange ? 'อยู่ในพื้นที่' : 'อยู่นอกพื้นที่'}</p>
                  <p className="text-[10px] opacity-70">ระยะห่าง: {currentDistanceInfo.distance.toFixed(0)} ม.</p>
               </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-10 md:p-20 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden transition-all hover:shadow-indigo-100/50">
        <div className={`absolute top-0 left-0 w-full h-3 ${isCurrentlyLate && !myRecord?.checkIn ? 'bg-rose-500 shadow-[0_4px_12px_rgba(244,63,94,0.4)]' : 'bg-orange-400'}`}></div>
        <div className="flex flex-col items-center">
          <div className={`p-6 rounded-3xl mb-8 ${isCurrentlyLate && !myRecord?.checkIn ? 'bg-rose-50' : 'bg-orange-50'}`}>
            <Clock className={`w-12 h-12 md:w-16 md:h-16 ${isCurrentlyLate && !myRecord?.checkIn ? 'text-rose-600' : 'text-orange-600'}`} />
          </div>
          <h2 className={`text-6xl md:text-8xl font-black mb-12 tracking-tighter ${isCurrentlyLate && !myRecord?.checkIn ? 'text-rose-600' : 'text-slate-800'}`}>
            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </h2>
        </div>

        {msg && (
          <div className={`mb-10 p-6 rounded-3xl text-sm font-black shadow-inner flex items-center justify-center gap-3 animate-in zoom-in ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            {msg.text}
          </div>
        )}

        <div className="flex justify-center">
          {!myRecord?.checkIn ? (
            <button
              onClick={() => handleAction('IN')}
              disabled={loading || (!shouldBypassGPS && currentDistanceInfo && !currentDistanceInfo.inRange)}
              className={`w-full max-w-2xl text-white font-black py-10 md:py-16 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-center gap-6 text-3xl md:text-6xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95 group ${
                isCurrentlyLate ? 'bg-rose-500 shadow-rose-200' : 'bg-orange-500 shadow-orange-200'
              }`}
            >
              <CameraIcon className="w-12 h-12 md:w-20 md:h-20 group-hover:scale-110 transition-transform" />
              <span>{loading ? 'กำลังบันทึก...' : (isCurrentlyLate ? 'ลงเวลาเข้างาน (สาย)' : 'ลงเวลาเข้างาน')}</span>
            </button>
          ) : !myRecord?.checkOut ? (
            <button
              onClick={() => handleAction('OUT')}
              className="w-full max-w-2xl bg-rose-500 text-white font-black py-10 md:py-16 rounded-[3rem] shadow-[0_20px_50px_rgba(244,63,94,0.3)] flex flex-col md:flex-row items-center justify-center gap-6 text-3xl md:text-6xl transition-all active:scale-95 group"
            >
              <Camera className="w-12 h-12 md:w-20 md:h-20 group-hover:scale-110 transition-transform" />
              <span>ลงเวลาเลิกงาน</span>
            </button>
          ) : (
            <div className="w-full max-w-2xl bg-slate-50 p-12 md:p-16 rounded-[4rem] text-4xl md:text-6xl font-black text-indigo-600 border-2 border-slate-100 shadow-inner">
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] mb-4">สรุปเวลาวันนี้</p>
              {myRecord.checkIn} <span className="text-slate-200 px-4">—</span> {myRecord.checkOut}
            </div>
          )}
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-black rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-white/10">
            <button onClick={() => setShowCamera(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-10"><X className="w-10 h-10"/></button>
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[3/4] object-cover scale-x-[-1]" />
            <div className="p-10 bg-gradient-to-t from-black to-transparent flex flex-col gap-6">
              {!capturedPhoto ? (
                <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full mx-auto border-[6px] border-white/30 shadow-2xl hover:scale-110 transition-transform active:scale-90"></button>
              ) : (
                <div className="flex gap-6">
                  <button onClick={() => setCapturedPhoto(null)} className="flex-1 py-6 bg-white/10 text-white rounded-3xl font-bold text-xl hover:bg-white/20 transition-all">ถ่ายรูปใหม่</button>
                  <button onClick={() => processAttendance(capturedPhoto)} className="flex-1 py-6 bg-orange-500 text-white rounded-3xl font-black text-xl hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all">ยืนยันภาพนี้</button>
                </div>
              )}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default Attendance;
