/**
 * School Master - Shared TypeScript Definitions
 */

export interface School {
  id: string;
  name: string;
  logo: string;
  slug: string;
  subscriptionStatus: "active" | "expired" | "trial";
  subscriptionPlan: string;
  trialEndsAt: string;
  settings: {
    address?: string;
    phone?: string;
    licenseNumber?: string;
    academicYear?: string;
    semester?: "الفصل الأول" | "الفصل الثاني";
    gradingSystem?: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  role: "admin" | "teacher" | "parent";
  phone: string;
  email: string;
  status: "waiting" | "approved" | "suspended";
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  photo: string;
  classId: string;
  parentId: string;
  nationalId: string;
  status: "active" | "suspended";
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  studentsCount: number;
  subjects: string[];
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
  note?: string;
}

export interface AttendanceDay {
  id: string; // date of attendance
  classId: string;
  records: AttendanceRecord[];
}

export interface GradeRecord {
  studentId: string;
  score: number;
  maxScore: number;
}

export interface GradeExam {
  id: string;
  subject: string;
  date: string;
  title: string;
  records: GradeRecord[];
}

export interface PaymentItem {
  amount: number;
  date: string;
  receiptUrl?: string;
  verified: boolean;
}

export interface FeeLedger {
  studentId: string;
  totalDue: number;
  paid: number;
  due: number;
  payments: PaymentItem[];
}

export interface ComplaintReply {
  senderId: string;
  senderName: string;
  senderRole?: 'admin' | 'parent';
  text: string;
  time: string;
}

export interface Complaint {
  id: string;
  parentId: string;
  parentName?: string;
  category: "أكاديمي" | "مالي" | "سلوكي" | "أخرى";
  description: string;
  status: "new" | "in_progress" | "solved";
  priority: "high" | "medium" | "low";
  replies: ComplaintReply[];
  createdAt: string;
}

export interface SchoolNotification {
  id: string;
  type: "absence" | "grade" | "fee" | "complaint" | "general";
  title: string;
  body: string;
  targetRole: "all" | "admin" | "teacher" | "parent";
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: ChatMessage[];
  lastUpdate: string;
}
