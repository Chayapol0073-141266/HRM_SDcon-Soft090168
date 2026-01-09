
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, User, UserRole, AttendanceRecord, LeaveRequest, Position, Department, WorkShift, LocationConfig, Holiday, AttendanceCondition } from '../types';
import { db, auth } from '../lib/firebase.ts';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  limit,
  getDoc
} from 'firebase/firestore';

interface CheckInResult {
  success: boolean;
  message: string;
  status?: 'NORMAL' | 'LATE';
}

interface StoreContextType extends AppState {
  login: (username: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  checkIn: (photo: string, lat?: number, lng?: number) => Promise<CheckInResult>;
  checkOut: (photo: string) => Promise<void>;
  requestLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'auditLog' | 'currentApproverRole' | 'userId'>) => Promise<void>;
  approveLeave: (leaveId: string) => Promise<void>;
  rejectLeave: (leaveId: string) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  addUser: (userData: Omit<User, 'id' | 'avatar'>) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  adminResetPassword: (userId: string, newPw: string) => Promise<boolean>;
  addPosition: (name: string) => Promise<void>;
  updatePosition: (id: string, name: string) => Promise<void>;
  removePosition: (id: string) => Promise<void>;
  addDepartment: (name: string) => Promise<void>;
  updateDepartment: (id: string, name: string) => Promise<void>;
  removeDepartment: (id: string) => Promise<void>;
  addShift: (shift: Omit<WorkShift, 'id'>) => Promise<void>;
  updateShift: (shift: WorkShift) => Promise<void>;
  removeShift: (id: string) => Promise<void>;
  addLocation: (loc: Omit<LocationConfig, 'id'>) => Promise<void>;
  updateLocation: (loc: LocationConfig) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  removeHoliday: (id: string) => Promise<void>;
  dbError: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const seedInitialData = async () => {
    try {
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('username', '==', 'admin'), limit(1));
      const adminSnap = await getDocs(adminQuery);
      
      if (!adminSnap.empty) return;

      const deptSnap = await getDocs(query(collection(db, 'departments'), limit(1)));
      let defaultShiftId = '';

      if (deptSnap.empty) {
        const depts = ['ผู้บริหาร', 'ฝ่ายไอที', 'ฝ่ายบุคคล', 'ฝ่ายผลิต'];
        for (const name of depts) await addDoc(collection(db, 'departments'), { name });
        const posts = ['Administrator', 'CEO', 'Manager', 'Staff'];
        for (const name of posts) await addDoc(collection(db, 'positions'), { name });
        const shiftDoc = await addDoc(collection(db, 'shifts'), { 
          name: 'กะเช้า (Office)', startTime: '08:00', endTime: '17:00', lateThreshold: 15 
        });
        defaultShiftId = shiftDoc.id;
        await addDoc(collection(db, 'locations'), { 
          name: 'สำนักงานใหญ่', lat: 13.7563, lng: 100.5018, radius: 100 
        });
      }

      await addDoc(collection(db, 'users'), {
        username: 'admin',
        password: '1234',
        name: 'System Administrator',
        role: UserRole.ADMIN,
        department: 'ฝ่ายไอที',
        position: 'Administrator',
        avatar: 'https://picsum.photos/200/200?random=admin',
        attendanceCondition: 'NONE',
        shiftId: defaultShiftId || ''
      });

      await addDoc(collection(db, 'users'), {
        username: 'ceo',
        password: '1234',
        name: 'Executive Director',
        role: UserRole.CEO,
        department: 'ผู้บริหาร',
        position: 'CEO',
        avatar: 'https://picsum.photos/200/200?random=ceo',
        attendanceCondition: 'NONE',
        shiftId: defaultShiftId || ''
      });
    } catch (err: any) {
      if (err.code === 'permission-denied') setDbError("สิทธิ์การเข้าถึงฐานข้อมูลถูกปฏิเสธ");
      console.error("Seeding Error:", err);
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await seedInitialData();
        setIsFirebaseReady(true);
      }
    });
    signInAnonymously(auth).catch(() => setIsFirebaseReady(true));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() } as User))));
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (s) => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord))));
    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (s) => setLeaves(s.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest))));
    const unsubPos = onSnapshot(collection(db, 'positions'), (s) => setPositions(s.docs.map(d => ({ id: d.id, ...d.data() } as Position))));
    const unsubDepts = onSnapshot(collection(db, 'departments'), (s) => setDepartments(s.docs.map(d => ({ id: d.id, ...d.data() } as Department))));
    const unsubShifts = onSnapshot(collection(db, 'shifts'), (s) => setShifts(s.docs.map(d => ({ id: d.id, ...d.data() } as WorkShift))));
    const unsubLocs = onSnapshot(collection(db, 'locations'), (s) => setLocations(s.docs.map(d => ({ id: d.id, ...d.data() } as LocationConfig))));
    const unsubHols = onSnapshot(collection(db, 'holidays'), (s) => setHolidays(s.docs.map(d => ({ id: d.id, ...d.data() } as Holiday))));
    return () => {
      unsubUsers(); unsubAttendance(); unsubLeaves(); unsubPos();
      unsubDepts(); unsubShifts(); unsubLocs(); unsubHols();
    };
  }, [isFirebaseReady]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
    else localStorage.removeItem('currentUser');
  }, [currentUser]);

  const login = async (username: string, password?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { success: false, message: 'ไม่พบชื่อผู้ใช้งานนี้' };
      
      const userData = snapshot.docs[0].data();
      const user = { 
        id: snapshot.docs[0].id, 
        ...userData,
        role: (userData.role as string || 'EMPLOYEE').toUpperCase() as UserRole
      } as User;

      const inputPassword = password || '';
      const storedPassword = user.password || '';

      if (storedPassword === inputPassword) {
         setCurrentUser(user);
         return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
      }
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    } catch (e: any) {
      return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
    }
  };

  const logout = () => setCurrentUser(null);

  const changePassword = async (oldPw: string, newPw: string): Promise<boolean> => {
    if (!currentUser) return false;
    const q = await getDocs(query(collection(db, 'users'), where('username', '==', currentUser.username), limit(1)));
    if (q.empty) return false;
    const userData = q.docs[0].data();
    if (userData.password !== oldPw) return false;
    
    await updateDoc(doc(db, 'users', currentUser.id), { password: newPw });
    setCurrentUser({ ...currentUser, password: newPw });
    return true;
  };

  const adminResetPassword = async (userId: string, newPw: string): Promise<boolean> => {
    await updateDoc(doc(db, 'users', userId), { password: newPw });
    return true;
  };

  const addUser = async (u: any) => {
    const avatar = `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`;
    const plainPassword = u.password || '1234';
    await addDoc(collection(db, 'users'), { ...u, avatar, password: plainPassword });
  };

  const updateUser = async (u: User) => { 
    const { id, ...data } = u; 
    await setDoc(doc(db, 'users', id), data); 
  };

  const checkIn = async (photo: string, lat?: number, lng?: number): Promise<CheckInResult> => {
    if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const checkInTimeStr = now.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let attendanceStatus: 'NORMAL' | 'LATE' = 'NORMAL';

    // Calculate late status if the user is on a SHIFT condition
    if (currentUser.attendanceCondition === 'SHIFT' && currentUser.shiftId) {
      const userShift = shifts.find(s => s.id === currentUser.shiftId);
      if (userShift) {
        const [shiftH, shiftM] = userShift.startTime.split(':').map(Number);
        const shiftStartDate = new Date(now);
        shiftStartDate.setHours(shiftH, shiftM, 0, 0);
        
        // Add threshold (grace period)
        const lateLimitDate = new Date(shiftStartDate.getTime() + (userShift.lateThreshold || 0) * 60000);
        
        if (now > lateLimitDate) {
          attendanceStatus = 'LATE';
        }
      }
    }

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      userId: currentUser.id, 
      date: today, 
      checkIn: checkInTimeStr, 
      checkOut: null, 
      status: attendanceStatus,
      isManual: currentUser.attendanceCondition === 'FLEXIBLE', 
      location: lat && lng ? { lat, lng } : undefined, 
      photoIn: photo
    };

    try {
      await addDoc(collection(db, 'attendance'), newRecord);
      const msg = attendanceStatus === 'LATE' ? 'ลงเวลาเข้างานสำเร็จ (สาย)' : 'ลงเวลาเข้างานสำเร็จ';
      return { success: true, message: msg, status: attendanceStatus };
    } catch (e: any) {
      return { success: false, message: 'บันทึกไม่สำเร็จ: ' + e.message };
    }
  };

  const checkOut = async (photo: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'attendance'), where('userId', '==', currentUser.id), where('date', '==', today));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      await updateDoc(doc(db, 'attendance', snapshot.docs[0].id), {
        checkOut: new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        photoOut: photo
      });
    }
  };

  const getDynamicApprovalChain = (userId: string, currentUsers: User[]) => {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return [];
    
    const chain = [];
    if (user.approver1Id) chain.push(user.approver1Id);
    if (user.approver2Id) chain.push(user.approver2Id);
    if (user.approver3Id) chain.push(user.approver3Id);
    
    if (chain.length === 0) {
      if (user.role === UserRole.EMPLOYEE) return [UserRole.SUPERVISOR, UserRole.OFFICE_MANAGER, UserRole.CEO];
      if (user.role === UserRole.SUPERVISOR) return [UserRole.OFFICE_MANAGER, UserRole.CEO];
      return [UserRole.CEO];
    }
    return chain;
  };

  const requestLeave = async (data: any) => {
    if (!currentUser) return;
    
    const chain = getDynamicApprovalChain(currentUser.id, users);
    const initialTarget = chain.length > 0 ? chain[0] : UserRole.ADMIN;

    await addDoc(collection(db, 'leaves'), {
      ...data, 
      userId: currentUser.id, 
      status: 'PENDING',
      currentApproverRole: initialTarget, 
      auditLog: [{ action: 'สร้างคำขอ', by: currentUser.name, timestamp: new Date().toISOString() }]
    });
  };

  const approveLeave = async (id: string) => { 
    if (!currentUser) return;
    
    const leaveDoc = await getDoc(doc(db, 'leaves', id));
    if (!leaveDoc.exists()) return;
    
    const leaveData = leaveDoc.data() as LeaveRequest;
    const requesterChain = getDynamicApprovalChain(leaveData.userId, users);
    const currentIndex = requesterChain.indexOf(leaveData.currentApproverRole as string);

    const newAuditLog = [
      ...(leaveData.auditLog || []),
      { action: `อนุมัติ (โดย ${currentUser.name})`, by: currentUser.name, timestamp: new Date().toISOString() }
    ];

    if (currentIndex === -1) {
        if (requesterChain.length > 1) {
            await updateDoc(doc(db, 'leaves', id), { 
                currentApproverRole: requesterChain[1],
                auditLog: newAuditLog
            });
        } else {
            await updateDoc(doc(db, 'leaves', id), { 
                status: 'APPROVED',
                currentApproverRole: 'COMPLETED',
                auditLog: newAuditLog
            });
        }
        return;
    }

    if (currentIndex < requesterChain.length - 1) {
      await updateDoc(doc(db, 'leaves', id), { 
        currentApproverRole: requesterChain[currentIndex + 1],
        auditLog: newAuditLog
      });
    } else {
      await updateDoc(doc(db, 'leaves', id), { 
        status: 'APPROVED',
        currentApproverRole: 'COMPLETED',
        auditLog: newAuditLog
      });
    }
  };

  const rejectLeave = async (id: string) => { 
    if (!currentUser) return;
    const leaveDoc = await getDoc(doc(db, 'leaves', id));
    if (!leaveDoc.exists()) return;
    
    const leaveData = leaveDoc.data() as LeaveRequest;
    const newAuditLog = [
      ...(leaveData.auditLog || []),
      { action: `ไม่อนุมัติ (โดย ${currentUser.name})`, by: currentUser.name, timestamp: new Date().toISOString() }
    ];

    await updateDoc(doc(db, 'leaves', id), { 
      status: 'REJECTED',
      auditLog: newAuditLog
    }); 
  };

  const addPosition = async (n: string) => { await addDoc(collection(db, 'positions'), { name: n }); };
  const updatePosition = async (id: string, name: string) => { await updateDoc(doc(db, 'positions', id), { name }); };
  const removePosition = async (id: string) => { await deleteDoc(doc(db, 'positions', id)); };
  const addDepartment = async (n: string) => { await addDoc(collection(db, 'departments'), { name: n }); };
  const updateDepartment = async (id: string, name: string) => { await updateDoc(doc(db, 'departments', id), { name }); };
  const removeDepartment = async (id: string) => { await deleteDoc(doc(db, 'departments', id)); };
  const addShift = async (s: any) => { await addDoc(collection(db, 'shifts'), s); };
  const updateShift = async (s: WorkShift) => { const { id, ...data } = s; await setDoc(doc(db, 'shifts', id), data); };
  const removeShift = async (id: string) => { await deleteDoc(doc(db, 'shifts', id)); };
  const addLocation = async (l: any) => { await addDoc(collection(db, 'locations'), l); };
  const updateLocation = async (l: LocationConfig) => { const { id, ...data } = l; await setDoc(doc(db, 'locations', id), data); };
  const removeLocation = async (id: string) => { await deleteDoc(doc(db, 'locations', id)); };
  const addHoliday = async (h: any) => { await addDoc(collection(db, 'holidays'), h); };
  const removeHoliday = async (id: string) => { await deleteDoc(doc(db, 'holidays', id)); };

  return (
    <StoreContext.Provider value={{ 
      currentUser, users, attendance, leaves, isAuthenticated: !!currentUser,
      positions, departments, shifts, locations, holidays, dbError,
      login, logout, checkIn, checkOut, requestLeave, approveLeave, rejectLeave, changePassword, addUser, updateUser, adminResetPassword,
      addPosition, updatePosition, removePosition, addDepartment, updateDepartment, removeDepartment, addShift, updateShift, removeShift, addLocation, updateLocation, removeLocation, addHoliday, removeHoliday
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
