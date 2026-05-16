// 사용자 역할
export type UserRole = "student" | "professor" | "admin";

export interface BaseProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// 사용자 관련 타입
export interface AdminProfile extends BaseProfile {
  role: "admin";
}

export interface StudentProfile extends BaseProfile {
  role: "student";
  studentId: string;
  major: string;
  skills?: string[];
  bio?: string;
}

export interface ProfessorProfile extends BaseProfile {
  role: "professor";
  department: string;
  office: string;
  officeHours: string;
  researchAreas?: string[];
}

// 과목 관련 타입
export interface Course {
  id: string;
  name: string;
  code: string;
  professor: string;
  professorId: string;
  schedule: string;
  room?: string;
  students: number;
  maxStudents?: number;
  description?: string;
  semester: string;
}

// 팀 관련 타입
export interface TeamMember {
  id: string;
  name: string;
  studentId: string;
  role?: "leader" | "member";
}

export interface Team {
  id: string;
  name: string;
  courseId?: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

// 프로젝트 관련 타입
export interface Project {
  id: string;
  title: string;
  description: string;
  courseId: string;
  teamId: string;
  status: "planning" | "in-progress" | "review" | "completed";
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Q&A 관련 타입
export interface Question {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  courseId: string;
  tags: string[];
  answers: Answer[];
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  authorName: string;
  isAccepted: boolean;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

// 알림 관련 타입
export interface Notification {
  id: string;
  userId: string;
  type: "message" | "team" | "project" | "qna" | "announcement";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
