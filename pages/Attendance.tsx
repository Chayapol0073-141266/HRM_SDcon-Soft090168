
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
    <div className="max-w-2xl mx-auto space-y-6 px-1 pb-10">
      <h1 className="text-2xl font-bold text-slate-800">ลงเวลาทำงาน</h1>

      {!myRecord?.checkIn && (
        <div className="space-y-3">
          {shouldBypassGPS ? (
            <div className="p-5 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl flex-shrink-0">
                <MapPinOff className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">สิทธิพิเศษพนักงาน</p>
                <p className="font-bold text-sm">ได้รับอนุญาตข้ามการตรวจสอบ GPS</p>
                {currentUser?.skipGPSReason && (
                   <div className="mt-1 flex items-center gap-1.5 opacity-90">
                     <FileText className="w-3 h-3" />
                     <p className="text-[11px] font-medium italic">"{currentUser.skipGPSReason}"</p>
                   </div>
                )}
              </div>
            </div>
          ) : currentDistanceInfo && (
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${currentDistanceInfo.inRange ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
               <div className="flex items-center gap-3">
                 <MapPinned className="w-5 h-5" />
                 <p className="text-xs font-bold">พิกัด: {currentDistanceInfo.name}</p>
               </div>
               <p className="text-xs font-black">{currentDistanceInfo.inRange ? 'อยู่ในพื้นที่' : 'นอกพื้นที่'}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isCurrentlyLate && !myRecord?.checkIn ? 'bg-rose-500' : 'bg-orange-400'}`}></div>
        <Clock className={`w-12 h-12 mx-auto mb-6 ${isCurrentlyLate && !myRecord?.checkIn ? 'text-rose-600' : 'text-orange-600'}`} />
        <h2 className={`text-5xl font-black mb-10 ${isCurrentlyLate && !myRecord?.checkIn ? 'text-rose-600' : 'text-slate-800'}`}>
          {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </h2>

        {msg && (
          <div className={`mb-8 p-4 rounded-2xl text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {msg.text}
          </div>
        )}

        {!myRecord?.checkIn ? (
          <button
            onClick={() => handleAction('IN')}
            disabled={loading || (!shouldBypassGPS && currentDistanceInfo && !currentDistanceInfo.inRange)}
            className={`w-full max-w-sm text-white font-black py-5 rounded-[1.75rem] shadow-xl flex items-center justify-center gap-3 text-lg disabled:opacity-50 ${
              isCurrentlyLate ? 'bg-rose-500' : 'bg-orange-500'
            }`}
          >
            <CameraIcon className="w-6 h-6" />
            {loading ? 'บันทึก...' : (isCurrentlyLate ? 'เข้างาน (สาย)' : 'ถ่ายรูปเข้างาน')}
          </button>
        ) : !myRecord?.checkOut ? (
          <button
            onClick={() => handleAction('OUT')}
            className="w-full max-w-sm bg-rose-500 text-white font-black py-5 rounded-[1.75rem] shadow-xl flex items-center justify-center gap-3 text-lg"
          >
            <Camera className="w-6 h-6" /> ถ่ายรูปเลิกงาน
          </button>
        ) : (
          <div className="bg-slate-50 p-8 rounded-[3rem] text-3xl font-black text-indigo-600">
            {myRecord.checkIn} — {myRecord.checkOut}
          </div>
        )}
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-black rounded-[2.5rem] overflow-hidden relative">
            <button onClick={() => setShowCamera(false)} className="absolute top-6 right-6 text-white"><X className="w-6 h-6"/></button>
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[3/4] object-cover scale-x-[-1]" />
            <div className="p-8 bg-black/80 flex flex-col gap-4">
              {!capturedPhoto ? (
                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full mx-auto border-4 border-slate-300"></button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCapturedPhoto(null)} className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold">ใหม่</button>
                  <button onClick={() => processAttendance(capturedPhoto)} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black">ยืนยัน</button>
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
