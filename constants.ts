
import { User, UserRole, AttendanceRecord, LeaveRequest, FinancialMetric, Position, Department, WorkShift, LocationConfig, Holiday } from './types';

export const MOCK_POSITIONS: Position[] = [
  { id: 'p1', name: 'พนักงานฝ่ายขาย' },
  { id: 'p2', name: 'วิศวกรโรงงาน' },
  { id: 'p3', name: 'HR Officer' },
  { id: 'p4', name: 'หัวหน้าทีม' },
  { id: 'p5', name: 'ผู้จัดการแผนก' },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'ฝ่ายขาย' },
  { id: 'd2', name: 'ฝ่ายผลิต' },
  { id: 'd3', name: 'ฝ่ายบุคคล' },
  { id: 'd4', name: 'ฝ่ายไอที' },
  { id: 'd5', name: 'ผู้บริหาร' },
];

export const MOCK_SHIFTS: WorkShift[] = [
  { id: 's1', name: 'กะเช้า (Office)', startTime: '08:00', endTime: '17:00', lateThreshold: 15 },
  { id: 's2', name: 'กะโรงงาน (Shift A)', startTime: '07:00', endTime: '16:00', lateThreshold: 10 },
  { id: 's3', name: 'กะโรงงาน (Shift B)', startTime: '15:00', endTime: '00:00', lateThreshold: 10 },
];

export const MOCK_LOCATIONS: LocationConfig[] = [
  { id: 'l1', name: 'สำนักงานใหญ่ (กทม.)', lat: 13.7563, lng: 100.5018, radius: 100 },
  { id: 'l2', name: 'โรงงาน (ชลบุรี)', lat: 13.3611, lng: 100.9847, radius: 250 },
];

export const MOCK_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'วันขึ้นปีใหม่', date: '2025-01-01' },
  { id: 'h2', name: 'วันสงกรานต์', date: '2025-04-13' },
  { id: 'h3', name: 'วันแรงงาน', date: '2025-05-01' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'ceo',
    password: '1234',
    name: 'คุณสมชาย บริหาร',
    role: UserRole.CEO,
    department: 'ผู้บริหาร',
    position: 'ประธานเจ้าหน้าที่บริหาร',
    avatar: 'https://picsum.photos/200/200?random=1',
    attendanceCondition: 'NONE'
  },
  {
    id: 'u2',
    username: 'admin',
    password: '1234',
    name: 'คุณสมหญิง ไอที',
    role: UserRole.ADMIN,
    department: 'ฝ่ายไอที',
    position: 'ผู้ดูแลระบบ',
    avatar: 'https://picsum.photos/200/200?random=2',
    attendanceCondition: 'FLEXIBLE'
  },
  {
    id: 'u6',
    username: 'om',
    password: '1234',
    name: 'คุณวิภาดา จัดการ',
    role: UserRole.OFFICE_MANAGER,
    department: 'ฝ่ายบุคคล',
    position: 'ผู้จัดการสำนักงาน',
    avatar: 'https://picsum.photos/200/200?random=6',
    attendanceCondition: 'FLEXIBLE'
  },
  {
    id: 'u3',
    username: 'sup',
    password: '1234',
    name: 'หัวหน้าสมศักดิ์ คุมงาน',
    role: UserRole.SUPERVISOR,
    department: 'ฝ่ายผลิต',
    position: 'หัวหน้าทีม',
    avatar: 'https://picsum.photos/200/200?random=3',
    attendanceCondition: 'SHIFT',
    shiftId: 's2'
  },
  {
    id: 'u5',
    username: 'emp1',
    password: '1234',
    name: 'น้องมายด์ ขายเก่ง',
    role: UserRole.EMPLOYEE,
    department: 'ฝ่ายขาย',
    position: 'พนักงานฝ่ายขาย',
    avatar: 'https://picsum.photos/200/200?random=5',
    shiftId: 's1',
    attendanceCondition: 'SHIFT',
    approver1Id: 'u3'
  }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    userId: 'u5',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:45',
    checkOut: null,
    status: 'LATE',
    isManual: false,
    location: { lat: 13.7563, lng: 100.5018 }
  }
];

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'l1',
    userId: 'u5',
    type: 'VACATION',
    startDate: '2025-11-20',
    endDate: '2025-11-22',
    reason: 'กลับต่างจังหวัด',
    status: 'PENDING',
    currentApproverRole: UserRole.SUPERVISOR,
    auditLog: [
      { action: 'สร้างคำขอ', by: 'น้องมายด์ ขายเก่ง', timestamp: new Date().toISOString() }
    ]
  }
];

export const FINANCIAL_DATA: FinancialMetric[] = [
  { month: 'ม.ค.', revenue: 4000, expenses: 2400, profit: 1600 },
  { month: 'ก.พ.', revenue: 3000, expenses: 1398, profit: 1602 },
  { month: 'มี.ค.', revenue: 2000, expenses: 9800, profit: -7800 },
  { month: 'เม.ย.', revenue: 2780, expenses: 3908, profit: -1128 },
  { month: 'พ.ค.', revenue: 1890, expenses: 4800, profit: -2910 },
  { month: 'มิ.ย.', revenue: 2390, expenses: 3800, profit: -1410 },
  { month: 'ก.ค.', revenue: 3490, expenses: 4300, profit: -810 },
];
