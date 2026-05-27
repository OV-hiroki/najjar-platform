// ─── USER ─────────────────────────────────────────────
export type Role = "STUDENT" | "ADMIN" | "TEACHER";

export interface User {
  id:         string;
  name:       string;
  phone:      string;
  email?:     string;
  avatar?:    string;
  role:       Role;
  balance:    number;
  points:     number;
  centerId?:  string;
  isVerified: boolean;
  isActive:   boolean;
  createdAt:  string;
}

// ─── COURSE ───────────────────────────────────────────
export type CourseSubject = "MECH" | "ELEC" | "WAVES" | "ALL";
export type CourseType    = "FINAL_FULL" | "LECTURE" | "SINGLE" | "WORKSHOP" | "CAMP" | "EXAM";
export type SubStatus     = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface Course {
  id:          string;
  title:       string;
  description?: string;
  subject:     CourseSubject;
  type:        CourseType;
  price:       number;
  oldPrice?:   number;
  grade:       string;
  thumbnail?:  string;
  startDate?:  string;
  endDate?:    string;
  isActive:    boolean;
  isPublished: boolean;
  totalVideos: number;
  order:       number;
  createdAt:   string;
  subscribed?: boolean;
  progress?:   number;
}

// ─── SUBSCRIPTION ─────────────────────────────────────
export interface Subscription {
  id:             string;
  userId:         string;
  courseId:       string;
  status:         SubStatus;
  progress:       number;
  videosWatched:  number;
  examsCompleted: number;
  subscribedAt:   string;
  expiresAt?:     string;
  course:         Course;
}

// ─── WALLET ───────────────────────────────────────────
export type TxType   = "FAWRY" | "CENTER_CODE" | "REFUND" | "PURCHASE";
export type TxStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface WalletTransaction {
  id:          string;
  amount:      number;
  type:        TxType;
  status:      TxStatus;
  reference?:  string;
  description?: string;
  createdAt:   string;
}

// ─── INVOICE ──────────────────────────────────────────
export interface Invoice {
  id:        string;
  total:     number;
  discount:  number;
  coupon?:   string;
  createdAt: string;
  items:     InvoiceItem[];
}

export interface InvoiceItem {
  id:       string;
  price:    number;
  quantity: number;
  course:   Course;
}

// ─── EXAM ─────────────────────────────────────────────
export interface ExamQuestion {
  id:           string;
  question:     string;
  options:      string[];
  correctIndex: number;
  explanation?: string;
}

export interface Exam {
  id:        string;
  courseId:  string;
  title:     string;
  questions: ExamQuestion[];
  duration:  number;
  passMark:  number;
}

export interface ExamResult {
  id:         string;
  score:      number;
  total:      number;
  percentage: number;
  createdAt:  string;
  exam:       Exam;
}

// ─── NOTIFICATION ─────────────────────────────────────
export interface Notification {
  id:        string;
  title:     string;
  message:   string;
  type:      "info" | "success" | "warning" | "error";
  isRead:    boolean;
  link?:     string;
  createdAt: string;
}

// ─── STATS ────────────────────────────────────────────
export interface UserStats {
  completedCourses:  number;
  activeCourses:     number;
  savedVideos:       number;
  overallProgress:   number;
  totalExams:        number;
  avgExamScore:      number;
  weeklyActivity:    number[];  // 7 values Sun-Sat
  totalHomeworks:    number;
  avgHomeworkScore:  number;
}

// ─── FAWRY ────────────────────────────────────────────
export interface FawryInitResponse {
  referenceNumber: string;
  expiryDate:      string;
  merchantRefNum:  string;
  amount:          number;
}

// ─── API RESPONSE ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}

// ─── FILTER ───────────────────────────────────────────
export interface CourseFilters {
  subject?: CourseSubject | "ALL";
  type?:    CourseType | null;
  page:     number;
  limit:    number;
  search?:  string;
}
