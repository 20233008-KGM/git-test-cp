import type {
  Course,
  StudentProfile,
  ProfessorProfile,
  TeamCard,
  Announcement,
  NetworkStudent,
  StudentExtra,
  TeamKeyword,
  StudentNetworkEditForm,
  MyPageProject,
  MyPageProfile,
  MyPageReportStat,
  AuthPageSummary,
  ChatMessage,
  PeerReviewStudent,
  PeerReviewTeammate,
  TroubleshootingLog,
  Project,
  Question,
} from "../types";
import { auth } from "../firebase";
import { supabase } from "../supabase";

// 이 파일은 화면들이 사용하는 API facade입니다.
// 화면 데이터는 코드에 직접 두지 않고 Supabase의 ai_* 테이블에서 읽어 기존 화면 타입으로 변환합니다.

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asDate(value: string | null | undefined): Date {
  return value ? new Date(value) : new Date();
}

type AiUser = {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
  role: "student" | "professor" | "admin";
};

async function getCurrentAiUser(): Promise<AiUser | null> {
  const firebaseUid = auth.currentUser?.uid;
  if (!firebaseUid) return null;

  const { data, error } = await supabase
    .from("ai_users")
    .select("id, firebase_uid, email, name, role")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (error) throw error;
  return data as AiUser | null;
}

async function getAccessibleCourseIds(): Promise<string[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) return [];

  const [teachingResult, membershipResult] = await Promise.all([
    supabase
      .from("ai_courses")
      .select("id")
      .eq("instructor_user_id", currentUser.id),
    supabase
      .from("ai_course_memberships")
      .select("course_id")
      .eq("user_id", currentUser.id),
  ]);

  if (teachingResult.error) throw teachingResult.error;
  if (membershipResult.error) throw membershipResult.error;

  return Array.from(
    new Set([
      ...(teachingResult.data ?? []).map((course) => course.id),
      ...(membershipResult.data ?? []).map((membership) => membership.course_id),
    ])
  );
}

async function getPrimaryCourseId(): Promise<string | null> {
  const courseIds = await getAccessibleCourseIds();
  return courseIds[0] ?? null;
}

async function getStudentsFromDb(): Promise<StudentProfile[]> {
  const courseId = await getPrimaryCourseId();
  let query = supabase
    .from("ai_students")
    .select("id, name, email, student_id, major, skills, bio, course_id")
    .order("id", { ascending: true });

  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    role: "student",
    studentId: student.student_id,
    major: student.major,
    skills: asArray<string>(student.skills),
    bio: student.bio ?? undefined,
  }));
}

async function getStudentByIdFromDb(id: string): Promise<StudentProfile | undefined> {
  const students = await getStudentsFromDb();
  return students.find((student) => student.id === id);
}

async function getProfessorsFromDb(): Promise<ProfessorProfile[]> {
  const { data, error } = await supabase
    .from("ai_professors")
    .select("id, name, email, department, office, office_hours, research_areas")
    .order("id", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((professor) => ({
    id: professor.id,
    name: professor.name,
    email: professor.email,
    role: "professor",
    department: professor.department,
    office: professor.office,
    officeHours: professor.office_hours,
    researchAreas: asArray<string>(professor.research_areas),
  }));
}

async function getProfessorByIdFromDb(id: string): Promise<ProfessorProfile | undefined> {
  const professors = await getProfessorsFromDb();
  return professors.find((professor) => professor.id === id);
}

async function getCoursesFromDb(): Promise<Course[]> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  let query = supabase
    .from("ai_courses")
    .select("id, name, code, professor_id, schedule, room, students_count, max_students, semester, description")
    .order("id", { ascending: true });

  if (accessibleCourseIds.length > 0) {
    query = query.in("id", accessibleCourseIds);
  }

  const [coursesResult, professors] = await Promise.all([query, getProfessorsFromDb()]);

  if (coursesResult.error) throw coursesResult.error;

  return (coursesResult.data ?? []).map((course) => {
    const professor = professors.find((item) => item.id === course.professor_id);

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      professor: professor?.name ?? "",
      professorId: course.professor_id,
      schedule: course.schedule,
      room: course.room ?? undefined,
      students: course.students_count,
      maxStudents: course.max_students ?? undefined,
      semester: course.semester,
      description: course.description ?? undefined,
    };
  });
}

async function getCourseByIdFromDb(id: string): Promise<Course | undefined> {
  const courses = await getCoursesFromDb();
  return courses.find((course) => course.id === id);
}

async function getTeamCardsFromDb(): Promise<TeamCard[]> {
  const courseId = await getPrimaryCourseId();
  if (!courseId) return [];

  const [teamsResult, membersResult, activitiesResult] = await Promise.all([
    supabase
      .from("ai_teams")
      .select("id, name, badge, project_title, progress, completed_stages, sort_order")
      .eq("course_id", courseId)
      .not("project_title", "is", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ai_team_members")
      .select("id, team_id, initial, color, sort_order")
      .not("initial", "is", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ai_team_activities")
      .select("id, team_id, tag, title, description, display_time, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (membersResult.error) throw membersResult.error;
  if (activitiesResult.error) throw activitiesResult.error;

  const teams = teamsResult.data ?? [];
  const members = membersResult.data ?? [];
  const activities = activitiesResult.data ?? [];

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    badge: team.badge ?? "",
    projectTitle: team.project_title ?? "",
    progress: team.progress,
    completedStages: team.completed_stages,
    members: members
      .filter((member) => member.team_id === team.id)
      .map((member) => ({
        id: member.id,
        initial: member.initial ?? "",
        color: member.color ?? "",
      })),
    activities: activities
      .filter((activity) => activity.team_id === team.id)
      .map((activity) => ({
        tag: activity.tag,
        title: activity.title,
        description: activity.description,
        time: activity.display_time,
      })),
  }));
}

async function getTeamStagesFromDb(): Promise<string[]> {
  const { data, error } = await supabase
    .from("ai_team_stages")
    .select("name, position")
    .order("position", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((stage) => stage.name);
}

async function getAnnouncementsFromDb(): Promise<Announcement[]> {
  const courseId = await getPrimaryCourseId();
  if (!courseId) return [];

  const { data, error } = await supabase
    .from("ai_announcements")
    .select("id, title, description, d_day, sort_order, course_id")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((announcement) => ({
    title: announcement.title,
    description: announcement.description,
    dDay: announcement.d_day,
  }));
}

async function getNetworkStudentsFromDb(): Promise<NetworkStudent[]> {
  const [currentUser, courseId] = await Promise.all([getCurrentAiUser(), getPrimaryCourseId()]);
  if (!courseId) return [];

  const { data, error } = await supabase
    .from("ai_network_students")
    .select("id, user_id, name, is_self, year, major, bio, tags, avatar, image, sort_order, course_id")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    isSelf: currentUser ? student.user_id === currentUser.id : student.is_self,
    year: student.year ?? undefined,
    major: student.major,
    bio: student.bio,
    tags: asArray<string>(student.tags),
    avatar: student.avatar ?? undefined,
    image: student.image ?? undefined,
  }));
}

async function getStudentExtrasFromDb(): Promise<Record<string, StudentExtra>> {
  const { data, error } = await supabase
    .from("ai_student_extras")
    .select("student_id, temperature, team_project_count, portfolio_file, detailed_bio, keywords");

  if (error) throw error;

  return (data ?? []).reduce<Record<string, StudentExtra>>((result, extra) => {
    result[extra.student_id] = {
      temperature: Number(extra.temperature),
      teamProjectCount: extra.team_project_count,
      portfolioFile: extra.portfolio_file,
      detailedBio: extra.detailed_bio,
      keywords: asArray<{ text: string; count: number }>(extra.keywords),
    };

    return result;
  }, {});
}

async function getTeamKeywordsFromDb(): Promise<TeamKeyword[]> {
  const { data, error } = await supabase
    .from("ai_team_keywords")
    .select("id, label, keyword_group, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((keyword) => ({
    id: keyword.id,
    label: keyword.label,
    group: keyword.keyword_group,
  }));
}

async function getStudentNetworkEditFormFromDb(): Promise<StudentNetworkEditForm> {
  const { data, error } = await supabase
    .from("ai_student_network_edit_form")
    .select("major, mbti, career_interest, hobbies, bio, portfolio_file_name")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Student network edit form data was not found.");

  return {
    major: data.major,
    mbti: data.mbti,
    careerInterest: data.career_interest,
    hobbies: data.hobbies,
    bio: data.bio,
    portfolioFileName: data.portfolio_file_name,
  };
}

async function getProjectsFromDb(): Promise<Project[]> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  let query = supabase
    .from("ai_projects")
    .select("id, title, description, course_id, team_id, status, deadline, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (accessibleCourseIds.length > 0) query = query.in("course_id", accessibleCourseIds);

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    courseId: project.course_id,
    teamId: project.team_id,
    status: project.status,
    deadline: project.deadline ? new Date(project.deadline) : undefined,
    createdAt: asDate(project.created_at),
    updatedAt: asDate(project.updated_at),
  }));
}

async function getMyPageProfileFromDb(): Promise<MyPageProfile> {
  const currentUser = await getCurrentAiUser();

  if (currentUser) {
    return {
      initial: currentUser.name.slice(0, 1),
      name: currentUser.name,
      email: currentUser.email,
      schoolAndMajor: currentUser.role === "professor" ? "컴퓨터공학부 교수" : "컴퓨터공학과 학생",
    };
  }

  const { data, error } = await supabase
    .from("ai_my_page_profile")
    .select("initial, name, email, school_and_major")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("MyPage profile data was not found.");

  return {
    initial: data.initial,
    name: data.name,
    email: data.email,
    schoolAndMajor: data.school_and_major,
  };
}

async function getMyPageReportStatsFromDb(): Promise<MyPageReportStat[]> {
  const { data, error } = await supabase
    .from("ai_my_page_report_stats")
    .select("value, label, color_class_name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((stat) => ({
    value: stat.value,
    label: stat.label,
    colorClassName: stat.color_class_name,
  }));
}

async function getMyPageSideNavItemsFromDb(): Promise<string[]> {
  const { data, error } = await supabase
    .from("ai_my_page_side_nav_items")
    .select("label, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((item) => item.label);
}

async function getMyPageReportHeaderFromDb() {
  const { data, error } = await supabase
    .from("ai_my_page_report_header")
    .select("title, description, generated_date_label")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("MyPage report header data was not found.");

  return {
    title: data.title,
    description: data.description,
    generatedDateLabel: data.generated_date_label,
  };
}

async function getMyPageProjectsFromDb(): Promise<MyPageProject[]> {
  const { data, error } = await supabase
    .from("ai_my_page_projects")
    .select("title, subtitle, tags, period, role, completion_rate, contributions, problem_case, tech_stack, insights, peer_reviews, professor_review, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((project) => ({
    title: project.title,
    subtitle: project.subtitle,
    tags: asArray<string>(project.tags),
    period: project.period,
    role: project.role,
    completionRate: project.completion_rate,
    contributions: asArray<string>(project.contributions),
    problemCase: project.problem_case,
    techStack: asArray<string>(project.tech_stack),
    insights: project.insights,
    peerReviews: asArray<{ text: string; count: number }>(project.peer_reviews),
    professorReview: project.professor_review,
  }));
}

async function getTeamDetailConfigFromDb() {
  const { data, error } = await supabase
    .from("ai_team_detail_config")
    .select("feedback_options, good_keywords, bad_keywords")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Team detail config data was not found.");

  return data;
}

async function getTeamDetailChatMessagesFromDb(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_team_detail_chat_messages")
    .select("id, sender, text, display_time, is_mine, is_anon, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((message) => ({
    id: message.id,
    sender: message.sender,
    text: message.text,
    time: message.display_time,
    isMine: message.is_mine,
    isAnon: message.is_anon,
  }));
}

async function getTeamDetailPeerReviewStudentsFromDb(): Promise<PeerReviewStudent[]> {
  const { data, error } = await supabase
    .from("ai_team_detail_peer_review_students")
    .select("id, name, contribution, peer_keywords, peer_comment, roles, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    contribution: student.contribution,
    peerKeywords: asArray<string>(student.peer_keywords),
    peerComment: student.peer_comment,
    roles: asArray<string>(student.roles),
  }));
}

async function getTeamDetailReviewKeywordsFromDb() {
  const config = await getTeamDetailConfigFromDb();

  return {
    good: asArray<string>(config.good_keywords),
    bad: asArray<string>(config.bad_keywords),
  };
}

async function getTeamDetailFeedbackOptionsFromDb(): Promise<string[]> {
  const config = await getTeamDetailConfigFromDb();
  return asArray<string>(config.feedback_options);
}

async function getTeamDetailTeammatesFromDb(): Promise<PeerReviewTeammate[]> {
  const { data, error } = await supabase
    .from("ai_team_detail_teammates")
    .select("id, name, contribution, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

async function getTeamDetailTroubleshootingLogsFromDb(): Promise<TroubleshootingLog[]> {
  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .select("id, author, status, display_timestamp, problem, plan, solution, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((log) => ({
    id: log.id,
    author: log.author,
    status: log.status,
    timestamp: log.display_timestamp,
    problem: log.problem,
    plan: log.plan ?? undefined,
    solution: log.solution ?? undefined,
  }));
}

async function getQuestionsFromDb(): Promise<Question[]> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  let query = supabase
    .from("ai_questions")
    .select("id, title, content, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (accessibleCourseIds.length > 0) query = query.in("course_id", accessibleCourseIds);

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((question) => ({
    id: question.id,
    title: question.title,
    content: question.content,
    authorId: question.author_id,
    authorName: question.author_name,
    courseId: question.course_id,
    tags: asArray<string>(question.tags),
    answers: asArray(question.answers),
    views: question.views,
    likes: question.likes,
    createdAt: asDate(question.created_at),
    updatedAt: asDate(question.updated_at),
  }));
}

async function getAuthPageSummaryFromDb(): Promise<AuthPageSummary> {
  const { data, error } = await supabase
    .from("ai_auth_page_summary")
    .select("active_course_student_count, example_email")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Auth page summary data was not found.");

  return {
    activeCourseStudentCount: data.active_course_student_count,
    exampleEmail: data.example_email,
  };
}

// 화면에서 사용하는 API 모음입니다.
// 각 함수는 Supabase의 ai_* 테이블을 읽고, 화면이 기대하는 camelCase 타입으로 변환합니다.
export const api = {
  auth: {
    getPageSummary: getAuthPageSummaryFromDb,
  },
  courses: {
    getAll: getCoursesFromDb,
    getById: getCourseByIdFromDb,
  },
  students: {
    getAll: getStudentsFromDb,
    getById: getStudentByIdFromDb,
  },
  professors: {
    getById: getProfessorByIdFromDb,
  },
  teamCards: {
    getAll: getTeamCardsFromDb,
  },
  teamStages: {
    getAll: getTeamStagesFromDb,
  },
  announcements: {
    getAll: getAnnouncementsFromDb,
  },
  studentNetwork: {
    getStudents: getNetworkStudentsFromDb,
    getExtras: getStudentExtrasFromDb,
    getTeamKeywords: getTeamKeywordsFromDb,
    getEditForm: getStudentNetworkEditFormFromDb,
  },
  myPage: {
    getProjects: getMyPageProjectsFromDb,
    getProfile: getMyPageProfileFromDb,
    getSideNavItems: getMyPageSideNavItemsFromDb,
    getReportStats: getMyPageReportStatsFromDb,
    getReportHeader: getMyPageReportHeaderFromDb,
  },
  teamDetail: {
    getFeedbackOptions: getTeamDetailFeedbackOptionsFromDb,
    getChatMessages: getTeamDetailChatMessagesFromDb,
    getPeerReviewStudents: getTeamDetailPeerReviewStudentsFromDb,
    getReviewKeywords: getTeamDetailReviewKeywordsFromDb,
    getTeammates: getTeamDetailTeammatesFromDb,
    getTroubleshootingLogs: getTeamDetailTroubleshootingLogsFromDb,
  },
  projects: {
    getAll: getProjectsFromDb,
  },
  questions: {
    getAll: getQuestionsFromDb,
  },
};
