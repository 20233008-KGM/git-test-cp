import type {
  Course,
  CourseStage,
  CourseStatus,
  CreateCourseInput,
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
  TeamFeedback,
  TeamRetrospective,
  TeamRetrospectiveSections,
  ProfessorProjectEvaluation,
  TeamSubmissionFeedbackItem,
  TeamSubmissionRetrospectiveItem,
  TeamSubmissionPeerReviewItem,
  PeerReviewStudent,
  PeerReviewTeammate,
  TroubleshootingLog,
  TeamDeliverable,
  Project,
  Question,
  Answer,
} from "../types";
import { auth } from "../firebase";
import { supabase } from "../supabase";
import {
  buildDraftReportFromContext,
  buildMyPageActivityBullets,
  buildMyPageCompetencyItems,
  buildMyPagePage3Intro,
  buildMyPageSummaryCards,
  buildMyPageSummaryParagraph,
  buildTechnologiesDraft,
  formatReportActivitySummary,
  gatherAiReportContext,
  generateAiReport as generateAiReportFromEdge,
  mapReportContextToMyPageProjects,
} from "./ai-report";

// Supabase-backed API facade for app pages.
// Reads ai_* tables and maps rows to UI types in ../types.

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
  student_number?: string | null;
  major?: string | null;
  year?: string | null;
  skills?: unknown;
  bio?: string | null;
  tags?: unknown;
  avatar?: string | null;
  image?: string | null;
  department?: string | null;
  office?: string | null;
  office_hours?: string | null;
  research_areas?: unknown;
};

type CourseQueryOptions = {
  status?: CourseStatus | "all";
};

function toStudentProfile(user: AiUser): StudentProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "student",
    studentId: user.student_number ?? "",
    major: user.major ?? "",
    skills: asArray<string>(user.skills),
    bio: user.bio ?? undefined,
  };
}

function toProfessorProfile(user: AiUser): ProfessorProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "professor",
    department: user.department ?? "",
    office: user.office ?? "",
    officeHours: user.office_hours ?? "",
    researchAreas: asArray<string>(user.research_areas),
  };
}

async function getCurrentAiUser(): Promise<AiUser | null> {
  const firebaseUid = auth.currentUser?.uid;
  if (!firebaseUid) return null;

  const { data, error } = await supabase
    .from("ai_users")
    .select("*")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (error) throw error;
  return data as AiUser | null;
}

async function getAccessibleCourseIds(): Promise<string[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) return [];

  if (currentUser.role === "admin") {
    const { data, error } = await supabase.from("ai_courses").select("id");
    if (error) throw error;
    return (data ?? []).map((course) => course.id);
  }

  if (currentUser.role === "professor") {
    const { data, error } = await supabase
      .from("ai_courses")
      .select("id")
      .eq("instructor_user_id", currentUser.id);

    if (error) throw error;
    return (data ?? []).map((course) => course.id);
  }

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

async function joinCourseByCodeInDb(courseCode: string): Promise<{ courseId: string; courseName: string }> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const normalizedCode = courseCode.trim().toUpperCase();
  if (!normalizedCode) throw new Error("수업 코드를 입력해주세요.");

  const { data: course, error: courseError } = await supabase
    .from("ai_courses")
    .select("id, name, code, status")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (courseError) throw courseError;
  if (!course) throw new Error("수업 코드를 찾을 수 없습니다. 예: WEB-2026");
  if (course.status !== "active") throw new Error("종료되었거나 보관된 수업입니다.");

  const { data: existing, error: existingError } = await supabase
    .from("ai_course_memberships")
    .select("id")
    .eq("course_id", course.id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return { courseId: course.id, courseName: course.name };

  const membershipRole = currentUser.role === "professor" ? "assistant" : "student";
  const { error: insertError } = await supabase.from("ai_course_memberships").insert({
    course_id: course.id,
    user_id: currentUser.id,
    role: membershipRole,
    created_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;

  return { courseId: course.id, courseName: course.name };
}

async function getSelectedCourseId(courseId?: string): Promise<string | null> {
  return courseId ?? getPrimaryCourseId();
}

async function getUsersByIds(userIds: string[]): Promise<AiUser[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_users")
    .select("*")
    .in("id", userIds);

  if (error) throw error;
  return (data ?? []) as AiUser[];
}

async function getCourseUsers(courseId: string, role?: "student" | "professor" | "assistant"): Promise<AiUser[]> {
  let membershipQuery = supabase
    .from("ai_course_memberships")
    .select("user_id, role")
    .eq("course_id", courseId);

  if (role) membershipQuery = membershipQuery.eq("role", role);

  const { data: memberships, error } = await membershipQuery;
  if (error) throw error;

  const users = await getUsersByIds((memberships ?? []).map((membership) => membership.user_id));
  const order = new Map((memberships ?? []).map((membership, index) => [membership.user_id, index]));

  return users.sort((a, b) => {
    const numberCompare = (a.student_number ?? "").localeCompare(b.student_number ?? "");
    if (numberCompare !== 0) return numberCompare;
    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  });
}

async function getStudentsFromDb(courseId?: string): Promise<StudentProfile[]> {
  const selectedCourseId = await getSelectedCourseId(courseId);
  if (!selectedCourseId) return [];

  const users = await getCourseUsers(selectedCourseId, "student");
  return users.map(toStudentProfile);
}

async function getStudentByIdFromDb(id: string): Promise<StudentProfile | undefined> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  if (accessibleCourseIds.length === 0) return undefined;

  const { data: membershipRows, error } = await supabase
    .from("ai_course_memberships")
    .select("course_id")
    .eq("user_id", id)
    .eq("role", "student")
    .in("course_id", accessibleCourseIds)
    .limit(1);

  if (error) throw error;
  if (!membershipRows?.length) return undefined;

  const { data: userRow, error: userError } = await supabase.from("ai_users").select("*").eq("id", id).maybeSingle();
  if (userError) throw userError;
  if (!userRow || userRow.role !== "student") return undefined;

  return toStudentProfile(userRow as AiUser);
}

async function getProfessorsFromDb(): Promise<ProfessorProfile[]> {
  const { data, error } = await supabase
    .from("ai_users")
    .select("*")
    .eq("role", "professor")
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as AiUser[]).map(toProfessorProfile);
}

async function getProfessorByIdFromDb(id: string): Promise<ProfessorProfile | undefined> {
  const professors = await getProfessorsFromDb();
  return professors.find((professor) => professor.id === id);
}

function createCourseId(code: string): string {
  const normalizedCode = code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `course-${normalizedCode || Date.now()}-${Date.now()}`;
}

async function getCourseStagesFromDb(courseId?: string): Promise<CourseStage[]> {
  if (!courseId) return [];

  const { data, error } = await supabase
    .from("ai_course_stages")
    .select("id, course_id, name, position, description, is_required")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((stage) => ({
    id: stage.id,
    courseId: stage.course_id,
    name: stage.name,
    position: stage.position,
    description: stage.description ?? undefined,
    isRequired: stage.is_required,
  }));
}

async function getCourseStageNamesFromDb(courseId?: string): Promise<string[]> {
  const courseStages = await getCourseStagesFromDb(courseId);
  if (courseStages.length > 0) return courseStages.map((stage) => stage.name);

  const { data, error } = await supabase
    .from("ai_team_stages")
    .select("name, position")
    .order("position", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((stage) => stage.name);
}

async function getCoursesFromDb(options: CourseQueryOptions = { status: "active" }): Promise<Course[]> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  if (accessibleCourseIds.length === 0) return [];

  let query = supabase
    .from("ai_courses")
    .select("id, name, code, instructor_user_id, schedule, room, students_count, max_students, semester, description, status, archived_at, archived_by")
    .order("id", { ascending: true });

  query = query.in("id", accessibleCourseIds);
  if (options.status && options.status !== "all") query = query.eq("status", options.status);

  const [coursesResult, professors, membershipsResult, stagesResult] = await Promise.all([
    query,
    getProfessorsFromDb(),
    supabase.from("ai_course_memberships").select("course_id, role").eq("role", "student"),
    supabase
      .from("ai_course_stages")
      .select("id, course_id, name, position, description, is_required")
      .order("position", { ascending: true }),
  ]);

  if (coursesResult.error) throw coursesResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (stagesResult.error) throw stagesResult.error;

  const studentCounts = (membershipsResult.data ?? []).reduce<Record<string, number>>((result, membership) => {
    result[membership.course_id] = (result[membership.course_id] ?? 0) + 1;
    return result;
  }, {});

  const stagesByCourse = (stagesResult.data ?? []).reduce<Record<string, CourseStage[]>>((result, stage) => {
    const courseStage = {
      id: stage.id,
      courseId: stage.course_id,
      name: stage.name,
      position: stage.position,
      description: stage.description ?? undefined,
      isRequired: stage.is_required,
    };

    result[stage.course_id] = [...(result[stage.course_id] ?? []), courseStage];
    return result;
  }, {});

  return (coursesResult.data ?? []).map((course) => {
    const professor = professors.find((item) => item.id === course.instructor_user_id);
    const stages = stagesByCourse[course.id] ?? [];

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      professor: professor?.name ?? "",
      professorId: course.instructor_user_id ?? "",
      schedule: course.schedule,
      room: course.room ?? undefined,
      students: studentCounts[course.id] ?? course.students_count,
      maxStudents: course.max_students ?? undefined,
      semester: course.semester,
      description: course.description ?? undefined,
      status: course.status,
      archivedAt: course.archived_at ? new Date(course.archived_at) : undefined,
      archivedBy: course.archived_by ?? undefined,
      stages,
      stageCount: stages.length,
    };
  });
}

async function getCourseByIdFromDb(id: string): Promise<Course | undefined> {
  const courses = await getCoursesFromDb({ status: "all" });
  return courses.find((course) => course.id === id);
}

async function createCourseInDb(input: CreateCourseInput): Promise<Course> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) {
    throw new Error("수업을 생성할 권한이 없습니다.");
  }

  const courseId = createCourseId(input.code);
  const stageNames = input.stages.map((stage) => stage.trim()).filter(Boolean);

  const { error: courseError } = await supabase.from("ai_courses").insert({
    id: courseId,
    name: input.name.trim(),
    code: input.code.trim(),
    instructor_user_id: currentUser.id,
    schedule: input.schedule.trim(),
    room: input.room?.trim() || null,
    students_count: 0,
    max_students: input.maxStudents ?? null,
    semester: input.semester.trim(),
    description: input.description?.trim() || null,
    status: "active",
  });

  if (courseError) throw courseError;

  if (stageNames.length > 0) {
    const { error: stageError } = await supabase.from("ai_course_stages").insert(
      stageNames.map((stage, index) => ({
        course_id: courseId,
        name: stage,
        position: index + 1,
      }))
    );

    if (stageError) throw stageError;
  }

  const createdCourse = await getCourseByIdFromDb(courseId);
  if (!createdCourse) throw new Error("생성된 수업을 다시 불러오지 못했습니다.");
  return createdCourse;
}

async function archiveCourseInDb(courseId: string): Promise<Course> {
  const currentUser = await getCurrentAiUser();
  const course = await getCourseByIdFromDb(courseId);

  if (!currentUser || !course || (currentUser.role !== "admin" && course.professorId !== currentUser.id)) {
    throw new Error("수업을 종료할 권한이 없습니다.");
  }

  const { error } = await supabase
    .from("ai_courses")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) throw error;

  const archivedCourse = await getCourseByIdFromDb(courseId);
  if (!archivedCourse) throw new Error("종료된 수업을 다시 불러오지 못했습니다.");
  return archivedCourse;
}

async function deleteCourseInDb(courseId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");

  if (currentUser.role !== "admin") {
    if (currentUser.role !== "professor" || course.professorId !== currentUser.id) {
      throw new Error("수업을 삭제할 권한이 없습니다.");
    }
  }

  const { data: teams, error: teamsError } = await supabase
    .from("ai_teams")
    .select("id")
    .eq("course_id", courseId);

  if (teamsError) throw teamsError;

  const teamIds = (teams ?? []).map((team) => team.id);

  if (teamIds.length > 0) {
    const detailTables = [
      "ai_team_detail_chat_messages",
      "ai_team_detail_feedbacks",
      "ai_team_detail_peer_reviews",
      "ai_team_detail_retrospectives",
      "ai_team_detail_professor_student_evals",
      "ai_team_detail_professor_project_evals",
      "ai_team_detail_troubleshooting_logs",
      "ai_team_deliverables",
      "ai_team_activities",
      "ai_team_members",
    ] as const;

    for (const table of detailTables) {
      const { error } = await supabase.from(table).delete().in("team_id", teamIds);
      if (error && !isMissingRelationError(error)) throw error;
    }

    const { error: teamsDeleteError } = await supabase.from("ai_teams").delete().eq("course_id", courseId);
    if (teamsDeleteError) throw teamsDeleteError;
  }

  const courseScopedDeletes = [
    supabase.from("ai_announcements").delete().eq("course_id", courseId),
    supabase.from("ai_questions").delete().eq("course_id", courseId),
    supabase.from("ai_projects").delete().eq("course_id", courseId),
    supabase.from("ai_course_stages").delete().eq("course_id", courseId),
    supabase.from("ai_course_memberships").delete().eq("course_id", courseId),
  ];

  for (const op of courseScopedDeletes) {
    const { error } = await op;
    if (error && !isMissingRelationError(error)) throw error;
  }

  const { error: courseDeleteError } = await supabase.from("ai_courses").delete().eq("id", courseId);
  if (courseDeleteError) throw courseDeleteError;
}

async function getTeamCardsFromDb(courseId?: string): Promise<TeamCard[]> {
  const selectedCourseId = await getSelectedCourseId(courseId);
  if (!selectedCourseId) return [];

  const [teamsResult, membersResult, activitiesResult] = await Promise.all([
    supabase
      .from("ai_teams")
      .select("id, name, badge, project_title, progress, completed_stages, sort_order")
      .eq("course_id", selectedCourseId)
      .not("project_title", "is", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ai_team_members")
      .select("id, team_id, user_id, initial, color, role, sort_order")
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
  const memberUsers = await getUsersByIds(
    Array.from(new Set(members.map((member) => member.user_id).filter(Boolean)))
  );

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    badge: team.badge ?? "",
    projectTitle: team.project_title ?? "",
    progress: team.progress,
    completedStages: team.completed_stages,
    members: members
      .filter((member) => member.team_id === team.id)
      .map((member) => {
        const user = memberUsers.find((item) => item.id === member.user_id);

        return {
          id: user?.id ?? member.id,
          name: user?.name,
          studentId: user?.student_number ?? undefined,
          initial: member.initial ?? user?.avatar ?? user?.name.slice(0, 1) ?? "",
          color: member.color ?? "",
          role: member.role ?? undefined,
        };
      }),
    activities: activities
      .filter((activity) => activity.team_id === team.id)
      .slice(0, 2)
      .map((activity) => ({
        tag: activity.tag,
        title: activity.title,
        description: activity.description,
        time: activity.display_time,
      })),
  }));
}

async function assertCourseAllowsEvaluations(courseId: string) {
  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");
  if (course.status !== "archived") {
    throw new Error("교수가 수업을 종료(아카이브)한 뒤에만 평가를 진행할 수 있습니다.");
  }
  return course;
}

async function getTeamStagesFromDb(courseId?: string): Promise<string[]> {
  return getCourseStageNamesFromDb(courseId);
}

async function getAnnouncementsFromDb(courseId?: string, limit?: number): Promise<Announcement[]> {
  const selectedCourseId = await getSelectedCourseId(courseId);
  if (!selectedCourseId) return [];

  const { data, error } = await supabase
    .from("ai_announcements")
    .select("id, title, description, d_day, sort_order, course_id")
    .eq("course_id", selectedCourseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const mapped = (data ?? []).map((announcement) => ({
    title: announcement.title,
    description: announcement.description,
    dDay: announcement.d_day,
  }));

  return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
}

async function createAnnouncementInDb(
  courseId: string,
  input: { title: string; description: string; dDay: number }
): Promise<Announcement> {
  await assertProfessorCanManageCourse(courseId);

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new Error("공지 제목을 입력해주세요.");

  const { data: existing, error: countError } = await supabase
    .from("ai_announcements")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  const id = `ann-${courseId}-${Date.now()}`;
  const { error } = await supabase.from("ai_announcements").insert({
    id,
    course_id: courseId,
    title,
    description,
    d_day: Math.max(0, input.dDay),
    sort_order: nextOrder,
  });

  if (error) throw error;

  return { title, description, dDay: Math.max(0, input.dDay) };
}

async function getNetworkStudentsFromDb(courseId?: string): Promise<NetworkStudent[]> {
  const [currentUser, selectedCourseId] = await Promise.all([getCurrentAiUser(), getSelectedCourseId(courseId)]);
  if (!selectedCourseId) return [];

  const students = await getCourseUsers(selectedCourseId, "student");

  return students.map((student) => ({
    id: student.id,
    name: student.name,
    isSelf: currentUser ? student.id === currentUser.id : false,
    year: student.year ?? undefined,
    major: student.major ?? "",
    bio: student.bio ?? "",
    tags: asArray<string>(student.tags),
    avatar: student.avatar ?? undefined,
    image: student.image ?? undefined,
  }));
}

async function getStudentExtrasFromDb(): Promise<Record<string, StudentExtra>> {
  const { data, error } = await supabase
    .from("ai_user_learning_profiles")
    .select("user_id, temperature, team_project_count, portfolio_file, detailed_bio, keywords");

  if (error) throw error;

  return (data ?? []).reduce<Record<string, StudentExtra>>((result, extra) => {
    result[extra.user_id] = {
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

type NetworkProfileMeta = {
  mbti?: string;
  careerInterest?: string;
  hobbies?: string;
};

function parseNetworkProfileMeta(detailedBio: string | null | undefined): NetworkProfileMeta {
  if (!detailedBio?.trim()) return {};
  try {
    const parsed = JSON.parse(detailedBio) as NetworkProfileMeta;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function getDefaultStudentNetworkEditForm(): Promise<StudentNetworkEditForm> {
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

async function getStudentNetworkEditFormFromDb(): Promise<StudentNetworkEditForm> {
  const defaults = await getDefaultStudentNetworkEditForm();
  const currentUser = await getCurrentAiUser();
  if (!currentUser || currentUser.role !== "student") return defaults;

  const { data: profile, error } = await supabase
    .from("ai_user_learning_profiles")
    .select("portfolio_file, detailed_bio")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) throw error;

  const meta = parseNetworkProfileMeta(profile?.detailed_bio);

  return {
    major: currentUser.major?.trim() || defaults.major,
    mbti: meta.mbti?.trim() || defaults.mbti,
    careerInterest: meta.careerInterest?.trim() || defaults.careerInterest,
    hobbies: meta.hobbies?.trim() || defaults.hobbies,
    bio: currentUser.bio?.trim() || defaults.bio,
    portfolioFileName: profile?.portfolio_file?.trim() || defaults.portfolioFileName,
  };
}

async function saveStudentNetworkProfileInDb(input: StudentNetworkEditForm): Promise<StudentNetworkEditForm> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") throw new Error("학생만 프로필을 수정할 수 있습니다.");

  const major = input.major.trim();
  const bio = input.bio.trim();
  if (!major || !bio) throw new Error("전공과 자기소개를 입력해주세요.");

  const now = new Date().toISOString();
  const profileMeta = JSON.stringify({
    mbti: input.mbti.trim(),
    careerInterest: input.careerInterest.trim(),
    hobbies: input.hobbies.trim(),
  } satisfies NetworkProfileMeta);

  const { error: userError } = await supabase
    .from("ai_users")
    .update({
      major,
      bio,
      updated_at: now,
    })
    .eq("id", currentUser.id);

  if (userError) throw userError;

  const { data: existing, error: fetchError } = await supabase
    .from("ai_user_learning_profiles")
    .select("user_id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const profilePayload = {
    portfolio_file: input.portfolioFileName.trim(),
    detailed_bio: profileMeta,
    updated_at: now,
  };

  if (existing) {
    const { error } = await supabase
      .from("ai_user_learning_profiles")
      .update(profilePayload)
      .eq("user_id", currentUser.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("ai_user_learning_profiles").insert({
      user_id: currentUser.id,
      temperature: 50,
      team_project_count: 0,
      keywords: [],
      created_at: now,
      ...profilePayload,
    });
    if (error) throw error;
  }

  return {
    major,
    mbti: input.mbti.trim(),
    careerInterest: input.careerInterest.trim(),
    hobbies: input.hobbies.trim(),
    bio,
    portfolioFileName: input.portfolioFileName.trim(),
  };
}

async function getProjectsFromDb(): Promise<Project[]> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  if (accessibleCourseIds.length === 0) return [];

  let query = supabase
    .from("ai_projects")
    .select("id, title, description, course_id, team_id, status, deadline, created_at, updated_at")
    .order("created_at", { ascending: true });

  query = query.in("course_id", accessibleCourseIds);

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

export type MyPageArchivedCourse = {
  courseId: string;
  courseName: string;
  semester?: string;
  teamId: string;
  teamName: string;
};

export type CoursePeerReviewOverviewRow = {
  teamId: string;
  teamName: string;
  reviewerName: string;
  teammateName: string;
  goodKeywords: string[];
  badKeywords: string[];
  comment?: string;
};

async function getMyPageArchivedCoursesFromDb(): Promise<MyPageArchivedCourse[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) return [];

  const { data: memberships, error: memError } = await supabase
    .from("ai_team_members")
    .select("team_id")
    .eq("user_id", currentUser.id);
  if (memError) throw memError;

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id).filter(Boolean))
  ) as string[];
  if (teamIds.length === 0) return [];

  const { data: teams, error: teamError } = await supabase
    .from("ai_teams")
    .select("id, name, course_id")
    .in("id", teamIds);
  if (teamError) throw teamError;

  const courseIds = Array.from(
    new Set((teams ?? []).map((t) => t.course_id).filter(Boolean))
  ) as string[];
  if (courseIds.length === 0) return [];

  const { data: courses, error: courseError } = await supabase
    .from("ai_courses")
    .select("id, name, semester, status")
    .in("id", courseIds);
  if (courseError) throw courseError;

  const archivedIds = new Set(
    (courses ?? []).filter((c) => c.status === "archived").map((c) => c.id)
  );
  const courseById = new Map((courses ?? []).map((c) => [c.id, c]));

  return (teams ?? [])
    .filter((team) => archivedIds.has(team.course_id))
    .map((team) => {
      const course = courseById.get(team.course_id);
      return {
        courseId: team.course_id,
        courseName: course?.name ?? "수업",
        semester: course?.semester ?? undefined,
        teamId: team.id,
        teamName: team.name,
      };
    });
}

async function updateMyPageAvatarFromDb(imageDataUrl: string): Promise<string> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!imageDataUrl.startsWith("data:image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }
  if (imageDataUrl.length > 500_000) {
    throw new Error("이미지가 너무 큽니다. 500KB 이하로 줄여 주세요.");
  }

  const { error } = await supabase
    .from("ai_users")
    .update({ image: imageDataUrl })
    .eq("id", currentUser.id);
  if (error) throw error;
  return imageDataUrl;
}

async function getCoursePeerReviewsOverviewFromDb(
  courseId: string
): Promise<CoursePeerReviewOverviewRow[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) {
    return [];
  }

  const course = await getCourseByIdFromDb(courseId);
  if (!course) return [];
  if (currentUser.role === "professor" && course.professorId !== currentUser.id) {
    throw new Error("본인 수업만 조회할 수 있습니다.");
  }

  const { data: teams, error: teamError } = await supabase
    .from("ai_teams")
    .select("id, name")
    .eq("course_id", courseId);
  if (teamError) throw teamError;

  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length === 0) return [];

  const { data: reviews, error: reviewError } = await supabase
    .from("ai_team_detail_peer_reviews")
    .select("team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });
  if (reviewError) {
    if (isMissingRelationError(reviewError)) return [];
    throw reviewError;
  }

  const userIds = Array.from(
    new Set(
      (reviews ?? []).flatMap((r) => [r.reviewer_user_id, r.teammate_id]).filter(Boolean)
    )
  ) as string[];

  let nameById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users, error: userError } = await supabase
      .from("ai_users")
      .select("id, name")
      .in("id", userIds);
    if (userError) throw userError;
    nameById = new Map((users ?? []).map((u) => [u.id, u.name]));
  }

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return (reviews ?? []).map((row) => ({
    teamId: row.team_id as string,
    teamName: teamNameById.get(row.team_id as string) ?? row.team_id,
    reviewerName: nameById.get(row.reviewer_user_id as string) ?? "리뷰어",
    teammateName: nameById.get(row.teammate_id as string) ?? "피평가자",
    goodKeywords: asArray<string>(row.good_keywords),
    badKeywords: asArray<string>(row.bad_keywords),
    comment: (row.comment as string) ?? undefined,
  }));
}

export type MyPeerReviewGivenItem = {
  teammateName: string;
  goodKeywords: string[];
  badKeywords: string[];
  comment?: string;
};

export type MyProfessorEvalInCourse = {
  teamId: string;
  teamName: string;
  projectTitle: string;
  studentComment?: string;
  projectCompletion?: string;
  projectProblemSolving?: string;
  projectHolistic?: string;
};

export type MyPageStudentProfileInput = {
  name: string;
  major: string;
  bio: string;
  skills: string[];
};

async function getMyPeerReviewsGivenInCourseFromDb(
  courseId: string
): Promise<MyPeerReviewGivenItem[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || currentUser.role !== "student") return [];

  const teamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("ai_team_detail_peer_reviews")
    .select("teammate_id, good_keywords, bad_keywords, comment")
    .eq("team_id", teamId)
    .eq("reviewer_user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const teammateIds = Array.from(
    new Set((data ?? []).map((row) => row.teammate_id).filter(Boolean))
  ) as string[];

  let nameById = new Map<string, string>();
  if (teammateIds.length > 0) {
    const { data: users, error: userError } = await supabase
      .from("ai_users")
      .select("id, name")
      .in("id", teammateIds);
    if (userError) throw userError;
    nameById = new Map((users ?? []).map((u) => [u.id, u.name]));
  }

  return (data ?? []).map((row) => ({
    teammateName: nameById.get(row.teammate_id as string) ?? "팀원",
    goodKeywords: asArray<string>(row.good_keywords),
    badKeywords: asArray<string>(row.bad_keywords),
    comment: (row.comment as string) ?? undefined,
  }));
}

async function getMyProfessorEvalsInCourseFromDb(
  courseId: string
): Promise<MyProfessorEvalInCourse | null> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || currentUser.role !== "student") return null;

  const teamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
  if (!teamId) return null;

  const { data: team, error: teamError } = await supabase
    .from("ai_teams")
    .select("id, name, project_title")
    .eq("id", teamId)
    .maybeSingle();
  if (teamError) throw teamError;
  if (!team) return null;

  const [studentEvalResult, projectEvalResult] = await Promise.all([
    supabase
      .from("ai_team_detail_professor_student_evals")
      .select("comment")
      .eq("team_id", teamId)
      .eq("student_row_id", currentUser.id)
      .maybeSingle(),
    supabase
      .from("ai_team_detail_professor_project_evals")
      .select("completion_comment, problem_solving_comment, holistic_comment")
      .eq("team_id", teamId)
      .maybeSingle(),
  ]);

  if (studentEvalResult.error && !isMissingRelationError(studentEvalResult.error)) {
    throw studentEvalResult.error;
  }
  if (projectEvalResult.error && !isMissingRelationError(projectEvalResult.error)) {
    throw projectEvalResult.error;
  }

  const studentRow = studentEvalResult.error ? null : studentEvalResult.data;
  const projectRow = projectEvalResult.error ? null : projectEvalResult.data;

  const hasContent =
    Boolean(studentRow?.comment?.trim()) ||
    Boolean(projectRow?.completion_comment?.trim()) ||
    Boolean(projectRow?.problem_solving_comment?.trim()) ||
    Boolean(projectRow?.holistic_comment?.trim());

  if (!hasContent) {
    return {
      teamId,
      teamName: team.name,
      projectTitle: team.project_title ?? team.name,
    };
  }

  return {
    teamId,
    teamName: team.name,
    projectTitle: team.project_title ?? team.name,
    studentComment: studentRow?.comment?.trim() || undefined,
    projectCompletion: projectRow?.completion_comment?.trim() || undefined,
    projectProblemSolving: projectRow?.problem_solving_comment?.trim() || undefined,
    projectHolistic: projectRow?.holistic_comment?.trim() || undefined,
  };
}

async function saveMyPageStudentProfileFromDb(
  input: MyPageStudentProfileInput
): Promise<MyPageStudentProfileInput> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") throw new Error("학생만 프로필을 수정할 수 있습니다.");

  const name = input.name.trim();
  const major = input.major.trim();
  const bio = input.bio.trim();
  const skills = input.skills.map((s) => s.trim()).filter(Boolean).slice(0, 12);

  if (!name) throw new Error("이름을 입력해주세요.");
  if (!major) throw new Error("전공을 입력해주세요.");

  const { error } = await supabase
    .from("ai_users")
    .update({
      name,
      major,
      bio: bio || null,
      skills,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentUser.id);

  if (error) throw error;
  return { name, major, bio, skills };
}

async function getMyPageProfileFromDb(): Promise<MyPageProfile> {
  const currentUser = await getCurrentAiUser();

  if (currentUser) {
    return {
      initial: currentUser.name.slice(0, 1),
      name: currentUser.name,
      email: currentUser.email,
      schoolAndMajor: currentUser.role === "professor" ? "컴퓨터공학부 교수" : "컴퓨터공학과 학생",
      imageUrl: currentUser.image ?? currentUser.avatar ?? undefined,
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
    problemCase: project.problem_case as MyPageProject["problemCase"],
    techStack: asArray<string>(project.tech_stack),
    insights: project.insights,
    peerReviews: asArray<{ text: string; count: number }>(project.peer_reviews),
    professorReview: project.professor_review,
  }));
}

/** ai_my_page_projects → 없으면 참여 팀 활동 집계 */
async function getMyPageProjectsForUserFromDb(): Promise<MyPageProject[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) return [];

  try {
    const context = await gatherAiReportContext(currentUser.id);
    if (context.teams.length === 0) return [];

    return mapReportContextToMyPageProjects(context);
  } catch {
    return [];
  }
}

async function getTeamDetailConfigFromDb(teamId?: string) {
  if (!teamId) throw new Error("Team id is required for team detail config.");

  const { data, error } = await supabase
    .from("ai_team_detail_config")
    .select("feedback_options, good_keywords, bad_keywords")
    .eq("team_id", teamId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Team detail config data was not found.");

  return data;
}

type TeamDetailChatMessageRow = {
  id: string;
  sender: string;
  text: string;
  display_time: string;
  is_mine: boolean;
  is_anon: boolean;
};

function mapTeamDetailChatMessageRow(
  message: TeamDetailChatMessageRow,
  currentUserName?: string
): ChatMessage {
  const isAnon = message.is_anon;
  const isMine = !isAnon && Boolean(currentUserName) && message.sender === currentUserName;

  return {
    id: message.id,
    sender: message.sender,
    text: message.text,
    time: message.display_time,
    isMine,
    isAnon,
  };
}

function createTeamDetailChatMessageId(teamId: string): string {
  const slug = teamId.replace(/[^a-z0-9]+/gi, "-").slice(0, 24);
  return `chat-${slug}-${Date.now()}`;
}

async function getTeamDetailChatMessagesFromDb(teamId?: string): Promise<ChatMessage[]> {
  if (!teamId) return [];

  const currentUser = await getCurrentAiUser();

  const { data, error } = await supabase
    .from("ai_team_detail_chat_messages")
    .select("id, sender, text, display_time, is_mine, is_anon, sort_order, team_id")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((message) =>
    mapTeamDetailChatMessageRow(message as TeamDetailChatMessageRow, currentUser?.name)
  );
}

async function sendTeamDetailChatMessageInDb(
  teamId: string,
  input: { text: string; isAnon: boolean }
): Promise<ChatMessage> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");

  const text = input.text.trim();
  if (!text) throw new Error("메시지를 입력해주세요.");

  const { courseId } = await assertTeamDeliverableAccess(teamId);
  const course = await getCourseByIdFromDb(courseId);
  if (course?.status === "archived") {
    throw new Error("종료된 수업에서는 채팅을 새로 작성할 수 없습니다.");
  }

  const { data: lastMessage, error: sortError } = await supabase
    .from("ai_team_detail_chat_messages")
    .select("sort_order")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sortError) throw sortError;
  const nextSortOrder = (lastMessage?.sort_order ?? 0) + 1;

  const now = new Date();
  const displayTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("ai_team_detail_chat_messages")
    .insert({
      id: createTeamDetailChatMessageId(teamId),
      team_id: teamId,
      sender: input.isAnon ? "익명" : currentUser.name,
      text,
      display_time: displayTime,
      is_mine: true,
      is_anon: input.isAnon,
      sort_order: nextSortOrder,
    })
    .select("id, sender, text, display_time, is_mine, is_anon")
    .single();

  if (error) throw error;

  return mapTeamDetailChatMessageRow(data as TeamDetailChatMessageRow, currentUser.name);
}

type TeamFeedbackRow = {
  id: string;
  team_id: string;
  author_name: string;
  selected_options: unknown;
  custom_text: string | null;
  created_at: string;
};

function mapTeamFeedbackRow(row: TeamFeedbackRow): TeamFeedback {
  return {
    id: row.id,
    teamId: row.team_id,
    authorName: row.author_name,
    selectedOptions: asArray<string>(row.selected_options),
    customText: row.custom_text ?? undefined,
    createdAt: asDate(row.created_at),
  };
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

export type EvalSchemaStatus = {
  ready: boolean;
  missingTables: string[];
  /** 구버전 팀 상세 표시용 테이블(시드에 포함, 평가 조회 API와 별개) */
  legacyPeerDisplayTable: boolean;
};

async function probeTableReachable(table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (!error) return true;
  if (isMissingRelationError(error)) return false;
  throw error;
}

async function getEvalSchemaStatusFromDb(): Promise<EvalSchemaStatus> {
  const probes: { label: string; table: string }[] = [
    { label: "동료평가", table: "ai_team_detail_peer_reviews" },
    { label: "교수 학생 평가", table: "ai_team_detail_professor_student_evals" },
    { label: "교수 프로젝트 평가", table: "ai_team_detail_professor_project_evals" },
  ];
  const missingTables: string[] = [];
  for (const probe of probes) {
    const ok = await probeTableReachable(probe.table);
    if (!ok) missingTables.push(probe.label);
  }
  const legacyPeerDisplayTable = await probeTableReachable("ai_team_detail_peer_review_students");
  return {
    ready: missingTables.length === 0,
    missingTables,
    legacyPeerDisplayTable,
  };
}

function createTeamFeedbackId(teamId: string, userId: string): string {
  return `fb-${teamId.replace(/[^a-z0-9]+/gi, "-").slice(0, 16)}-${userId.slice(0, 8)}-${Date.now()}`;
}

async function getMyTeamFeedbackFromDb(teamId?: string): Promise<TeamFeedback | null> {
  if (!teamId) return null;

  const currentUser = await getCurrentAiUser();
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from("ai_team_detail_feedbacks")
    .select("id, team_id, author_name, selected_options, custom_text, created_at")
    .eq("team_id", teamId)
    .eq("author_user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
  if (!data) return null;

  return mapTeamFeedbackRow(data as TeamFeedbackRow);
}

async function submitTeamFeedbackInDb(
  teamId: string,
  input: { selectedOptions: string[]; customText?: string }
): Promise<TeamFeedback> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");

  const selectedOptions = input.selectedOptions.filter(Boolean);
  const customText = input.customText?.trim();
  if (selectedOptions.length === 0 && !customText) {
    throw new Error("피드백을 하나 이상 선택하거나 기타 의견을 입력해주세요.");
  }

  const { courseId } = await assertTeamDeliverableAccess(teamId);
  const course = await getCourseByIdFromDb(courseId);
  if (course?.status === "archived") {
    throw new Error("종료된 수업에서는 피드백을 새로 작성할 수 없습니다.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_team_detail_feedbacks")
    .upsert(
      {
        id: createTeamFeedbackId(teamId, currentUser.id),
        team_id: teamId,
        author_user_id: currentUser.id,
        author_name: currentUser.name,
        selected_options: selectedOptions,
        custom_text: customText || null,
        updated_at: now,
      },
      { onConflict: "team_id,author_user_id" }
    )
    .select("id, team_id, author_name, selected_options, custom_text, created_at")
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "피드백 테이블이 아직 준비되지 않았습니다. Supabase에서 H-007 SQL을 실행해 주세요."
      );
    }
    throw error;
  }

  return mapTeamFeedbackRow(data as TeamFeedbackRow);
}

type TeamRetrospectiveRow = {
  id: string;
  team_id: string;
  author_name: string;
  sections: unknown;
  created_at: string;
};

const RETROSPECTIVE_SECTION_KEYS = ["role", "strengths", "regrets", "growth"] as const;

function emptyRetrospectiveSections(): TeamRetrospectiveSections {
  return {
    role: { auto: "", custom: "" },
    strengths: { auto: "", custom: "" },
    regrets: { auto: "", custom: "" },
    growth: { auto: "", custom: "" },
  };
}

function parseRetrospectiveSections(raw: unknown): TeamRetrospectiveSections {
  const base = emptyRetrospectiveSections();
  if (!raw || typeof raw !== "object") return base;

  const record = raw as Record<string, unknown>;
  for (const key of RETROSPECTIVE_SECTION_KEYS) {
    const section = record[key];
    if (!section || typeof section !== "object") continue;
    const content = section as Record<string, unknown>;
    base[key] = {
      auto: typeof content.auto === "string" ? content.auto : "",
      custom: typeof content.custom === "string" ? content.custom : "",
    };
  }
  return base;
}

export function buildRetrospectiveAutoHints(
  logs: TroubleshootingLog[],
  authorName: string
): Record<(typeof RETROSPECTIVE_SECTION_KEYS)[number], string> {
  const mine = logs.filter((log) => log.author === authorName);
  const resolved = mine.filter((log) => log.status === "resolved");
  const open = mine.filter((log) => log.status !== "resolved");

  const roleFromResolved = resolved
    .map((log) => log.problem)
    .filter(Boolean)
    .slice(0, 3)
    .join(" / ");
  const roleFromOpen = open
    .map((log) => log.problem)
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");

  return {
    role: roleFromResolved || roleFromOpen || "등록한 트러블슈팅이 없습니다.",
    strengths: resolved.length
      ? resolved
          .map((log) => log.solution || log.plan)
          .filter(Boolean)
          .slice(0, 2)
          .join(" / ")
      : "—",
    regrets: open.length
      ? open
          .map((log) => log.problem)
          .filter(Boolean)
          .slice(0, 2)
          .join(" / ")
      : "—",
    growth: resolved.length ? `문제 해결 완료 ${resolved.length}건` : "—",
  };
}

function mapTeamRetrospectiveRow(row: TeamRetrospectiveRow): TeamRetrospective {
  return {
    id: row.id,
    teamId: row.team_id,
    authorName: row.author_name,
    sections: parseRetrospectiveSections(row.sections),
    createdAt: asDate(row.created_at),
  };
}

function createTeamRetrospectiveId(teamId: string, userId: string): string {
  return `retro-${teamId.replace(/[^a-z0-9]+/gi, "-").slice(0, 16)}-${userId.slice(0, 8)}-${Date.now()}`;
}

function sectionsFromAutoHints(
  auto: Record<(typeof RETROSPECTIVE_SECTION_KEYS)[number], string>
): TeamRetrospectiveSections {
  return {
    role: { auto: auto.role, custom: "" },
    strengths: { auto: auto.strengths, custom: "" },
    regrets: { auto: auto.regrets, custom: "" },
    growth: { auto: auto.growth, custom: "" },
  };
}

async function getTeamRetrospectiveDraftFromDb(
  teamId?: string
): Promise<{ sections: TeamRetrospectiveSections; submitted: boolean }> {
  if (!teamId) return { sections: emptyRetrospectiveSections(), submitted: false };

  const currentUser = await getCurrentAiUser();
  if (!currentUser) return { sections: emptyRetrospectiveSections(), submitted: false };

  const logs = await getTeamDetailTroubleshootingLogsFromDb(teamId);
  const auto = buildRetrospectiveAutoHints(logs, currentUser.name);

  const { data, error } = await supabase
    .from("ai_team_detail_retrospectives")
    .select("id, team_id, author_name, sections, created_at")
    .eq("team_id", teamId)
    .eq("author_user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return { sections: sectionsFromAutoHints(auto), submitted: false };
    }
    throw error;
  }

  if (data) {
    return {
      sections: parseRetrospectiveSections((data as TeamRetrospectiveRow).sections),
      submitted: true,
    };
  }

  return { sections: sectionsFromAutoHints(auto), submitted: false };
}

async function submitTeamRetrospectiveInDb(
  teamId: string,
  sections: TeamRetrospectiveSections
): Promise<TeamRetrospective> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");

  const hasContent = RETROSPECTIVE_SECTION_KEYS.some((key) => {
    const section = sections[key];
    const custom = section.custom.trim();
    const auto = section.auto.trim();
    return (
      custom.length > 0 ||
      (auto.length > 0 && auto !== "—" && auto !== "등록한 트러블슈팅이 없습니다.")
    );
  });
  if (!hasContent) {
    throw new Error("회고 내용을 하나 이상 입력하거나 자동 연동 항목을 확인해 주세요.");
  }

  const { courseId } = await assertTeamDeliverableAccess(teamId);
  await assertCourseAllowsEvaluations(courseId);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_team_detail_retrospectives")
    .upsert(
      {
        id: createTeamRetrospectiveId(teamId, currentUser.id),
        team_id: teamId,
        author_user_id: currentUser.id,
        author_name: currentUser.name,
        sections,
        updated_at: now,
      },
      { onConflict: "team_id,author_user_id" }
    )
    .select("id, team_id, author_name, sections, created_at")
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "회고록 테이블이 아직 준비되지 않았습니다. Supabase에서 H-009 SQL을 실행해 주세요."
      );
    }
    throw error;
  }

  return mapTeamRetrospectiveRow(data as TeamRetrospectiveRow);
}

export function buildTeamProgressSummary(
  deliverables: TeamDeliverable[],
  logs: TroubleshootingLog[]
): string {
  const resolved = logs.filter((log) => log.status === "resolved");
  const inProgress = logs.filter((log) => log.status !== "resolved");
  const deliverableNames = deliverables
    .slice(0, 3)
    .map((item) => item.fileName)
    .join(", ");
  const solvedTopics = resolved
    .map((log) => log.problem)
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");

  const parts: string[] = [];
  parts.push(
    `업로드된 산출물 ${deliverables.length}건${
      deliverableNames ? ` (${deliverableNames}${deliverables.length > 3 ? " …" : ""})` : ""
    }.`
  );
  parts.push(
    `트러블슈팅 해결 ${resolved.length}건, 진행·보고 중 ${inProgress.length}건.`
  );
  if (solvedTopics) {
    parts.push(`최근 해결 이슈: ${solvedTopics}.`);
  }
  parts.push("교수 평가·AI 리포트는 이 활동 데이터를 바탕으로 보완됩니다.");
  return parts.join(" ");
}

const emptyProfessorProjectEvaluation = (): ProfessorProjectEvaluation => ({
  completionComment: "",
  problemSolvingComment: "",
  holisticComment: "",
});

async function assertProfessorTeamAccess(teamId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) {
    throw new Error("교수만 평가를 저장할 수 있습니다.");
  }
  await assertTeamDeliverableAccess(teamId);
  const courseId = await getTeamCourseIdFromDb(teamId);
  if (courseId) await assertCourseAllowsEvaluations(courseId);
}

function createProfessorStudentEvalId(
  teamId: string,
  professorId: string,
  studentRowId: string
): string {
  return `pe-${teamId.slice(0, 12)}-${professorId.slice(0, 8)}-${studentRowId.slice(0, 8)}`;
}

function createProfessorProjectEvalId(teamId: string, professorId: string): string {
  return `pp-${teamId.slice(0, 16)}-${professorId.slice(0, 8)}`;
}

async function getProfessorStudentEvalsFromDb(teamId?: string): Promise<Record<string, string>> {
  if (!teamId) return {};

  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) return {};

  const { data, error } = await supabase
    .from("ai_team_detail_professor_student_evals")
    .select("student_row_id, comment")
    .eq("team_id", teamId)
    .eq("professor_user_id", currentUser.id);

  if (error) {
    if (isMissingRelationError(error)) return {};
    throw error;
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.student_row_id as string, (row.comment as string) ?? ""])
  );
}

async function saveProfessorStudentEvalInDb(
  teamId: string,
  studentRowId: string,
  comment: string
): Promise<void> {
  await assertProfessorTeamAccess(teamId);
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const trimmed = comment.trim();
  if (!trimmed) return;

  const now = new Date().toISOString();
  const { error } = await supabase.from("ai_team_detail_professor_student_evals").upsert(
    {
      id: createProfessorStudentEvalId(teamId, currentUser.id, studentRowId),
      team_id: teamId,
      student_row_id: studentRowId,
      professor_user_id: currentUser.id,
      comment: trimmed,
      updated_at: now,
    },
    { onConflict: "team_id,professor_user_id,student_row_id" }
  );

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "교수 평가 테이블이 아직 준비되지 않았습니다. Supabase에서 H-010 SQL을 실행해 주세요."
      );
    }
    throw error;
  }
}

async function getProfessorProjectEvalFromDb(
  teamId?: string
): Promise<ProfessorProjectEvaluation> {
  if (!teamId) return emptyProfessorProjectEvaluation();

  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) {
    return emptyProfessorProjectEvaluation();
  }

  const { data, error } = await supabase
    .from("ai_team_detail_professor_project_evals")
    .select("completion_comment, problem_solving_comment, holistic_comment")
    .eq("team_id", teamId)
    .eq("professor_user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return emptyProfessorProjectEvaluation();
    throw error;
  }

  if (!data) return emptyProfessorProjectEvaluation();

  return {
    completionComment: data.completion_comment ?? "",
    problemSolvingComment: data.problem_solving_comment ?? "",
    holisticComment: data.holistic_comment ?? "",
  };
}

async function saveProfessorProjectEvalInDb(
  teamId: string,
  input: ProfessorProjectEvaluation
): Promise<ProfessorProjectEvaluation> {
  await assertProfessorTeamAccess(teamId);
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const payload = {
    completionComment: input.completionComment.trim(),
    problemSolvingComment: input.problemSolvingComment.trim(),
    holisticComment: input.holisticComment.trim(),
  };

  if (
    !payload.completionComment &&
    !payload.problemSolvingComment &&
    !payload.holisticComment
  ) {
    throw new Error("평가 내용을 하나 이상 입력해 주세요.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("ai_team_detail_professor_project_evals").upsert(
    {
      id: createProfessorProjectEvalId(teamId, currentUser.id),
      team_id: teamId,
      professor_user_id: currentUser.id,
      completion_comment: payload.completionComment || null,
      problem_solving_comment: payload.problemSolvingComment || null,
      holistic_comment: payload.holisticComment || null,
      updated_at: now,
    },
    { onConflict: "team_id,professor_user_id" }
  );

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "교수 프로젝트 평가 테이블이 아직 준비되지 않았습니다. Supabase에서 H-010 SQL을 실행해 주세요."
      );
    }
    throw error;
  }

  return payload;
}

async function getTeamSubmissionFeedbacksFromDb(
  teamId?: string
): Promise<TeamSubmissionFeedbackItem[]> {
  if (!teamId) return [];

  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) return [];

  await assertTeamDeliverableAccess(teamId);

  const { data, error } = await supabase
    .from("ai_team_detail_feedbacks")
    .select("author_name, selected_options, custom_text")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    authorName: row.author_name as string,
    selectedOptions: asArray<string>(row.selected_options),
    customText: (row.custom_text as string) ?? undefined,
  }));
}

async function getTeamSubmissionPeerReviewsFromDb(
  teamId?: string
): Promise<TeamSubmissionPeerReviewItem[]> {
  if (!teamId) return [];

  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) return [];

  await assertTeamDeliverableAccess(teamId);

  const [reviewsResult, students] = await Promise.all([
    supabase
      .from("ai_team_detail_peer_reviews")
      .select("teammate_id, good_keywords, bad_keywords, comment")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
    getTeamDetailPeerReviewStudentsFromDb(teamId),
  ]);

  const { data, error } = reviewsResult;
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const nameById = Object.fromEntries(students.map((s) => [s.id, s.name]));

  return (data ?? []).map((row) => ({
    teammateId: row.teammate_id as string,
    teammateName: nameById[row.teammate_id as string] ?? row.teammate_id,
    goodKeywords: asArray<string>(row.good_keywords),
    badKeywords: asArray<string>(row.bad_keywords),
    comment: (row.comment as string) ?? undefined,
  }));
}

async function getTeamSubmissionRetrospectivesFromDb(
  teamId?: string
): Promise<TeamSubmissionRetrospectiveItem[]> {
  if (!teamId) return [];

  const currentUser = await getCurrentAiUser();
  if (!currentUser || !["professor", "admin"].includes(currentUser.role)) return [];

  await assertTeamDeliverableAccess(teamId);

  const { data, error } = await supabase
    .from("ai_team_detail_retrospectives")
    .select("author_name, sections")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    authorName: row.author_name as string,
    sections: parseRetrospectiveSections(row.sections),
  }));
}

export type PeerReviewDraft = {
  good: string[];
  bad: string[];
  comment: string;
  submitted: boolean;
};

type PeerReviewRow = {
  id: string;
  team_id: string;
  teammate_id: string;
  good_keywords: unknown;
  bad_keywords: unknown;
  comment: string | null;
};

function createPeerReviewId(teamId: string, reviewerId: string, teammateId: string): string {
  return `pr-${teamId.slice(0, 12)}-${reviewerId.slice(0, 6)}-${teammateId.slice(0, 12)}-${Date.now()}`;
}

async function getMyPeerReviewsFromDb(
  teamId?: string
): Promise<Record<string, PeerReviewDraft>> {
  if (!teamId) return {};

  const currentUser = await getCurrentAiUser();
  if (!currentUser) return {};

  const { data, error } = await supabase
    .from("ai_team_detail_peer_reviews")
    .select("id, team_id, teammate_id, good_keywords, bad_keywords, comment")
    .eq("team_id", teamId)
    .eq("reviewer_user_id", currentUser.id);

  if (error) {
    if (isMissingRelationError(error)) return {};
    throw error;
  }

  const result: Record<string, PeerReviewDraft> = {};
  for (const row of data ?? []) {
    const good = asArray<string>(row.good_keywords);
    const bad = asArray<string>(row.bad_keywords);
    const comment = row.comment?.trim() ?? "";
    result[row.teammate_id] = {
      good,
      bad,
      comment,
      submitted: good.length > 0 || bad.length > 0 || comment.length > 0,
    };
  }
  return result;
}

async function submitPeerReviewInDb(
  teamId: string,
  teammateId: string,
  input: { goodKeywords: string[]; badKeywords: string[]; comment?: string }
): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId || !teammateId) throw new Error("팀·팀원 정보가 없습니다.");

  const goodKeywords = input.goodKeywords.filter(Boolean);
  const badKeywords = input.badKeywords.filter(Boolean);
  const comment = input.comment?.trim() ?? "";
  if (goodKeywords.length === 0 && badKeywords.length === 0 && !comment) {
    throw new Error("키워드 또는 코멘트를 입력해주세요.");
  }

  const { courseId } = await assertTeamDeliverableAccess(teamId);
  await assertCourseAllowsEvaluations(courseId);

  const now = new Date().toISOString();
  const { error } = await supabase.from("ai_team_detail_peer_reviews").upsert(
    {
      id: createPeerReviewId(teamId, currentUser.id, teammateId),
      team_id: teamId,
      reviewer_user_id: currentUser.id,
      teammate_id: teammateId,
      good_keywords: goodKeywords,
      bad_keywords: badKeywords,
      comment: comment || null,
      updated_at: now,
    },
    { onConflict: "team_id,reviewer_user_id,teammate_id" }
  );

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "동료평가 테이블이 아직 준비되지 않았습니다. Supabase에서 H-008 SQL을 실행해 주세요."
      );
    }
    throw error;
  }
}

async function getTeamDetailPeerReviewStudentsFromDb(teamId?: string): Promise<PeerReviewStudent[]> {
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("ai_team_detail_peer_review_students")
    .select("id, name, contribution, peer_keywords, peer_comment, roles, sort_order, team_id")
    .eq("team_id", teamId)
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

async function getTeamDetailReviewKeywordsFromDb(teamId?: string) {
  const config = await getTeamDetailConfigFromDb(teamId);

  return {
    good: asArray<string>(config.good_keywords),
    bad: asArray<string>(config.bad_keywords),
  };
}

async function getTeamDetailFeedbackOptionsFromDb(teamId?: string): Promise<string[]> {
  const config = await getTeamDetailConfigFromDb(teamId);
  return asArray<string>(config.feedback_options);
}

async function getTeamDetailTeammatesFromDb(teamId?: string): Promise<PeerReviewTeammate[]> {
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("ai_team_detail_teammates")
    .select("id, name, contribution, sort_order, team_id")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  if ((data ?? []).length > 0) {
    return data ?? [];
  }

  const { data: members, error: membersError } = await supabase
    .from("ai_team_members")
    .select("id, user_id, role, sort_order")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true });

  if (membersError) throw membersError;

  const users = await getUsersByIds(
    Array.from(new Set((members ?? []).map((member) => member.user_id).filter(Boolean)))
  );

  return (members ?? []).map((member) => {
    const user = users.find((item) => item.id === member.user_id);
    return {
      id: member.user_id ?? member.id,
      name: user?.name ?? "팀원",
      contribution: member.role === "leader" ? 100 : 80,
      sort_order: member.sort_order,
      team_id: teamId,
    };
  });
}

async function getTeamFeedbackCountsFromDb(teamId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("ai_team_detail_feedbacks")
    .select("selected_options, custom_text")
    .eq("team_id", teamId);

  if (error) {
    if (isMissingRelationError(error)) return {};
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    for (const option of asArray<string>(row.selected_options)) {
      if (!option) continue;
      counts[option] = (counts[option] ?? 0) + 1;
    }
    if (row.custom_text) {
      counts["기타"] = (counts["기타"] ?? 0) + 1;
    }
  }
  return counts;
}

async function updateTeamCompletedStagesInDb(
  teamId: string,
  completedStages: number
): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") {
    throw new Error("학생만 팀 진행 단계를 수정할 수 있습니다.");
  }

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀을 찾을 수 없습니다.");

  await assertActiveCourseMembership(courseId);

  const myTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
  if (myTeamId !== teamId) {
    throw new Error("내가 속한 팀만 진행 단계를 수정할 수 있습니다.");
  }

  const stageNames = await getCourseStageNamesFromDb(courseId);
  const clamped = Math.max(0, Math.min(completedStages, stageNames.length));

  const { error } = await supabase
    .from("ai_teams")
    .update({
      completed_stages: clamped,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (error) throw error;
}

async function saveProfessorProfileInDb(input: {
  department: string;
  office: string;
  officeHours: string;
  researchAreas: string[];
}): Promise<ProfessorProfile> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "professor" && currentUser.role !== "admin") {
    throw new Error("교수만 프로필을 수정할 수 있습니다.");
  }

  const department = input.department.trim();
  if (!department) throw new Error("소속을 입력해주세요.");

  const { error } = await supabase
    .from("ai_users")
    .update({
      department,
      office: input.office.trim(),
      office_hours: input.officeHours.trim(),
      research_areas: input.researchAreas.filter(Boolean),
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentUser.id);

  if (error) throw error;

  const updated = await getProfessorByIdFromDb(currentUser.id);
  if (!updated) throw new Error("프로필을 다시 불러오지 못했습니다.");
  return updated;
}

export type CreateTroubleshootingLogInput = {
  problem: string;
  plan?: string;
  solution?: string;
  status?: TroubleshootingLog["status"];
};

export type UpdateTroubleshootingLogInput = {
  problem?: string;
  plan?: string;
  solution?: string;
  status?: TroubleshootingLog["status"];
};

function mapTroubleshootingLogRow(log: {
  id: string;
  author: string;
  status: string;
  display_timestamp: string;
  problem: string;
  plan: string | null;
  solution: string | null;
}): TroubleshootingLog {
  return {
    id: log.id,
    author: log.author,
    status: log.status as TroubleshootingLog["status"],
    timestamp: log.display_timestamp,
    problem: log.problem,
    plan: log.plan ?? undefined,
    solution: log.solution ?? undefined,
  };
}

function createTroubleshootingLogId(teamId: string): string {
  const slug = teamId.replace(/[^a-z0-9]+/gi, "-").slice(0, 24);
  return `ts-${slug}-${Date.now()}`;
}

async function createTroubleshootingLogInDb(
  teamId: string,
  input: CreateTroubleshootingLogInput
): Promise<TroubleshootingLog> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");
  if (currentUser.role === "professor") {
    throw new Error("트러블슈팅 기록은 해당 팀 학생만 작성할 수 있습니다.");
  }

  const { courseId } = await assertStudentOwnTeamWrite(teamId);
  const course = await getCourseByIdFromDb(courseId);
  if (course?.status === "archived") {
    throw new Error("종료된 수업에서는 트러블슈팅을 새로 작성할 수 없습니다.");
  }

  const problem = input.problem.trim();
  if (!problem) throw new Error("문제 내용을 입력해주세요.");

  const existing = await getTeamDetailTroubleshootingLogsFromDb(teamId);
  const sortOrder = existing.length > 0 ? Math.max(...existing.map((_, i) => i + 1)) + 1 : 1;
  const now = new Date();
  const displayTimestamp = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const status = input.status ?? (input.solution?.trim() ? "resolved" : "in-progress");

  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .insert({
      id: createTroubleshootingLogId(teamId),
      team_id: teamId,
      author: currentUser.name,
      status,
      display_timestamp: displayTimestamp,
      problem,
      plan: input.plan?.trim() || null,
      solution: input.solution?.trim() || null,
      sort_order: sortOrder,
    })
    .select("id, author, status, display_timestamp, problem, plan, solution, sort_order, team_id")
    .single();

  if (error) throw error;

  return mapTroubleshootingLogRow(data);
}

async function getTroubleshootingLogById(logId: string) {
  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .select("id, author, status, display_timestamp, problem, plan, solution, team_id")
    .eq("id", logId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("기록을 찾을 수 없습니다.");
  return data;
}

async function assertTroubleshootingLogAuthor(logId: string) {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const existing = await getTroubleshootingLogById(logId);
  if (existing.author !== currentUser.name) {
    throw new Error("본인이 작성한 기록만 수정할 수 있습니다.");
  }
  return { currentUser, existing };
}

async function updateTroubleshootingLogInDb(
  logId: string,
  input: UpdateTroubleshootingLogInput
): Promise<TroubleshootingLog> {
  await assertTroubleshootingLogAuthor(logId);

  const problem = input.problem?.trim();
  if (problem !== undefined && !problem) throw new Error("문제 내용을 입력해주세요.");

  const payload: Record<string, string | null> = {};
  if (problem !== undefined) payload.problem = problem;
  if (input.plan !== undefined) payload.plan = input.plan.trim() || null;
  if (input.solution !== undefined) payload.solution = input.solution.trim() || null;
  if (input.status !== undefined) payload.status = input.status;

  if (Object.keys(payload).length === 0) {
    throw new Error("수정할 내용이 없습니다.");
  }

  if (payload.solution && payload.status === undefined) {
    payload.status = "resolved";
  }

  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .update(payload)
    .eq("id", logId)
    .select("id, author, status, display_timestamp, problem, plan, solution")
    .single();

  if (error) throw error;
  return mapTroubleshootingLogRow(data);
}

async function deleteTroubleshootingLogInDb(logId: string): Promise<void> {
  await assertTroubleshootingLogAuthor(logId);

  const { error } = await supabase.from("ai_team_detail_troubleshooting_logs").delete().eq("id", logId);
  if (error) throw error;
}

async function resolveTroubleshootingLogInDb(logId: string, solution: string): Promise<TroubleshootingLog> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const existing = await getTroubleshootingLogById(logId);
  if (existing.status === "resolved") throw new Error("이미 해결 완료된 기록입니다.");

  const isAuthor = existing.author === currentUser.name;
  const canResolveAsStaff = ["professor", "admin"].includes(currentUser.role);
  if (!isAuthor && !canResolveAsStaff) {
    throw new Error("해결 완료 처리 권한이 없습니다.");
  }

  const trimmed = solution.trim();
  if (!trimmed) throw new Error("해결 방법을 입력해주세요.");

  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .update({ status: "resolved", solution: trimmed })
    .eq("id", logId)
    .select("id, author, status, display_timestamp, problem, plan, solution")
    .single();

  if (error) throw error;
  return mapTroubleshootingLogRow(data);
}

async function getTeamDetailTroubleshootingLogsFromDb(teamId?: string): Promise<TroubleshootingLog[]> {
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .select("id, author, status, display_timestamp, problem, plan, solution, sort_order, team_id")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((log) => mapTroubleshootingLogRow(log));
}

const TEAM_DELIVERABLES_BUCKET = "ai_team_deliverables";
const TEAM_DELIVERABLE_MAX_BYTES = 500 * 1024 * 1024;
const TEAM_DELIVERABLE_ALLOWED_EXT = new Set([
  "pdf",
  "zip",
  "7z",
  "rar",
  "tar",
  "gz",
  "ppt",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "txt",
  "md",
  "json",
  "csv",
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "java",
  "c",
  "cpp",
  "go",
  "rs",
  "sql",
  "yaml",
  "yml",
  "doc",
  "docx",
  "xls",
  "xlsx",
]);

function sanitizeDeliverableFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_").slice(0, 120);
}

function getDeliverableExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

function createDeliverableId(teamId: string): string {
  const slug = teamId.replace(/[^a-z0-9]+/gi, "-").slice(0, 24);
  return `del-${slug}-${Date.now()}`;
}

function normalizeDeliverableUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error("링크를 입력해주세요.");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("http(s) 링크만 등록할 수 있습니다.");
    }
    return parsed.toString();
  } catch {
    throw new Error("올바른 링크 형식이 아닙니다.");
  }
}

function mapDeliverableRow(row: {
  id: string;
  team_id: string;
  course_id: string;
  uploaded_by_user_id: string;
  uploader_name: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  public_url: string;
  storage_path?: string | null;
  created_at: string;
}): TeamDeliverable {
  const isLink = (row.storage_path ?? "").startsWith("link://");
  return {
    id: row.id,
    teamId: row.team_id,
    courseId: row.course_id,
    uploaderId: row.uploaded_by_user_id,
    uploaderName: row.uploader_name,
    fileName: row.file_name,
    fileSize: Number(row.file_size ?? 0),
    mimeType: row.mime_type ?? undefined,
    publicUrl: row.public_url,
    kind: isLink ? "link" : "file",
    createdAt: asDate(row.created_at),
  };
}

async function assertTeamDeliverableAccess(teamId: string): Promise<{ courseId: string }> {
  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀 정보를 찾을 수 없습니다.");

  const accessibleCourseIds = await getAccessibleCourseIds();
  if (!accessibleCourseIds.includes(courseId)) {
    throw new Error("이 수업·팀에 대한 권한이 없습니다.");
  }

  return { courseId };
}

/** 학생이 자신이 속한 팀에서만 쓰기(트러블슈팅·산출물 등) 가능하도록 검증 (vision #49) */
async function assertStudentOwnTeamWrite(teamId: string): Promise<{ courseId: string }> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") {
    return assertTeamDeliverableAccess(teamId);
  }

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀 정보를 찾을 수 없습니다.");

  await assertActiveCourseMembership(courseId);

  const myTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
  if (myTeamId !== teamId) {
    throw new Error("내가 속한 팀에서만 작성할 수 있습니다.");
  }

  return { courseId };
}

async function getTeamDeliverablesFromDb(teamId: string): Promise<TeamDeliverable[]> {
  if (!teamId) return [];
  await assertTeamDeliverableAccess(teamId);

  const { data, error } = await supabase
    .from("ai_team_deliverables")
    .select(
      "id, team_id, course_id, uploaded_by_user_id, uploader_name, file_name, file_size, mime_type, public_url, storage_path, created_at"
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapDeliverableRow(row));
}

async function uploadTeamDeliverableInDb(teamId: string, file: File): Promise<TeamDeliverable> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");

  const { courseId } = await assertStudentOwnTeamWrite(teamId);

  const extension = getDeliverableExtension(file.name);
  if (!extension || !TEAM_DELIVERABLE_ALLOWED_EXT.has(extension)) {
    throw new Error("지원하지 않는 파일 형식입니다. (예: zip, ts, py, pdf, png)");
  }
  if (file.size > TEAM_DELIVERABLE_MAX_BYTES) {
    throw new Error("파일 크기는 500MB 이하여야 합니다.");
  }

  const deliverableId = createDeliverableId(teamId);
  const safeName = sanitizeDeliverableFileName(file.name);
  const storagePath = `${courseId}/${teamId}/${deliverableId}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(TEAM_DELIVERABLES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(TEAM_DELIVERABLES_BUCKET).getPublicUrl(storagePath);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_team_deliverables")
    .insert({
      id: deliverableId,
      team_id: teamId,
      course_id: courseId,
      uploaded_by_user_id: currentUser.id,
      uploader_name: currentUser.name,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type || null,
      public_url: urlData.publicUrl,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id, team_id, course_id, uploaded_by_user_id, uploader_name, file_name, file_size, mime_type, public_url, created_at"
    )
    .single();

  if (error) {
    await supabase.storage.from(TEAM_DELIVERABLES_BUCKET).remove([storagePath]);
    throw error;
  }

  return mapDeliverableRow(data);
}

async function addTeamDeliverableLinkInDb(
  teamId: string,
  input: { url: string; title?: string }
): Promise<TeamDeliverable> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");

  const { courseId } = await assertStudentOwnTeamWrite(teamId);
  const normalizedUrl = normalizeDeliverableUrl(input.url);
  const parsed = new URL(normalizedUrl);
  const fallbackName = `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  const title = input.title?.trim() || fallbackName;
  const now = new Date().toISOString();
  const deliverableId = createDeliverableId(teamId);

  const { data, error } = await supabase
    .from("ai_team_deliverables")
    .insert({
      id: deliverableId,
      team_id: teamId,
      course_id: courseId,
      uploaded_by_user_id: currentUser.id,
      uploader_name: currentUser.name,
      file_name: title,
      storage_path: `link://${deliverableId}`,
      file_size: 0,
      mime_type: "text/url",
      public_url: normalizedUrl,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id, team_id, course_id, uploaded_by_user_id, uploader_name, file_name, file_size, mime_type, public_url, storage_path, created_at"
    )
    .single();

  if (error) throw error;
  return mapDeliverableRow(data);
}

async function deleteTeamDeliverableInDb(deliverableId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: existing, error: fetchError } = await supabase
    .from("ai_team_deliverables")
    .select("id, team_id, uploaded_by_user_id, storage_path")
    .eq("id", deliverableId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("파일을 찾을 수 없습니다.");

  await assertTeamDeliverableAccess(existing.team_id);

  const isOwner = existing.uploaded_by_user_id === currentUser.id;
  const canDeleteAsStaff = ["professor", "admin"].includes(currentUser.role);
  if (!isOwner && !canDeleteAsStaff) {
    throw new Error("본인이 업로드한 파일 또는 교수만 삭제할 수 있습니다.");
  }

  const isLink = existing.storage_path.startsWith("link://");
  if (!isLink) {
    const { error: storageError } = await supabase.storage
      .from(TEAM_DELIVERABLES_BUCKET)
      .remove([existing.storage_path]);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("ai_team_deliverables").delete().eq("id", deliverableId);
  if (error) throw error;
}

type QuestionRow = {
  id: string;
  title: string;
  content: string;
  author_user_id: string;
  author_id: string;
  author_name: string;
  course_id: string;
  tags: unknown;
  answers: unknown;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
};

type AnswerRow = {
  id: string;
  question_id: string;
  content: string;
  author_id: string;
  author_user_id?: string;
  author_name: string;
  is_accepted: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
};

function mapAnswerRow(raw: unknown, questionId: string): Answer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AnswerRow> & Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const content = typeof row.content === "string" ? row.content : "";
  if (!id || !content) return null;

  const authorId =
    typeof row.author_id === "string"
      ? row.author_id
      : typeof row.authorId === "string"
        ? row.authorId
        : "";
  const authorName =
    typeof row.author_name === "string"
      ? row.author_name
      : typeof row.authorName === "string"
        ? row.authorName
        : "";

  return {
    id,
    questionId: typeof row.question_id === "string" ? row.question_id : questionId,
    content,
    authorId,
    authorName,
    isAccepted: Boolean(row.is_accepted ?? row.isAccepted),
    likes: typeof row.likes === "number" ? row.likes : 0,
    createdAt: asDate(
      typeof row.created_at === "string" ? row.created_at : (row.createdAt as string | undefined)
    ),
    updatedAt: asDate(
      typeof row.updated_at === "string" ? row.updated_at : (row.updatedAt as string | undefined)
    ),
  };
}

function mapAnswersFromDb(value: unknown, questionId: string): Answer[] {
  return asArray<unknown>(value)
    .map((item) => mapAnswerRow(item, questionId))
    .filter((answer): answer is Answer => answer !== null);
}

function serializeAnswerForDb(answer: Answer): AnswerRow {
  return {
    id: answer.id,
    question_id: answer.questionId,
    content: answer.content,
    author_id: answer.authorId,
    author_user_id: answer.authorId,
    author_name: answer.authorName,
    is_accepted: answer.isAccepted,
    likes: answer.likes,
    created_at: answer.createdAt.toISOString(),
    updated_at: answer.updatedAt.toISOString(),
  };
}

function mapQuestionRow(row: QuestionRow, author?: AiUser): Question {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    authorId: author?.id ?? row.author_id,
    authorName: author?.name ?? row.author_name,
    courseId: row.course_id,
    tags: asArray<string>(row.tags),
    answers: mapAnswersFromDb(row.answers, row.id),
    views: row.views,
    likes: row.likes,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function createAnswerId(): string {
  return `a-${Date.now()}`;
}

async function assertQuestionCourseAccess(questionId: string): Promise<QuestionRow> {
  const { data, error } = await supabase
    .from("ai_questions")
    .select(
      "id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at"
    )
    .eq("id", questionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("질문을 찾을 수 없습니다.");

  const accessibleCourseIds = await getAccessibleCourseIds();
  if (!accessibleCourseIds.includes(data.course_id)) {
    throw new Error("이 수업에 대한 권한이 없습니다.");
  }

  return data as QuestionRow;
}

export type CreateQuestionInput = {
  title: string;
  content: string;
  courseId?: string;
  tags?: string[];
};

export type CreateAnswerInput = {
  content: string;
};

export type UpdateAnswerInput = {
  content: string;
};

function createQuestionId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `q-${slug || "post"}-${Date.now()}`;
}

export type UpdateQuestionInput = {
  title: string;
  content: string;
  tags?: string[];
};

async function updateQuestionInDb(questionId: string, input: UpdateQuestionInput): Promise<Question> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: existing, error: fetchError } = await supabase
    .from("ai_questions")
    .select("id, author_user_id, course_id")
    .eq("id", questionId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("질문을 찾을 수 없습니다.");
  if (existing.author_user_id !== currentUser.id) {
    throw new Error("본인이 작성한 질문만 수정할 수 있습니다.");
  }

  const accessibleCourseIds = await getAccessibleCourseIds();
  if (!accessibleCourseIds.includes(existing.course_id)) {
    throw new Error("이 수업에 대한 권한이 없습니다.");
  }

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) throw new Error("제목과 내용을 입력해주세요.");

  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_questions")
    .update({
      title,
      content,
      tags,
      updated_at: now,
    })
    .eq("id", questionId)
    .select("id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at")
    .single();

  if (error) throw error;

  return mapQuestionRow(data as QuestionRow);
}

async function getQuestionByIdFromDb(questionId: string): Promise<Question> {
  const row = await assertQuestionCourseAccess(questionId);
  const authors = await getUsersByIds([row.author_user_id].filter(Boolean));
  const author = authors.find((user) => user.id === row.author_user_id);
  return mapQuestionRow(row, author);
}

async function createAnswerInDb(questionId: string, input: CreateAnswerInput): Promise<Question> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const row = await assertQuestionCourseAccess(questionId);
  const content = input.content.trim();
  if (!content) throw new Error("답변 내용을 입력해주세요.");

  const now = new Date().toISOString();
  const answers = mapAnswersFromDb(row.answers, questionId);
  const newAnswer: Answer = {
    id: createAnswerId(),
    questionId,
    content,
    authorId: currentUser.id,
    authorName: currentUser.name,
    isAccepted: false,
    likes: 0,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };

  const { data, error } = await supabase
    .from("ai_questions")
    .update({
      answers: [...answers, newAnswer].map(serializeAnswerForDb),
      updated_at: now,
    })
    .eq("id", questionId)
    .select(
      "id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return mapQuestionRow(data as QuestionRow);
}

async function updateAnswerInDb(
  questionId: string,
  answerId: string,
  input: UpdateAnswerInput
): Promise<Question> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const row = await assertQuestionCourseAccess(questionId);
  const content = input.content.trim();
  if (!content) throw new Error("답변 내용을 입력해주세요.");

  const answers = mapAnswersFromDb(row.answers, questionId);
  const target = answers.find((answer) => answer.id === answerId);
  if (!target) throw new Error("답변을 찾을 수 없습니다.");
  if (target.authorId !== currentUser.id) {
    throw new Error("본인이 작성한 답변만 수정할 수 있습니다.");
  }

  const now = new Date().toISOString();
  const updatedAnswers = answers.map((answer) =>
    answer.id === answerId
      ? { ...answer, content, updatedAt: new Date(now) }
      : answer
  );

  const { data, error } = await supabase
    .from("ai_questions")
    .update({
      answers: updatedAnswers.map(serializeAnswerForDb),
      updated_at: now,
    })
    .eq("id", questionId)
    .select(
      "id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return mapQuestionRow(data as QuestionRow);
}

async function deleteAnswerInDb(questionId: string, answerId: string): Promise<Question> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const row = await assertQuestionCourseAccess(questionId);
  const answers = mapAnswersFromDb(row.answers, questionId);
  const target = answers.find((answer) => answer.id === answerId);
  if (!target) throw new Error("답변을 찾을 수 없습니다.");

  const isQuestionAuthor = row.author_user_id === currentUser.id;
  if (target.authorId !== currentUser.id && !isQuestionAuthor) {
    throw new Error("본인 답변 또는 질문 작성자만 삭제할 수 있습니다.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_questions")
    .update({
      answers: answers.filter((answer) => answer.id !== answerId).map(serializeAnswerForDb),
      updated_at: now,
    })
    .eq("id", questionId)
    .select(
      "id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return mapQuestionRow(data as QuestionRow);
}

async function acceptAnswerInDb(questionId: string, answerId: string): Promise<Question> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const row = await assertQuestionCourseAccess(questionId);
  if (row.author_user_id !== currentUser.id) {
    throw new Error("질문 작성자만 채택할 수 있습니다.");
  }

  const answers = mapAnswersFromDb(row.answers, questionId);
  if (!answers.some((answer) => answer.id === answerId)) {
    throw new Error("답변을 찾을 수 없습니다.");
  }

  const now = new Date().toISOString();
  const updatedAnswers = answers.map((answer) => ({
    ...answer,
    isAccepted: answer.id === answerId,
    updatedAt: answer.id === answerId ? new Date(now) : answer.updatedAt,
  }));

  const { data, error } = await supabase
    .from("ai_questions")
    .update({
      answers: updatedAnswers.map(serializeAnswerForDb),
      updated_at: now,
    })
    .eq("id", questionId)
    .select(
      "id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return mapQuestionRow(data as QuestionRow);
}

async function deleteQuestionInDb(questionId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: existing, error: fetchError } = await supabase
    .from("ai_questions")
    .select("id, author_user_id")
    .eq("id", questionId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("질문을 찾을 수 없습니다.");
  if (existing.author_user_id !== currentUser.id) {
    throw new Error("본인이 작성한 질문만 삭제할 수 있습니다.");
  }

  const { error } = await supabase.from("ai_questions").delete().eq("id", questionId);
  if (error) throw error;
}

async function createQuestionInDb(input: CreateQuestionInput): Promise<Question> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const accessibleCourseIds = await getAccessibleCourseIds();
  const courseId = input.courseId ?? accessibleCourseIds[0] ?? null;
  if (!courseId) {
    throw new Error("질문을 등록할 수업이 없습니다. 수업 등록(멤버십) 후 다시 시도해주세요.");
  }
  if (!accessibleCourseIds.includes(courseId)) {
    throw new Error("선택한 수업에 질문을 등록할 권한이 없습니다.");
  }

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) throw new Error("제목과 내용을 입력해주세요.");

  const now = new Date().toISOString();
  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean);

  const { data, error } = await supabase
    .from("ai_questions")
    .insert({
      id: createQuestionId(title),
      title,
      content,
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_user_id: currentUser.id,
      course_id: courseId,
      tags,
      answers: [],
      views: 0,
      likes: 0,
      created_at: now,
      updated_at: now,
    })
    .select("id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at")
    .single();

  if (error) throw error;

  return mapQuestionRow(data as QuestionRow);
}

async function getQuestionsFromDb(): Promise<Question[]> {
  const accessibleCourseIds = await getAccessibleCourseIds();
  if (accessibleCourseIds.length === 0) return [];

  let query = supabase
    .from("ai_questions")
    .select("id, title, content, author_user_id, author_id, author_name, course_id, tags, answers, views, likes, created_at, updated_at")
    .order("created_at", { ascending: true });

  query = query.in("course_id", accessibleCourseIds);

  const { data, error } = await query;

  if (error) throw error;

  const questions = data ?? [];
  const authors = await getUsersByIds(
    Array.from(new Set(questions.map((question) => question.author_user_id).filter(Boolean)))
  );

  return questions.map((question) => {
    const author = authors.find((user) => user.id === question.author_user_id);
    return mapQuestionRow(question as QuestionRow, author);
  });
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

async function getTeamCourseIdFromDb(teamId: string): Promise<string | null> {
  const { data, error } = await supabase.from("ai_teams").select("course_id").eq("id", teamId).maybeSingle();
  if (error) throw error;
  return data?.course_id ?? null;
}

const AUTO_TEAM_BADGE = "자동배정";
const TEAM_MEMBER_COLORS = [
  "bg-blue-100",
  "bg-purple-100",
  "bg-green-100",
  "bg-amber-100",
  "bg-pink-100",
  "bg-cyan-100",
];

async function assertProfessorCanManageCourse(courseId: string) {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  if (currentUser.role === "admin") return currentUser;

  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");
  if (course.status !== "active") throw new Error("진행 중인 수업에서만 팀을 배정할 수 있습니다.");
  if (currentUser.role !== "professor" || course.professorId !== currentUser.id) {
    throw new Error("교수만 팀을 배정할 수 있습니다.");
  }

  return currentUser;
}

async function assertActiveCourseMembership(courseId: string) {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");
  if (course.status !== "active") throw new Error("종료된 수업에서는 팀을 변경할 수 없습니다.");

  if (currentUser.role === "admin") return { currentUser, course };

  const accessible = await getAccessibleCourseIds();
  if (!accessible.includes(courseId)) {
    throw new Error("이 수업에 접근할 수 없습니다.");
  }

  return { currentUser, course };
}

async function getAssignedStudentIdsInCourseFromDb(courseId: string): Promise<string[]> {
  const { data: teams, error: teamsError } = await supabase
    .from("ai_teams")
    .select("id")
    .eq("course_id", courseId);

  if (teamsError) throw teamsError;

  const teamIds = (teams ?? []).map((team) => team.id);
  if (teamIds.length === 0) return [];

  const { data: members, error: membersError } = await supabase
    .from("ai_team_members")
    .select("user_id")
    .in("team_id", teamIds);

  if (membersError) throw membersError;

  return Array.from(new Set((members ?? []).map((member) => member.user_id).filter(Boolean)));
}

async function getMyTeamIdInCourseFromDb(courseId: string, userId: string): Promise<string | null> {
  const { data: teams, error: teamsError } = await supabase
    .from("ai_teams")
    .select("id")
    .eq("course_id", courseId);

  if (teamsError) throw teamsError;

  const teamIds = (teams ?? []).map((team) => team.id);
  if (teamIds.length === 0) return null;

  const { data: member, error: memberError } = await supabase
    .from("ai_team_members")
    .select("team_id")
    .eq("user_id", userId)
    .in("team_id", teamIds)
    .maybeSingle();

  if (memberError) throw memberError;
  return member?.team_id ?? null;
}

async function createTeamInDb(
  courseId: string,
  input: { name: string; projectTitle?: string }
): Promise<{ teamId: string }> {
  const { currentUser } = await assertActiveCourseMembership(courseId);

  const name = input.name.trim();
  if (!name) throw new Error("팀 이름을 입력해주세요.");

  const now = new Date().toISOString();
  const teamId = `team-${courseId}-manual-${Date.now()}`;
  const projectTitle = (input.projectTitle?.trim() || "팀 프로젝트").slice(0, 200);

  const { data: orderRows, error: orderError } = await supabase
    .from("ai_teams")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (orderError) throw orderError;
  const sortOrder = (orderRows?.[0]?.sort_order ?? 0) + 1;

  const { error: teamError } = await supabase.from("ai_teams").insert({
    id: teamId,
    name,
    course_id: courseId,
    badge: "",
    project_title: projectTitle,
    progress: 0,
    completed_stages: 0,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  });

  if (teamError) throw teamError;

  if (currentUser.role === "student") {
    const existingTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
    if (existingTeamId) {
      throw new Error("이미 다른 팀에 속해 있습니다. 탈퇴 후 새 팀을 만들 수 있습니다.");
    }

    const { error: memberError } = await supabase.from("ai_team_members").insert({
      id: `tm-${teamId}-1`,
      team_id: teamId,
      user_id: currentUser.id,
      initial: currentUser.name?.slice(0, 1) ?? "?",
      color: TEAM_MEMBER_COLORS[0],
      role: "leader",
      sort_order: 1,
      created_at: now,
    });

    if (memberError) throw memberError;
  }

  return { teamId };
}

async function joinTeamInDb(teamId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") {
    throw new Error("학생만 팀에 참여할 수 있습니다.");
  }

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀을 찾을 수 없습니다.");

  await assertActiveCourseMembership(courseId);

  const existingTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
  if (existingTeamId) {
    if (existingTeamId === teamId) throw new Error("이미 이 팀에 참여 중입니다.");
    throw new Error("다른 팀에 속해 있습니다. 먼저 탈퇴한 뒤 참여해주세요.");
  }

  const { data: members, error: membersError } = await supabase
    .from("ai_team_members")
    .select("sort_order")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (membersError) throw membersError;

  const nextOrder = (members?.[0]?.sort_order ?? 0) + 1;
  const now = new Date().toISOString();

  const { error } = await supabase.from("ai_team_members").insert({
    id: `tm-${teamId}-${nextOrder}`,
    team_id: teamId,
    user_id: currentUser.id,
    initial: currentUser.name?.slice(0, 1) ?? "?",
    color: TEAM_MEMBER_COLORS[nextOrder % TEAM_MEMBER_COLORS.length],
    role: "member",
    sort_order: nextOrder,
    created_at: now,
  });

  if (error) throw error;
}

async function leaveTeamInDb(teamId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") {
    throw new Error("학생만 팀에서 탈퇴할 수 있습니다.");
  }

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀을 찾을 수 없습니다.");

  await assertActiveCourseMembership(courseId);

  const { error } = await supabase
    .from("ai_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", currentUser.id);

  if (error) throw error;
}

async function saveRandomTeamsInDb(
  courseId: string,
  groups: string[][]
): Promise<{ teamCount: number; memberCount: number }> {
  await assertProfessorCanManageCourse(courseId);

  const nonEmptyGroups = groups.filter((group) => group.length > 0);
  if (nonEmptyGroups.length === 0) throw new Error("배정할 팀이 없습니다.");

  const flatIds = nonEmptyGroups.flat();
  const courseStudents = await getCourseUsers(courseId, "student");
  const allowedIds = new Set(courseStudents.map((user) => user.id));

  const { data: manualTeams, error: manualTeamsError } = await supabase
    .from("ai_teams")
    .select("id")
    .eq("course_id", courseId)
    .neq("badge", AUTO_TEAM_BADGE);

  if (manualTeamsError) throw manualTeamsError;

  const manualTeamIds = (manualTeams ?? []).map((team) => team.id);
  let lockedStudentIds = new Set<string>();

  if (manualTeamIds.length > 0) {
    const { data: lockedMembers, error: lockedError } = await supabase
      .from("ai_team_members")
      .select("user_id")
      .in("team_id", manualTeamIds);

    if (lockedError) throw lockedError;
    lockedStudentIds = new Set(
      (lockedMembers ?? []).map((member) => member.user_id).filter(Boolean)
    );
  }

  for (const studentId of flatIds) {
    if (!allowedIds.has(studentId)) {
      throw new Error("수업에 등록되지 않은 학생이 포함되어 있습니다.");
    }
    if (lockedStudentIds.has(studentId)) {
      throw new Error("이미 다른 팀에 속한 학생은 랜덤 배정에서 제외해야 합니다.");
    }
  }

  if (new Set(flatIds).size !== flatIds.length) {
    throw new Error("한 학생은 하나의 팀에만 배정할 수 있습니다.");
  }

  const { error: deleteError } = await supabase
    .from("ai_teams")
    .delete()
    .eq("course_id", courseId)
    .eq("badge", AUTO_TEAM_BADGE);

  if (deleteError) throw deleteError;

  const now = new Date().toISOString();
  const batchId = Date.now();
  let memberCount = 0;

  for (let i = 0; i < nonEmptyGroups.length; i++) {
    const studentIds = nonEmptyGroups[i];
    const teamId = `team-${courseId}-auto-${batchId}-${i + 1}`;
    const { error: teamError } = await supabase.from("ai_teams").insert({
      id: teamId,
      name: `${i + 1}조`,
      course_id: courseId,
      badge: AUTO_TEAM_BADGE,
      project_title: "팀 프로젝트",
      progress: 0,
      completed_stages: 0,
      sort_order: 1000 + i,
      created_at: now,
      updated_at: now,
    });

    if (teamError) throw teamError;

    const users = await getUsersByIds(studentIds);
    const memberRows = studentIds.map((userId, index) => {
      const user = users.find((item) => item.id === userId);
      return {
        id: `tm-${teamId}-${index + 1}`,
        team_id: teamId,
        user_id: userId,
        initial: user?.name?.slice(0, 1) ?? "?",
        color: TEAM_MEMBER_COLORS[index % TEAM_MEMBER_COLORS.length],
        role: index === 0 ? "leader" : "member",
        sort_order: index + 1,
        created_at: now,
      };
    });

    const { error: membersError } = await supabase.from("ai_team_members").insert(memberRows);
    if (membersError) throw membersError;
    memberCount += memberRows.length;
  }

  return { teamCount: nonEmptyGroups.length, memberCount };
}

// 화면에서 사용하는 API 모음입니다.
// 각 함수는 Supabase의 ai_* 테이블을 읽고, 화면이 기대하는 camelCase 타입으로 변환합니다.
export const api = {
  navigation: {
    getPrimaryCourseId,
    getTeamCourseId: getTeamCourseIdFromDb,
  },
  auth: {
    getPageSummary: getAuthPageSummaryFromDb,
  },
  courses: {
    getAll: getCoursesFromDb,
    getById: getCourseByIdFromDb,
    create: createCourseInDb,
    archive: archiveCourseInDb,
    delete: deleteCourseInDb,
  },
  memberships: {
    joinByCode: joinCourseByCodeInDb,
  },
  students: {
    getAll: getStudentsFromDb,
    getById: getStudentByIdFromDb,
  },
  professors: {
    getById: getProfessorByIdFromDb,
    saveProfile: saveProfessorProfileInDb,
  },
  teamCards: {
    getAll: getTeamCardsFromDb,
  },
  teams: {
    getAssignedStudentIds: getAssignedStudentIdsInCourseFromDb,
    getMyTeamIdInCourse: getMyTeamIdInCourseFromDb,
    create: createTeamInDb,
    join: joinTeamInDb,
    leave: leaveTeamInDb,
    updateCompletedStages: updateTeamCompletedStagesInDb,
    saveRandomAssignment: saveRandomTeamsInDb,
  },
  teamStages: {
    getAll: getTeamStagesFromDb,
    getByCourse: getCourseStagesFromDb,
  },
  announcements: {
    getAll: getAnnouncementsFromDb,
    create: createAnnouncementInDb,
  },
  studentNetwork: {
    getStudents: getNetworkStudentsFromDb,
    getExtras: getStudentExtrasFromDb,
    getTeamKeywords: getTeamKeywordsFromDb,
    getEditForm: getStudentNetworkEditFormFromDb,
    saveProfile: saveStudentNetworkProfileInDb,
  },
  myPage: {
    getProjects: getMyPageProjectsFromDb,
    getProjectsForUser: getMyPageProjectsForUserFromDb,
    getProfile: getMyPageProfileFromDb,
    getArchivedCourses: getMyPageArchivedCoursesFromDb,
    updateAvatar: updateMyPageAvatarFromDb,
    saveStudentProfile: saveMyPageStudentProfileFromDb,
    getSideNavItems: getMyPageSideNavItemsFromDb,
    getReportStats: getMyPageReportStatsFromDb,
    getReportHeader: getMyPageReportHeaderFromDb,
  },
  coursePeerReviews: {
    getOverview: getCoursePeerReviewsOverviewFromDb,
  },
  courseEvals: {
    getSchemaStatus: getEvalSchemaStatusFromDb,
    getMyPeerReviewsGiven: getMyPeerReviewsGivenInCourseFromDb,
    getMyProfessorEvals: getMyProfessorEvalsInCourseFromDb,
  },
  teamDetail: {
    getFeedbackOptions: getTeamDetailFeedbackOptionsFromDb,
    getMyFeedback: getMyTeamFeedbackFromDb,
    submitFeedback: submitTeamFeedbackInDb,
    getRetrospectiveDraft: getTeamRetrospectiveDraftFromDb,
    submitRetrospective: submitTeamRetrospectiveInDb,
    getProfessorStudentEvals: getProfessorStudentEvalsFromDb,
    saveProfessorStudentEval: saveProfessorStudentEvalInDb,
    getProfessorProjectEval: getProfessorProjectEvalFromDb,
    saveProfessorProjectEval: saveProfessorProjectEvalInDb,
    getTeamSubmissionFeedbacks: getTeamSubmissionFeedbacksFromDb,
    getTeamSubmissionRetrospectives: getTeamSubmissionRetrospectivesFromDb,
    getTeamSubmissionPeerReviews: getTeamSubmissionPeerReviewsFromDb,
    getChatMessages: getTeamDetailChatMessagesFromDb,
    sendChatMessage: sendTeamDetailChatMessageInDb,
    getPeerReviewStudents: getTeamDetailPeerReviewStudentsFromDb,
    getMyPeerReviews: getMyPeerReviewsFromDb,
    submitPeerReview: submitPeerReviewInDb,
    getReviewKeywords: getTeamDetailReviewKeywordsFromDb,
    getTeammates: getTeamDetailTeammatesFromDb,
    getFeedbackCounts: getTeamFeedbackCountsFromDb,
    getTroubleshootingLogs: getTeamDetailTroubleshootingLogsFromDb,
    createTroubleshootingLog: createTroubleshootingLogInDb,
    updateTroubleshootingLog: updateTroubleshootingLogInDb,
    deleteTroubleshootingLog: deleteTroubleshootingLogInDb,
    resolveTroubleshootingLog: resolveTroubleshootingLogInDb,
    getDeliverables: getTeamDeliverablesFromDb,
    uploadDeliverable: uploadTeamDeliverableInDb,
    addDeliverableLink: addTeamDeliverableLinkInDb,
    deleteDeliverable: deleteTeamDeliverableInDb,
  },
  projects: {
    getAll: getProjectsFromDb,
  },
  questions: {
    getAll: getQuestionsFromDb,
    getById: getQuestionByIdFromDb,
    create: createQuestionInDb,
    update: updateQuestionInDb,
    delete: deleteQuestionInDb,
    createAnswer: createAnswerInDb,
    updateAnswer: updateAnswerInDb,
    deleteAnswer: deleteAnswerInDb,
    acceptAnswer: acceptAnswerInDb,
  },
  aiReport: {
    gatherContext: gatherAiReportContext,
    buildDraftFromContext: buildDraftReportFromContext,
    buildActivityBullets: buildMyPageActivityBullets,
    buildCompetencyItems: buildMyPageCompetencyItems,
    buildSummaryParagraph: buildMyPageSummaryParagraph,
    buildSummaryCards: buildMyPageSummaryCards,
    buildPage3Intro: buildMyPagePage3Intro,
    buildTechnologies: buildTechnologiesDraft,
    formatActivitySummary: formatReportActivitySummary,
    mapToMyPageProjects: mapReportContextToMyPageProjects,
    generateReport: generateAiReportFromEdge,
  },
};
