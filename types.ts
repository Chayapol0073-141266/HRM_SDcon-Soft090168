
// Role Definitions
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  SUPERVISOR = 'SUPERVISOR',
  OFFICE_MANAGER = 'OFFICE_MANAGER',
  FACTORY_MANAGER = 'FACTORY_MANAGER',
  CEO = 'CEO'
}

export type AttendanceCondition = 'SHIFT' | 'FLEXIBLE' | 'NONE';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  department: string;
  position: string;
  avatar?: string;
  approver1Id?: string;
  approver2Id?: string;
  approver3Id?: string;
  shiftId?: string;
  attendanceCondition: AttendanceCondition;
  skipGPS?: boolean; // ฟีเจอร์ข้ามการตรวจสอบพิกัด
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'NORMAL' | 'LATE' | 'ABSENT' | 'LEAVE';
  location?: { lat: number; lng: number };
  isManual: boolean;
  photoIn?: string; // Base64 photo string
  photoOut?: string; // Base64 photo string
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'SICK' | 'VACATION' | 'PERSONAL' | 'BUSINESS';
  startDate: string;
  endDate: string;
  reason: string;
  substituteId?: string;
  attachment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  currentApproverRole: UserRole | 'COMPLETED' | string;
  auditLog: {
    action: string;
    by: string;
    timestamp: string;
  }[];
}

// System Config Types
export interface Position { id: string; name: string; }
export interface Department { id: string; name: string; }
export interface WorkShift { id: string; name: string; startTime: string; endTime: string; lateThreshold: number; }
export interface LocationConfig { id: string; name: string; lat: number; lng: number; radius: number; }
export interface Holiday { id: string; name: string; date: string; }

export interface FinancialMetric {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  isAuthenticated: boolean;
  // Config State
  positions: Position[];
  departments: Department[];
  shifts: WorkShift[];
  locations: LocationConfig[];
  holidays: Holiday[];
}
