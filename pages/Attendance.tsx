
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../context/Store.tsx';
import { UserRole, LocationConfig } from '../types';
import { MapPin, Clock, AlertTriangle, CheckCircle, Navigation, Info, LogOut, Camera, X, RotateCcw, CameraIcon, ShieldAlert, Settings, MapPinned, MapPinOff } from 'lucide-react';

const Attendance = () => {
  const { currentUser, attendance, checkIn, checkOut, shifts, locations } = useStore();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentDistanceInfo, setCurrentDistanceInfo] = useState<{ name: string, distance: number, inRange: boolean } | null>(null);
  
  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'IN' | 'OUT' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const myRecord = attendance.find(a => a.userId === currentUser?.id && a.date === today);
  const myShift = shifts.find(s => s.id === currentUser?.shiftId);

  const isExecutive = currentUser?.role === UserRole.CEO || currentUser?.role === UserRole.OFFICE_MANAGER || currentUser?.role === UserRole.ADMIN;
  // Bypass GPS check if executive, flexible (optional), or explicitly marked as skipGPS
  const shouldBypassGPS = isExecutive || currentUser?.skipGPS;

  // Real-time late check
  const isCurrentlyLate = useMemo(() => {
    if (currentUser?.attendanceCondition !== 'SHIFT' || !myShift) return false;
    const now = new Date();
    const [h, m] = myShift.startTime.split(':').map(Number);
    const shiftStart = new Date();
    shiftStart.setHours(h, m, 0, 0);
    const limit = new Date(shiftStart.getTime() + (myShift.lateThreshold || 0) * 60000);
    return now > limit;
  }, [currentUser, myShift]);

  // Helper: Calculate distance in meters between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Effect to check nearby locations periodically
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
    const interval = setInterval(checkProximity, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [currentUser, locations, shouldBypassGPS, myRecord]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("เบราว์เซอร์ของคุณไม่รองรับการใช้งานกล้อง");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMsg = 'ไม่สามารถเปิดกล้องได้';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์ของคุณ';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'ไม่พบกล้องในอุปกรณ์นี้';
      }
      setMsg({ type: 'error', text: errorMsg });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => {
        track.stop();
        track.enabled = false;
      });
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
    setMsg(null);
    setShowCamera(true);
    setCapturedPhoto(null);
  };

  const processAttendance = async (photo: string) => {
    setLoading(true);
    setMsg(null);
    setShowCamera(false);

    const completeCheckInAction = async (lat?: number, lng?: number) => {
      const result = await checkIn(photo, lat, lng);
      setLoading(false);
      setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    };

    if (pendingAction === 'IN') {
      // 1. Bypass logic if applicable
      if (shouldBypassGPS || currentUser?.attendanceCondition === 'FLEXIBLE') {
        await completeCheckInAction();
      } else if ('geolocation' in navigator) {
        // 2. Standard user GPS enforcement
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // Validate against system locations
            const matchedLocation = locations.find(loc => {
              const distance = calculateDistance(latitude, longitude, loc.lat, loc.lng);
              return distance <= loc.radius;
            });

            if (locations.length > 0 && !matchedLocation) {
              setLoading(false);
              setMsg({ 
                type: 'error', 
                text: 'คุณไม่อยู่ในพื้นที่เช็คอินที่กำหนด กรุณาเข้าใกล้พิกัดบริษัทเพื่อลงเวลา' 
              });
              return;
            }

            await completeCheckInAction(latitude, longitude);
          },
          (err) => {
            setLoading(false);
            setMsg({ type: 'error', text: 'กรุณาอนุญาตพิกัด GPS เพื่อลงเวลาทำงาน' });
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      } else {
        setLoading(false);
        setMsg({ type: 'error', text: 'อุปกรณ์ของคุณไม่รองรับพิกัด GPS' });
      }
    } else if (pendingAction === 'OUT') {
      await checkOut(photo);
      setLoading(false);
      setMsg({ type: 'success', text: 'ลงเวลาเลิกงานสำเร็จ' });
    }
  };

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

  if (currentUser?.attendanceCondition === 'NONE') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-1">
        <h1 className="text-2xl font-bold text-slate-800">ลงเวลาทำงาน</h1>
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่ต้องลงเวลางาน</h2>
          <p className="text-slate-500 text-sm">บัญชีของคุณได้รับการยกเว้นการลงเวลาเข้า-ออกงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-1 pb-10">
      <h1 className="text-2xl font-bold text-slate-800">ลงเวลาทำงาน (พร้อมรูปถ่าย)</h1>

      {!myRecord?.checkIn && (
        <div className="space-y-3">
          <div className={`p-5 rounded-[2rem] text-white shadow-xl flex items-center justify-between transition-colors ${currentUser?.attendanceCondition === 'FLEXIBLE' ? 'bg-indigo-500' : 'bg-indigo-600'}`}>
             <div className="flex items-center gap-4">
               <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                 {currentUser?.attendanceCondition === 'FLEXIBLE' ? <Navigation className="w-5 h-5" /> : <Info className="w-5 h-5" />}
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                   {currentUser?.attendanceCondition === 'FLEXIBLE' ? 'เงื่อนไขการทำงาน' : 'กะของคุณวันนี้'}
                 </p>
                 <p className="font-bold text-base">
                   {currentUser?.attendanceCondition === 'FLEXIBLE' ? 'เวลาทำงานยืดหยุ่น' : (myShift?.name || 'ไม่ระบุกะงาน')}
                 </p>
               </div>
             </div>
             {myShift && currentUser?.attendanceCondition === 'SHIFT' && (
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase opacity-80">เข้างาน</p>
                  <p className="font-bold text-base">{myShift.startTime}</p>
               </div>
             )}
          </div>

          {/* GPS Info Banner */}
          {!myRecord?.checkIn && (
            shouldBypassGPS ? (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center gap-3 animate-in slide-in-from-top duration-300">
                <div className="p-2 bg-indigo-500 text-white rounded-lg">
                  <MapPinOff className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">สถานะพิกัด</p>
                  <p className="text-xs font-bold">คุณได้รับอนุญาตให้ข้ามการตรวจสอบ GPS</p>
                </div>
              </div>
            ) : currentDistanceInfo && (
              <div className={`p-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-top duration-300 ${currentDistanceInfo.inRange ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${currentDistanceInfo.inRange ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                     <MapPinned className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-70">ตำแหน่งปัจจุบันของคุณ</p>
                     <p className="text-xs font-bold">จุดพิกัด: {currentDistanceInfo.name}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black">{currentDistanceInfo.inRange ? 'อยู่ในพื้นที่' : 'นอกพื้นที่'}</p>
                   <p className="text-[10px] opacity-70">{Math.round(currentDistanceInfo.distance)} เมตร</p>
                 </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isCurrentlyLate && !myRecord?.checkIn ? 'bg-rose-500 animate-pulse' : 'bg-orange-400'}`}></div>
        
        <div className="flex justify-center mb-8">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-inner ${isCurrentlyLate && !myRecord?.checkIn ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'}`}>
            <Clock className="w-12 h-12" />
          </div>
        </div>

        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-2">
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h2 className={`text-6xl font-black tabular-nums mb-4 ${isCurrentlyLate && !myRecord?.checkIn ? 'text-rose-600' : 'text-slate-800'}`}>
          {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </h2>

        {currentUser?.attendanceCondition === 'SHIFT' && !myRecord?.checkIn && (
          <div className={`mb-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isCurrentlyLate ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {isCurrentlyLate ? (
              <><ShieldAlert className="w-3.5 h-3.5" /> เกินกำหนดเวลาเข้างาน (LATE)</>
            ) : (
              <><CheckCircle className="w-3.5 h-3.5" /> อยู่ในกำหนดเวลา (NORMAL)</>
            )}
          </div>
        )}

        {msg && (
          <div className={`mb-8 p-4 rounded-2xl text-xs font-bold flex flex-col items-center gap-3 animate-in zoom-in ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <div className="flex items-center gap-2">
              {msg.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
              <span>{msg.text}</span>
            </div>
            {msg.type === 'error' && msg.text.includes('พิกัด') && (
              <div className="flex items-center gap-2 mt-1 text-[10px] opacity-70">
                <MapPin className="w-3 h-3" />
                <span>กรุณาเปิด GPS และรอจนกว่าสัญญาณระบุตำแหน่งจะเสถียร</span>
              </div>
            )}
          </div>
        )}

        {!myRecord?.checkIn ? (
          <button
            onClick={() => handleAction('IN')}
            disabled={loading || (!shouldBypassGPS && currentDistanceInfo && !currentDistanceInfo.inRange)}
            className={`w-full max-w-sm text-white font-black py-5 rounded-[1.75rem] transition-all shadow-xl flex items-center justify-center gap-3 text-lg active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${
              isCurrentlyLate ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
            }`}
          >
            <CameraIcon className="w-6 h-6" />
            {loading ? 'กำลังประมวลผล...' : (!shouldBypassGPS && currentDistanceInfo && !currentDistanceInfo.inRange ? 'อยู่นอกพื้นที่เช็คอิน' : (isCurrentlyLate ? 'ลงเวลาเข้างาน (สาย)' : 'ถ่ายรูปเข้างาน'))}
          </button>
        ) : !myRecord?.checkOut ? (
          <div className="space-y-6">
             <div className="flex flex-col items-center gap-3">
               <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm border ${myRecord.status === 'LATE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                 {myRecord.status === 'LATE' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                 {myRecord.status === 'LATE' ? 'เข้างานแล้ว (สาย): ' : 'เข้างานแล้ว: '} {myRecord.checkIn}
               </div>
               {myRecord.photoIn && (
                 <img src={myRecord.photoIn} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md" alt="Check In" />
               )}
             </div>

             <button
              onClick={() => handleAction('OUT')}
              className="w-full max-w-sm bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-[1.75rem] shadow-xl shadow-rose-100 flex items-center justify-center gap-3 text-lg"
            >
              <Camera className="w-6 h-6" /> ถ่ายรูปเลิกงาน
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-[3rem] space-y-4">
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Daily Summary</div>
            <div className="text-4xl font-black text-slate-800 tabular-nums">{myRecord.checkIn} — {myRecord.checkOut}</div>
            <div className="flex justify-center gap-4">
              <img src={myRecord.photoIn} className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm" />
              <img src={myRecord.photoOut} className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm" />
            </div>
            <div className={`py-2 px-8 rounded-full inline-block text-sm font-black text-white ${myRecord.status === 'LATE' ? 'bg-rose-500' : 'bg-indigo-600'}`}>
              รวมเวลา: {calculateWorkTime(myRecord.checkIn, myRecord.checkOut)} {myRecord.status === 'LATE' && '(มาสาย)'}
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-black rounded-[2.5rem] overflow-hidden relative shadow-2xl border-2 border-white/20">
            <button onClick={() => setShowCamera(false)} className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full z-10 hover:bg-black/60 transition-colors"><X className="w-6 h-6"/></button>
            
            <div className="aspect-[3/4] bg-slate-800 relative flex items-center justify-center overflow-hidden">
              {capturedPhoto ? (
                <img src={capturedPhoto} className="w-full h-full object-cover" />
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover mirror-mode" 
                />
              )}
            </div>

            <div className="p-8 bg-black/80 flex flex-col gap-4">
              {!capturedPhoto ? (
                <button 
                  onClick={capturePhoto} 
                  className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center group active:scale-90 transition-all border-4 border-slate-300 shadow-xl shadow-white/5"
                >
                  <div className="w-16 h-16 border-2 border-black rounded-full" />
                </button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setCapturedPhoto(null)} className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20">
                    <RotateCcw className="w-5 h-5"/> ถ่ายใหม่
                  </button>
                  <button onClick={() => processAttendance(capturedPhoto)} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-orange-600">
                    <CheckCircle className="w-5 h-5"/> ยืนยันข้อมูล
                  </button>
                </div>
              )}
              <p className="text-white/50 text-[10px] text-center font-bold uppercase tracking-widest">
                {pendingAction === 'IN' ? 'โปรดถ่ายรูปใบหน้าเพื่อยืนยันการเข้างาน' : 'โปรดถ่ายรูปใบหน้าเพื่อยืนยันการเลิกงาน'}
              </p>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <style>{`
            .mirror-mode {
              transform: scaleX(-1);
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Attendance;
