// 사용자 역할
export type UserRole = "student" | "professor" | "admin";

export interface BaseProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** ai_users.image — data URL 또는 공개 URL */
  imageUrl?: string;
}

// 사용자 관련 타입
export interface AdminProfile extends BaseProfile {
  role: "admin";
}

export interface StudentProfile extends BaseProfile {
  role: "student";
  studentId: string;
  school: string;
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
export type CourseStatus = "active" | "archived";

export interface CourseStage {
  id: string;
  courseId: string;
  name: string;
  position: number;
  description?: string;
  isRequired: boolean;
}

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
  status: CourseStatus;
  archivedAt?: Date;
  archivedBy?: string;
  stages?: CourseStage[];
  stageCount?: number;
}

export interface CreateCourseInput {
  name: string;
  code: string;
  semester: string;
  schedule: string;
  room?: string;
  maxStudents?: number;
  description?: string;
  stages: string[];
}

// 팀원 한 명을 동그란 아바타로 보여주기 위해 필요한 정보입니다.
// initial은 이름 첫 글자, color는 Tailwind CSS 배경색 클래스입니다.
// 팀 관련 타입
export interface TeamMember {
  id: string;
  name?: string;
  studentId?: string;
  initial?: string;
  color?: string;
  role?: "leader" | "member";
  imageUrl?: string;
}

// 팀 카드 안의 최근 활동 기록입니다.
export interface Activity {
  tag: string;
  title: string;
  description: string;
  time: string;
}

// 팀 목록 페이지의 공지 카드입니다.
export interface Announcement {
  title: string;
  description: string;
  dDay: number;
}

export interface Team {
  id: string;
  name: string;
  courseId?: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

// 화면의 팀 카드 하나를 만들기 위해 필요한 데이터 모양입니다.
// id/name/members는 Team 타입에서 이미 정의되어 있으므로 다시 쓰지 않고 가져와서 사용합니다.
export interface TeamCard extends Pick<Team, "id" | "name" | "members"> {
  badge?: string;
  projectTitle: string;
  progress: number;
  completedStages: number;
  activities: Activity[];
}

// 수강자 네트워크 페이지에서 카드로 보여주는 학생 정보입니다.
export interface NetworkStudent {
  id: string;
  name: string;
  isSelf?: boolean;
  year?: string;
  major: string;
  bio: string;
  tags: string[];
  avatar?: string;
  image?: string;
}

export interface StudentExtra {
  temperature: number;
  teamProjectCount: number;
  portfolioFile: string;
  detailedBio: string;
  keywords: { text: string; count: number }[];
}

export interface TeamKeyword {
  id: string;
  label: string;
  group: "size" | "rule";
}

export interface StudentNetworkEditForm {
  major: string;
  mbti: string;
  careerInterest: string;
  hobbies: string;
  bio: string;
  portfolioFileName: string;
}

export interface MyPagePeerReview {
  text: string;
  count: number;
}

export interface MyPageProblemCase {
  problem: string;
  solution: string;
  result: string;
}

export interface MyPageProject {
  title: string;
  subtitle: string;
  tags: string[];
  period: string;
  role: string;
  completionRate: number;
  contributions: string[];
  problemCase: MyPageProblemCase;
  techStack: string[];
  insights: string;
  peerReviews: MyPagePeerReview[];
  professorReview: string;
}

export interface MyPageProfile {
  initial: string;
  name: string;
  email: string;
  schoolAndMajor: string;
  imageUrl?: string;
}

export interface MyPageReportStat {
  value: string;
  label: string;
  colorClassName: string;
}

export interface AuthPageSummary {
  activeCourseStudentCount: number;
  exampleEmail: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMine: boolean;
  isAnon: boolean;
}

export interface TeamFeedback {
  id: string;
  teamId: string;
  authorName: string;
  selectedOptions: string[];
  customText?: string;
  createdAt: Date;
}

export type RetrospectiveSectionContent = {
  auto: string;
  custom: string;
};

export type TeamRetrospectiveSections = {
  role: RetrospectiveSectionContent;
  strengths: RetrospectiveSectionContent;
  regrets: RetrospectiveSectionContent;
  growth: RetrospectiveSectionContent;
};

export interface TeamRetrospective {
  id: string;
  teamId: string;
  authorName: string;
  sections: TeamRetrospectiveSections;
  createdAt: Date;
}

export interface ProfessorProjectEvaluation {
  completionComment: string;
  problemSolvingComment: string;
  holisticComment: string;
}

/** 교수·관리자용 팀 제출 요약 (피드백·회고록 목록) */
export type TeamSubmissionFeedbackItem = {
  authorName: string;
  selectedOptions: string[];
  customText?: string;
};

export type TeamSubmissionRetrospectiveItem = {
  authorName: string;
  sections: TeamRetrospectiveSections;
};

export type TeamSubmissionPeerReviewItem = {
  teammateId: string;
  teammateName: string;
  goodKeywords: string[];
  badKeywords: string[];
  comment?: string;
};

export interface PeerReviewStudent {
  id: string;
  name: string;
  contribution: number;
  peerKeywords: string[];
  peerComment: string;
  roles: string[];
}

export interface PeerReviewTeammate {
  id: string;
  name: string;
  contribution: number;
  role?: "leader" | "member";
  imageUrl?: string;
}

/** 수업별 내 팀 관리 화면 */
export interface TeamManagementMember {
  id: string;
  name: string;
  studentId?: string;
  role: "leader" | "member";
  isSelf: boolean;
}

export interface TeamManagementInfo {
  teamId: string;
  teamName: string;
  projectTitle: string;
  members: TeamManagementMember[];
  myRole: "leader" | "member" | null;
  isArchived: boolean;
}

/** 학생이 팀원에게 제출한 동료평가 (DB) */
export interface PeerReviewSubmission {
  id: string;
  teamId: string;
  teammateId: string;
  goodKeywords: string[];
  badKeywords: string[];
  comment: string;
}

export interface TroubleshootingLog {
  id: string;
  author: string;
  status: "resolved" | "in-progress" | "reported";
  timestamp: string;
  problem: string;
  plan?: string;
  solution?: string;
}

export interface TeamDeliverableSubmitMeta {
  title?: string;
  description?: string;
}

export interface TeamDeliverable {
  id: string;
  teamId: string;
  courseId: string;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  publicUrl: string;
  kind?: "file" | "link";
  description?: string;
  createdAt: Date;
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
