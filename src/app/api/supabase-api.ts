import type {
  Course,
  CourseStage,
  CourseStatus,
  CreateCourseInput,
  StudentProfile,
  ProfessorProfile,
  TeamCard,
  Activity,
  Announcement,
  NetworkStudent,
  StudentExtra,
  PeerEvaluationSummary,
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
  TeamManagementInfo,
  TroubleshootingLog,
  TeamDeliverable,
  TeamDeliverableSubmitMeta,
  CourseMaterial,
  CourseSyllabus,
  CourseCatalogEntry,
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
  buildMyPageReportView,
  buildTechnologiesDraft,
  formatReportActivitySummary,
  gatherAiReportContext,
  generateAiReport as generateAiReportFromEdge,
  mapReportContextToMyPageProjects,
} from "./ai-report";
import { recommendTroubleshootingFromEdge } from "./ai-troubleshooting";
import { DEFAULT_PEER_REVIEW_GOOD_KEYWORDS } from "../constants/peerReview";
import {
  briefDeliverableDescriptionSummary,
  deliverableHasDeployLink,
  extractDeployLinkFromDescription,
  deliverableProgressLabel,
  isDeliverableArchiveFile,
  resolveDeliverableDeployUrl,
} from "../utils/deliverableLinks";
import {
  formatDeliverableStorageError,
  TEAM_DELIVERABLE_MAX_BYTES,
} from "../utils/deliverableUploadLimits";
import { uploadFileToStorage } from "../utils/storageResumableUpload";
import { defaultNewCourseDates } from "../utils/courseDates";
import { buildPeerEvaluationSummary } from "../utils/peerEvaluationSummary";

export { extractDeployLinkFromDescription };
import {
  getCachedAccessibleCourseIds,
  getCachedCourseStatus,
  getCachedCourseDmPeerIds,
  getCachedTeamCourseId,
  invalidateApiSessionCache as clearApiSessionCache,
  isDirectChatWarm,
  isTeamChatWarm,
  markDirectChatWarm,
  markTeamChatWarm,
  setCachedAccessibleCourseIds,
  setCachedCourseStatus,
  setCachedCourseDmPeerIds,
  setCachedTeamCourseId,
} from "./api-session-cache";

export function invalidateApiSessionCache(): void {
  clearApiSessionCache();
  cachedCurrentAiUser = null;
}

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
  school?: string | null;
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
  teaching_style?: string | null;
};

type CourseQueryOptions = {
  status?: CourseStatus | "all";
};

function resolveUserImageUrl(user: Pick<AiUser, "image" | "avatar">): string | undefined {
  const url = user.image?.trim() || user.avatar?.trim();
  return url || undefined;
}

function toStudentProfile(user: AiUser): StudentProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "student",
    studentId: user.student_number ?? "",
    school: user.school?.trim() || "숭실대학교",
    major: user.major ?? "",
    skills: asArray<string>(user.skills),
    bio: user.bio ?? undefined,
    imageUrl: resolveUserImageUrl(user),
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
    bio: user.bio ?? undefined,
    imageUrl: resolveUserImageUrl(user),
    teachingStyle: user.teaching_style ?? undefined,
  };
}

let cachedCurrentAiUser: { firebaseUid: string; user: AiUser } | null = null;

async function getCurrentAiUser(): Promise<AiUser | null> {
  const firebaseUid = auth.currentUser?.uid;
  if (!firebaseUid) {
    cachedCurrentAiUser = null;
    return null;
  }

  if (cachedCurrentAiUser?.firebaseUid === firebaseUid) {
    return cachedCurrentAiUser.user;
  }

  const { data, error } = await supabase
    .from("ai_users")
    .select("*")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (error) throw error;
  const user = (data as AiUser | null) ?? null;
  cachedCurrentAiUser = user ? { firebaseUid, user } : null;
  return user;
}

async function getCourseStatusFromDb(courseId: string): Promise<CourseStatus | null> {
  const cached = getCachedCourseStatus(courseId);
  if (cached) return cached as CourseStatus;

  const { data, error } = await supabase
    .from("ai_courses")
    .select("status")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw error;
  const status = (data?.status as CourseStatus | undefined) ?? null;
  if (status) setCachedCourseStatus(courseId, status);
  return status;
}

/** 1:1 DM 허용 peer: 수업 멤버십(전 역할) + 담당 교수 */
async function getCourseDirectMessagePeerIdsFromDb(courseId: string): Promise<Set<string>> {
  const cached = getCachedCourseDmPeerIds(courseId);
  if (cached) return cached;

  const [membershipResult, courseResult] = await Promise.all([
    supabase.from("ai_course_memberships").select("user_id").eq("course_id", courseId),
    supabase.from("ai_courses").select("instructor_user_id").eq("id", courseId).maybeSingle(),
  ]);

  if (membershipResult.error) throw membershipResult.error;
  if (courseResult.error) throw courseResult.error;

  const ids = new Set((membershipResult.data ?? []).map((row) => row.user_id as string));
  const instructorId = courseResult.data?.instructor_user_id as string | undefined;
  if (instructorId) ids.add(instructorId);

  setCachedCourseDmPeerIds(courseId, ids);
  return ids;
}

async function getAccessibleCourseIds(): Promise<string[]> {
  const firebaseUid = auth.currentUser?.uid;
  if (!firebaseUid) return [];

  const cachedIds = getCachedAccessibleCourseIds(firebaseUid);
  if (cachedIds) return cachedIds;

  const currentUser = await getCurrentAiUser();
  if (!currentUser) return [];

  let result: string[];

  if (currentUser.role === "admin") {
    const { data, error } = await supabase.from("ai_courses").select("id");
    if (error) throw error;
    result = (data ?? []).map((course) => course.id);
  } else if (currentUser.role === "professor") {
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

    result = Array.from(
      new Set([
        ...(teachingResult.data ?? []).map((course) => course.id),
        ...(membershipResult.data ?? []).map((membership) => membership.course_id),
      ])
    );
  } else {
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

    result = Array.from(
      new Set([
        ...(teachingResult.data ?? []).map((course) => course.id),
        ...(membershipResult.data ?? []).map((membership) => membership.course_id),
      ])
    );
  }

  setCachedAccessibleCourseIds(firebaseUid, result);
  return result;
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
  invalidateApiSessionCache();

  return { courseId: course.id, courseName: course.name };
}

const DEFAULT_CATALOG_STAGE_NAMES = [
  "아이디어 기획",
  "서비스 디자인",
  "프론트 개발",
  "백엔드 개발",
  "발표 및 배포",
];

type CatalogRow = {
  id: string;
  course_name: string;
  course_code: string;
  department: string | null;
  semester: string;
  professor: string | null;
  schedule: string | null;
  room: string | null;
  grade: string | null;
  credit: string | null;
  description: string | null;
  sort_order: number;
};

function catalogLiveCourseId(courseCode: string, semester: string): string {
  const slugCode = courseCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slugSemester = semester
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `course-${slugCode || "unknown"}-${slugSemester || "unknown"}`;
}

async function resolveInstructorUserIdForCatalog(professorName?: string | null): Promise<string> {
  const trimmedName = professorName?.trim();
  if (trimmedName) {
    const { data: professorRow, error: professorError } = await supabase
      .from("ai_users")
      .select("id")
      .eq("role", "professor")
      .eq("name", trimmedName)
      .maybeSingle();

    if (professorError) throw professorError;
    if (professorRow?.id) return professorRow.id as string;
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("ai_users")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (adminError) throw adminError;
  if (adminRow?.id) return adminRow.id as string;

  const { data: fallbackProfessor, error: fallbackError } = await supabase
    .from("ai_users")
    .select("id")
    .eq("role", "professor")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  if (fallbackProfessor?.id) return fallbackProfessor.id as string;

  throw new Error("강의 담당 교수 계정을 찾지 못했습니다.");
}

async function resolveFallbackInstructorUserId(excludeUserId: string): Promise<string> {
  const { data: adminRows, error: adminError } = await supabase
    .from("ai_users")
    .select("id")
    .eq("role", "admin")
    .neq("id", excludeUserId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (adminError) throw adminError;
  if (adminRows?.[0]?.id) return adminRows[0].id as string;

  const { data: professorRows, error: professorError } = await supabase
    .from("ai_users")
    .select("id")
    .eq("role", "professor")
    .neq("id", excludeUserId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (professorError) throw professorError;
  if (professorRows?.[0]?.id) return professorRows[0].id as string;

  throw new Error("담당 교수를 넘길 다른 계정을 찾지 못했습니다.");
}

async function ensureCourseMembershipInDb(
  courseId: string,
  courseName: string
): Promise<{ courseId: string; courseName: string }> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: existing, error: existingError } = await supabase
    .from("ai_course_memberships")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return { courseId, courseName };

  const membershipRole = currentUser.role === "professor" ? "assistant" : "student";
  const { error: insertError } = await supabase.from("ai_course_memberships").insert({
    course_id: courseId,
    user_id: currentUser.id,
    role: membershipRole,
    created_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;
  invalidateApiSessionCache();

  return { courseId, courseName };
}

async function ensureLiveCourseFromCatalog(catalogRow: CatalogRow): Promise<string> {
  const { data: byCatalogId, error: byCatalogError } = await supabase
    .from("ai_courses")
    .select("id")
    .eq("catalog_id", catalogRow.id)
    .maybeSingle();

  if (byCatalogError) throw byCatalogError;
  if (byCatalogId?.id) return byCatalogId.id as string;

  const { data: byCodeSemester, error: byCodeError } = await supabase
    .from("ai_courses")
    .select("id, catalog_id")
    .eq("code", catalogRow.course_code)
    .eq("semester", catalogRow.semester)
    .maybeSingle();

  if (byCodeError) throw byCodeError;
  if (byCodeSemester?.id) {
    if (!byCodeSemester.catalog_id) {
      await supabase
        .from("ai_courses")
        .update({ catalog_id: catalogRow.id })
        .eq("id", byCodeSemester.id);
    }
    return byCodeSemester.id as string;
  }

  const courseId = catalogLiveCourseId(catalogRow.course_code, catalogRow.semester);
  const instructorUserId = await resolveInstructorUserIdForCatalog(catalogRow.professor);
  const { startDate, endDate } = defaultNewCourseDates();

  const { error: courseError } = await supabase.from("ai_courses").insert({
    id: courseId,
    name: catalogRow.course_name.trim(),
    code: catalogRow.course_code.trim(),
    instructor_user_id: instructorUserId,
    schedule: catalogRow.schedule?.trim() || "미정",
    start_date: startDate,
    end_date: endDate,
    room: catalogRow.room?.trim() || null,
    students_count: 0,
    max_students: null,
    semester: catalogRow.semester.trim(),
    description: catalogRow.description?.trim() || null,
    status: "active",
    catalog_id: catalogRow.id,
  });

  if (courseError) throw courseError;

  const { error: stageError } = await supabase.from("ai_course_stages").insert(
    DEFAULT_CATALOG_STAGE_NAMES.map((stage, index) => ({
      course_id: courseId,
      name: stage,
      position: index + 1,
      is_required: true,
    }))
  );

  if (stageError) {
    await supabase.from("ai_courses").delete().eq("id", courseId);
    throw stageError;
  }

  invalidateApiSessionCache();
  return courseId;
}

async function listCatalogFromDb(params?: {
  search?: string;
  semester?: string;
}): Promise<CourseCatalogEntry[]> {
  let query = supabase
    .from("ai_course_catalog")
    .select(
      "id, course_name, course_code, department, semester, professor, schedule, room, grade, credit, description, sort_order"
    )
    .order("sort_order", { ascending: true });

  if (params?.semester?.trim()) {
    query = query.eq("semester", params.semester.trim());
  }
  if (params?.search?.trim()) {
    query = query.ilike("course_name", `%${params.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const currentUser = await getCurrentAiUser();
  const joinedByCatalogId = new Map<string, string>();
  const joinedCodeSemesterKeys = new Set<string>();

  if (currentUser) {
    const { data: memberships, error: membershipError } = await supabase
      .from("ai_course_memberships")
      .select("course_id")
      .eq("user_id", currentUser.id);

    if (membershipError) throw membershipError;

    const courseIds = (memberships ?? []).map((row) => row.course_id as string);
    if (courseIds.length > 0) {
      const { data: linkedCourses, error: linkedError } = await supabase
        .from("ai_courses")
        .select("id, catalog_id, code, semester")
        .in("id", courseIds);

      if (linkedError) throw linkedError;

      for (const course of linkedCourses ?? []) {
        const catalogId = course.catalog_id as string | null;
        const courseId = course.id as string;
        if (catalogId) joinedByCatalogId.set(catalogId, courseId);

        const code = (course.code as string | null)?.trim();
        const semester = (course.semester as string | null)?.trim();
        if (code && semester) {
          joinedCodeSemesterKeys.add(`${code}::${semester}`);
        }
      }
    }
  }

  return (data ?? [])
    .map((row) => {
      const catalogId = row.id as string;
      const courseCode = row.course_code as string;
      const semester = row.semester as string;
      const codeSemesterKey = `${courseCode.trim()}::${semester.trim()}`;
      const liveCourseId = joinedByCatalogId.get(catalogId);
      const isJoined = Boolean(liveCourseId) || joinedCodeSemesterKeys.has(codeSemesterKey);

      return {
        id: catalogId,
        courseName: row.course_name as string,
        courseCode,
        department: (row.department as string | null) ?? undefined,
        semester,
        professor: (row.professor as string | null) ?? undefined,
        schedule: (row.schedule as string | null) ?? undefined,
        room: (row.room as string | null) ?? undefined,
        grade: (row.grade as string | null) ?? undefined,
        credit: (row.credit as string | null) ?? undefined,
        description: (row.description as string | null) ?? undefined,
        isJoined,
        liveCourseId,
      };
    })
    .filter((entry) => !entry.isJoined);
}

async function leaveCourseMembershipInDb(courseId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student" && currentUser.role !== "professor") {
    throw new Error("학생 또는 교수만 수업에서 나갈 수 있습니다.");
  }

  const { data: courseRow, error: courseError } = await supabase
    .from("ai_courses")
    .select("id, name, status, instructor_user_id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) throw courseError;
  if (!courseRow) throw new Error("수업을 찾을 수 없습니다.");
  if (courseRow.status !== "active") {
    throw new Error("진행 중인 수업에서만 나갈 수 있습니다.");
  }

  const isInstructor = courseRow.instructor_user_id === currentUser.id;

  if (currentUser.role === "student") {
    if (isInstructor) {
      throw new Error("담당 교수는 수업에서 나갈 수 없습니다.");
    }

    const { data: membership, error: membershipLookupError } = await supabase
      .from("ai_course_memberships")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (membershipLookupError) throw membershipLookupError;
    if (!membership) throw new Error("이 수업에 등록되어 있지 않습니다.");

    const myTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
    if (myTeamId) {
      await leaveTeamInDb(myTeamId);
    }
  } else if (isInstructor) {
    const fallbackInstructorId = await resolveFallbackInstructorUserId(currentUser.id);
    const { error: instructorUpdateError } = await supabase
      .from("ai_courses")
      .update({ instructor_user_id: fallbackInstructorId })
      .eq("id", courseId);

    if (instructorUpdateError) throw instructorUpdateError;
  } else {
    const { data: membership, error: membershipLookupError } = await supabase
      .from("ai_course_memberships")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (membershipLookupError) throw membershipLookupError;
    if (!membership) throw new Error("이 수업에 등록되어 있지 않습니다.");
  }

  const { error: deleteError } = await supabase
    .from("ai_course_memberships")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", currentUser.id);

  if (deleteError) throw deleteError;
  invalidateApiSessionCache();
}

async function joinFromCatalogInDb(catalogId: string): Promise<{ courseId: string; courseName: string }> {
  const trimmedId = catalogId.trim();
  if (!trimmedId) throw new Error("강의를 선택해주세요.");

  const { data: catalogRow, error: catalogError } = await supabase
    .from("ai_course_catalog")
    .select(
      "id, course_name, course_code, department, semester, professor, schedule, room, grade, credit, description, sort_order"
    )
    .eq("id", trimmedId)
    .maybeSingle();

  if (catalogError) {
    if (isMissingRelationError(catalogError)) {
      throw new Error("강의 카탈로그가 준비되지 않았습니다.");
    }
    throw catalogError;
  }
  if (!catalogRow) throw new Error("강의를 찾을 수 없습니다.");

  const courseId = await ensureLiveCourseFromCatalog(catalogRow as CatalogRow);
  return ensureCourseMembershipInDb(courseId, catalogRow.course_name as string);
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

  // 수업이 지정된 경우 글로벌 ai_team_stages 로 대체하지 않음 (vision #162)
  if (courseId) return [];

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
    .select("id, name, code, instructor_user_id, schedule, start_date, end_date, room, students_count, max_students, semester, description, status, archived_at, archived_by")
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
      startDate: course.start_date ?? undefined,
      endDate: course.end_date ?? undefined,
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
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();
  if (!startDate || !endDate) {
    throw new Error("시작일과 종료일을 입력해주세요.");
  }
  if (endDate < startDate) {
    throw new Error("종료일은 시작일 이후여야 합니다.");
  }

  const { error: courseError } = await supabase.from("ai_courses").insert({
    id: courseId,
    name: input.name.trim(),
    code: input.code.trim(),
    instructor_user_id: currentUser.id,
    schedule: input.schedule.trim() || "미정",
    start_date: startDate,
    end_date: endDate,
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
        is_required: true,
      }))
    );

    if (stageError) {
      await supabase.from("ai_courses").delete().eq("id", courseId);
      invalidateApiSessionCache();
      throw stageError;
    }
  }

  invalidateApiSessionCache();

  const createdCourse = await getCourseByIdFromDb(courseId);
  if (!createdCourse) throw new Error("생성된 수업을 다시 불러오지 못했습니다.");
  return createdCourse;
}

async function replaceCourseStagesInDb(courseId: string, stageNames: string[]): Promise<CourseStage[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");
  if (course.status !== "active") {
    throw new Error("진행 중인 수업에서만 스테이지를 수정할 수 있습니다.");
  }
  if (currentUser.role !== "admin" && (currentUser.role !== "professor" || course.professorId !== currentUser.id)) {
    throw new Error("담당 교수만 스테이지를 수정할 수 있습니다.");
  }

  const names = stageNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) throw new Error("스테이지를 1개 이상 입력해 주세요.");

  const { error: deleteError } = await supabase
    .from("ai_course_stages")
    .delete()
    .eq("course_id", courseId);
  if (deleteError) throw deleteError;

  const { count: remainingCount, error: countError } = await supabase
    .from("ai_course_stages")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  if (countError) throw countError;
  if ((remainingCount ?? 0) > 0) {
    throw new Error(
      "기존 스테이지를 삭제하지 못했습니다. 데이터베이스 DELETE 권한(RLS)을 확인해 주세요."
    );
  }

  const { error: insertError } = await supabase.from("ai_course_stages").insert(
    names.map((name, index) => ({
      course_id: courseId,
      name,
      position: index + 1,
      is_required: true,
    }))
  );
  if (insertError) throw insertError;

  return getCourseStagesFromDb(courseId);
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

async function deleteStorageObjectsBestEffort(bucket: string, paths: string[]): Promise<void> {
  const objectPaths = paths.filter((path) => path && !path.startsWith("link://"));
  for (let index = 0; index < objectPaths.length; index += 100) {
    const chunk = objectPaths.slice(index, index + 100);
    if (chunk.length === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) {
      console.warn(`[deleteCourse] storage remove failed (${bucket}):`, error.message);
    }
  }
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

  const [teamsResult, materialsResult] = await Promise.all([
    supabase.from("ai_teams").select("id").eq("course_id", courseId),
    supabase.from("ai_course_materials").select("storage_path").eq("course_id", courseId),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (materialsResult.error && !isMissingRelationError(materialsResult.error)) {
    throw materialsResult.error;
  }

  const teamIds = (teamsResult.data ?? []).map((team) => team.id);
  const materialStoragePaths = (materialsResult.data ?? [])
    .map((row) => row.storage_path as string | null)
    .filter((path): path is string => Boolean(path));

  let deliverableStoragePaths: string[] = [];
  if (teamIds.length > 0) {
    const { data: deliverables, error: deliverablesError } = await supabase
      .from("ai_team_deliverables")
      .select("storage_path")
      .in("team_id", teamIds);

    if (deliverablesError && !isMissingRelationError(deliverablesError)) throw deliverablesError;
    deliverableStoragePaths = (deliverables ?? [])
      .map((row) => row.storage_path as string | null)
      .filter((path): path is string => Boolean(path));
  }

  // ai_projects.team_id → ai_teams (no CASCADE): 팀 삭제 전에 반드시 제거
  const { error: projectsError } = await supabase.from("ai_projects").delete().eq("course_id", courseId);
  if (projectsError) throw projectsError;

  const { error: questionsError } = await supabase.from("ai_questions").delete().eq("course_id", courseId);
  if (questionsError && !isMissingRelationError(questionsError)) throw questionsError;

  if (teamIds.length > 0) {
    const detailTables = [
      "ai_team_detail_chat_messages",
      "ai_team_detail_feedbacks",
      "ai_team_detail_peer_reviews",
      "ai_team_detail_retrospectives",
      "ai_team_detail_professor_student_evals",
      "ai_team_detail_professor_project_evals",
      "ai_team_detail_troubleshooting_logs",
      "ai_team_detail_config",
      "ai_team_detail_peer_review_students",
      "ai_team_detail_teammates",
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
    supabase.from("ai_direct_messages").delete().eq("course_id", courseId),
    supabase.from("ai_announcements").delete().eq("course_id", courseId),
    supabase.from("ai_course_stages").delete().eq("course_id", courseId),
    supabase.from("ai_course_materials").delete().eq("course_id", courseId),
    supabase.from("ai_course_memberships").delete().eq("course_id", courseId),
  ];

  for (const op of courseScopedDeletes) {
    const { error } = await op;
    if (error && !isMissingRelationError(error)) throw error;
  }

  await deleteStorageObjectsBestEffort("ai_course_materials", materialStoragePaths);
  await deleteStorageObjectsBestEffort("ai_team_deliverables", deliverableStoragePaths);

  const { data: deletedCourses, error: courseDeleteError } = await supabase
    .from("ai_courses")
    .delete()
    .eq("id", courseId)
    .select("id");
  if (courseDeleteError) throw courseDeleteError;
  if (!deletedCourses?.length) {
    throw new Error("수업 삭제가 완료되지 않았습니다. DB 권한 또는 외래키 제약을 확인해 주세요.");
  }

  invalidateApiSessionCache();
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
  const teamIds = teams.map((team) => team.id);

  let deliverableRows: {
    team_id: string;
    file_name: string;
    storage_path: string | null;
    mime_type: string | null;
    created_at: string;
  }[] = [];
  let troubleshootingRows: {
    team_id: string;
    problem: string;
    display_timestamp: string;
    sort_order: number;
  }[] = [];

  if (teamIds.length > 0) {
    const [deliverablesResult, troubleshootingResult] = await Promise.all([
      supabase
        .from("ai_team_deliverables")
        .select("team_id, file_name, storage_path, mime_type, created_at")
        .in("team_id", teamIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_team_detail_troubleshooting_logs")
        .select("team_id, problem, display_timestamp, sort_order")
        .in("team_id", teamIds)
        .order("sort_order", { ascending: false }),
    ]);

    if (!deliverablesResult.error) deliverableRows = deliverablesResult.data ?? [];
    if (!troubleshootingResult.error) troubleshootingRows = troubleshootingResult.data ?? [];
  }

  const memberUsers = await getUsersByIds(
    Array.from(new Set(members.map((member) => member.user_id).filter(Boolean)))
  );

  const formatActivityTime = (iso?: string) => {
    if (!iso) return "";
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return iso;
    return parsed.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildComputedActivities = (teamId: string): Activity[] => {
    const computed: Activity[] = [];
    for (const row of deliverableRows.filter((item) => item.team_id === teamId).slice(0, 4)) {
      const isLink =
        (row.storage_path ?? "").startsWith("link://") || row.mime_type === "text/url";
      computed.push({
        tag: isLink ? "링크" : "산출물",
        title: isLink ? "새 링크 등록!" : "새 소스 업로드!",
        description: row.file_name,
        time: formatActivityTime(row.created_at),
      });
    }
    for (const row of troubleshootingRows.filter((item) => item.team_id === teamId).slice(0, 4)) {
      const problem = (row.problem ?? "").trim();
      computed.push({
        tag: "트러블슈팅",
        title: "트러블슈팅 등록",
        description: problem.length > 80 ? `${problem.slice(0, 80)}…` : problem,
        time: row.display_timestamp,
      });
    }
    return computed;
  };

  const mergeTeamActivities = (teamId: string): Activity[] => {
    const fromDb = activities
      .filter((activity) => activity.team_id === teamId)
      .map((activity) => ({
        tag: activity.tag,
        title: activity.title,
        description: activity.description,
        time: activity.display_time,
      }));
    if (fromDb.length >= 2) return fromDb.slice(0, 2);

    const merged = [...fromDb];
    for (const item of buildComputedActivities(teamId)) {
      if (merged.length >= 2) break;
      if (!merged.some((existing) => existing.title === item.title && existing.time === item.time)) {
        merged.push(item);
      }
    }
    return merged.slice(0, 2);
  };

  const stageNames = await getCourseStageNamesFromDb(selectedCourseId);
  const stageCount = stageNames.length;

  return teams.map((team) => {
    const completedRaw = Number(team.completed_stages ?? 0);
    const completedStages = Math.max(0, Math.min(completedRaw, stageCount || completedRaw));
    const progressFromStages =
      stageCount > 0 ? Math.round((completedStages / stageCount) * 100) : team.progress;

    return {
    id: team.id,
    name: team.name,
    badge: team.badge ?? "",
    projectTitle: team.project_title ?? "",
    progress: progressFromStages,
    completedStages,
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
          imageUrl: user ? resolveUserImageUrl(user) : undefined,
        };
      }),
    activities: mergeTeamActivities(team.id),
  };
  });
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
    .select("id, title, description, d_day, sort_order, course_id, author_user_id")
    .eq("course_id", selectedCourseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const mapped = (data ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    dDay: announcement.d_day,
    sortOrder: announcement.sort_order as number,
    courseId: announcement.course_id as string,
    authorUserId: (announcement.author_user_id as string | null) ?? undefined,
  }));

  return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
}

async function createAnnouncementInDb(
  courseId: string,
  input: { title: string; description: string; dDay: number }
): Promise<Announcement> {
  await assertProfessorCanManageAnnouncements(courseId);

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new Error("공지 제목을 입력해주세요.");

  const { data: existing, error: countError } = await supabase
    .from("ai_announcements")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (countError) throw formatAnnouncementDbError(countError);

  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  const id = `ann-${courseId}-${Date.now()}`;
  const { error } = await supabase.from("ai_announcements").insert({
    id,
    course_id: courseId,
    title,
    description,
    d_day: Math.max(0, input.dDay),
    sort_order: nextOrder,
    author_user_id: currentUser.id,
  });

  if (error) throw formatAnnouncementDbError(error);

  return {
    id,
    title,
    description,
    dDay: Math.max(0, input.dDay),
    sortOrder: nextOrder,
    courseId,
    authorUserId: currentUser.id,
  };
}

async function deleteAnnouncementInDb(courseId: string, announcementId: string): Promise<void> {
  await assertProfessorCanManageAnnouncements(courseId);
  const targetId = announcementId.trim();
  if (!targetId) throw new Error("삭제할 공지를 찾을 수 없습니다.");

  const { error } = await supabase
    .from("ai_announcements")
    .delete()
    .eq("course_id", courseId)
    .eq("id", targetId);

  if (error) throw formatAnnouncementDbError(error);
}

function mapAiUserToNetworkStudent(student: AiUser, isSelf: boolean): NetworkStudent {
  const tags = asArray<string>(student.tags);
  const skills = asArray<string>(student.skills);
  const mergedTags = tags.length > 0 ? tags : skills.map((skill) => (skill.startsWith("#") ? skill : `#${skill}`));
  const name = student.name?.trim() || "학생";

  return {
    id: student.id,
    name,
    isSelf,
    year: student.year ?? undefined,
    major: student.major?.trim() ?? "",
    bio: student.bio?.trim() ?? "",
    tags: mergedTags,
    avatar: student.avatar?.trim() || name.slice(0, 1),
    image: resolveUserImageUrl(student),
  };
}

async function getNetworkStudentsFromDb(courseId?: string): Promise<NetworkStudent[]> {
  const [currentUser, selectedCourseId] = await Promise.all([getCurrentAiUser(), getSelectedCourseId(courseId)]);
  if (!selectedCourseId) return [];

  const students = await getCourseUsers(selectedCourseId, "student");

  const result = students.map((student) =>
    mapAiUserToNetworkStudent(student, currentUser ? student.id === currentUser.id : false)
  );

  if (currentUser?.role === "student" && !result.some((student) => student.id === currentUser.id)) {
    return [mapAiUserToNetworkStudent(currentUser, true), ...result];
  }

  return result;
}

function mapLearningProfileToStudentExtra(
  row: {
    user_id: string;
    temperature: number | null;
    team_project_count: number | null;
    portfolio_file: string | null;
    detailed_bio: string | null;
    keywords: unknown;
  },
  userBio?: string | null,
): StudentExtra {
  const meta = parseNetworkProfileMeta(row.detailed_bio);
  const detailedRaw = row.detailed_bio?.trim() ?? "";
  const isMetaJson = detailedRaw.startsWith("{") && Boolean(meta.mbti || meta.careerInterest || meta.hobbies);
  const metaPreview = [meta.mbti, meta.careerInterest, meta.hobbies]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  const detailedBio = isMetaJson
    ? userBio?.trim() || metaPreview
    : detailedRaw || userBio?.trim() || "";

  return {
    temperature: Number(row.temperature) || 37,
    teamProjectCount: row.team_project_count ?? 0,
    portfolioFile: row.portfolio_file?.trim() ?? "",
    detailedBio,
    keywords: asArray<{ text: string; count: number }>(row.keywords),
  };
}

async function getStudentExtrasFromDb(): Promise<Record<string, StudentExtra>> {
  const { data, error } = await supabase
    .from("ai_user_learning_profiles")
    .select("user_id, temperature, team_project_count, portfolio_file, detailed_bio, keywords");

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return {};

  const users = await getUsersByIds(rows.map((row) => row.user_id));
  const bioByUserId = new Map(users.map((user) => [user.id, user.bio]));

  return rows.reduce<Record<string, StudentExtra>>((result, extra) => {
    result[extra.user_id] = mapLearningProfileToStudentExtra(extra, bioByUserId.get(extra.user_id));
    return result;
  }, {});
}

async function getCourseStudentPeerEvaluationsFromDb(
  _courseId?: string
): Promise<Record<string, PeerEvaluationSummary>> {
  const { data: reviews, error: reviewError } = await supabase
    .from("ai_team_detail_peer_reviews")
    .select("teammate_id, good_keywords, comment")
    .order("created_at", { ascending: false });

  if (reviewError) {
    if (isMissingRelationError(reviewError)) return {};
    throw reviewError;
  }

  const rowsByUser = new Map<string, Array<{ good_keywords?: unknown; comment?: string | null }>>();
  for (const row of reviews ?? []) {
    const teammateId = (row.teammate_id as string | null)?.trim();
    if (!teammateId) continue;
    const currentRows = rowsByUser.get(teammateId) ?? [];
    currentRows.push({
      good_keywords: row.good_keywords,
      comment: (row.comment as string | null) ?? null,
    });
    rowsByUser.set(teammateId, currentRows);
  }

  const result: Record<string, PeerEvaluationSummary> = {};
  for (const [userId, userRows] of rowsByUser.entries()) {
    const summary = buildPeerEvaluationSummary(userRows, userId);
    if (summary.tier !== "none") result[userId] = summary;
  }
  return result;
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

const EMPTY_STUDENT_NETWORK_EDIT_FORM: StudentNetworkEditForm = {
  major: "",
  mbti: "",
  careerInterest: "",
  hobbies: "",
  bio: "",
  portfolioFileName: "",
};

function buildStudentNetworkEditFormFromUser(
  user: AiUser,
  profile?: { portfolio_file?: string | null; detailed_bio?: string | null } | null
): StudentNetworkEditForm {
  const meta = parseNetworkProfileMeta(profile?.detailed_bio);

  return {
    major: user.major?.trim() ?? "",
    mbti: meta.mbti?.trim() ?? "",
    careerInterest: meta.careerInterest?.trim() ?? "",
    hobbies: meta.hobbies?.trim() ?? "",
    bio: user.bio?.trim() ?? "",
    portfolioFileName: profile?.portfolio_file?.trim() ?? "",
  };
}

async function getStudentNetworkEditFormFromDb(): Promise<StudentNetworkEditForm> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || currentUser.role !== "student") {
    return { ...EMPTY_STUDENT_NETWORK_EDIT_FORM };
  }

  const { data: profile, error } = await supabase
    .from("ai_user_learning_profiles")
    .select("portfolio_file, detailed_bio")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) throw error;

  return buildStudentNetworkEditFormFromUser(currentUser, profile);
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

async function searchSyllabiFromDb(params: {
  courseName?: string;
  department?: string;
  semester?: string;
}): Promise<CourseSyllabus[]> {
  let query = supabase
    .from("ai_course_syllabi")
    .select("id, course_name, course_code, department, semester, grade, professor, file_name, file_size, mime_type, public_url, ai_status, created_at")
    .order("created_at", { ascending: false });

  if (params.courseName?.trim()) {
    query = query.ilike("course_name", `%${params.courseName.trim()}%`);
  }
  if (params.department?.trim()) {
    query = query.ilike("department", `%${params.department.trim()}%`);
  }
  if (params.semester?.trim()) {
    query = query.eq("semester", params.semester.trim());
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    courseName: row.course_name,
    courseCode: row.course_code ?? undefined,
    department: row.department ?? undefined,
    semester: row.semester ?? undefined,
    grade: row.grade ?? undefined,
    professor: row.professor ?? undefined,
    fileName: row.file_name,
    fileSize: Number(row.file_size ?? 0),
    mimeType: row.mime_type ?? undefined,
    publicUrl: row.public_url,
    aiStatus: row.ai_status ?? "pending",
    createdAt: asDate(row.created_at),
  }));
}

async function getSyllabusByIdFromDb(id: string): Promise<CourseSyllabus | null> {
  const { data, error } = await supabase
    .from("ai_course_syllabi")
    .select("id, course_name, course_code, department, semester, grade, professor, file_name, file_size, mime_type, public_url, ai_status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    courseName: data.course_name,
    courseCode: data.course_code ?? undefined,
    department: data.department ?? undefined,
    semester: data.semester ?? undefined,
    grade: data.grade ?? undefined,
    professor: data.professor ?? undefined,
    fileName: data.file_name,
    fileSize: Number(data.file_size ?? 0),
    mimeType: data.mime_type ?? undefined,
    publicUrl: data.public_url,
    aiStatus: data.ai_status ?? "pending",
    createdAt: asDate(data.created_at),
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
  contributionRating?: number | null;
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
    .select(
      "team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment, contribution_rating"
    )
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
    contributionRating:
      row.contribution_rating != null ? Number(row.contribution_rating) : null,
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
  studentId: string;
  school: string;
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
  const studentId = input.studentId.trim();
  const school = input.school.trim();
  const major = input.major.trim();
  const bio = input.bio.trim();
  const skills = input.skills.map((s) => s.trim()).filter(Boolean).slice(0, 12);

  if (!name) throw new Error("이름을 입력해주세요.");
  if (!studentId) throw new Error("학번을 입력해주세요.");
  if (!school) throw new Error("학교를 입력해주세요.");
  if (!major) throw new Error("전공을 입력해주세요.");

  const { error } = await supabase
    .from("ai_users")
    .update({
      name,
      student_number: studentId,
      school,
      major,
      bio: bio || null,
      skills,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentUser.id);

  if (error) throw error;
  return { name, studentId, school, major, bio, skills };
}

async function getMyPageProfileFromDb(): Promise<MyPageProfile> {
  const currentUser = await getCurrentAiUser();

  if (currentUser) {
    return {
      initial: currentUser.name.slice(0, 1),
      name: currentUser.name,
      email: currentUser.email,
      schoolAndMajor: currentUser.role === "professor" ? "컴퓨터공학부 교수" : "컴퓨터공학과 학생",
      imageUrl: resolveUserImageUrl(currentUser),
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

const DEFAULT_TEAM_FEEDBACK_OPTIONS = [
  "실용적이에요",
  "신선해요",
  "아이디어가 좋아요",
  "UI/UX가 좋아요",
] as const;

const NEGATIVE_TEAM_FEEDBACK_OPTION = "개선이 필요해요";

const POSITIVE_PEER_REVIEW_DELTA = 1;
const NEGATIVE_PEER_REVIEW_DELTA = 1;
const DEFAULT_MANNER_TEMPERATURE = 37;

async function getTeamDetailConfigFromDb(teamId?: string) {
  if (!teamId) throw new Error("Team id is required for team detail config.");

  const { data, error } = await supabase
    .from("ai_team_detail_config")
    .select("feedback_options, good_keywords, bad_keywords")
    .eq("team_id", teamId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return {
        feedback_options: [...DEFAULT_TEAM_FEEDBACK_OPTIONS],
        good_keywords: [],
        bad_keywords: [],
      };
    }
    throw error;
  }
  if (!data) {
    return {
      feedback_options: [...DEFAULT_TEAM_FEEDBACK_OPTIONS],
      good_keywords: [],
      bad_keywords: [],
    };
  }

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

async function warmTeamChatSendContextInDb(teamId: string): Promise<void> {
  if (!teamId) throw new Error("팀 정보가 없습니다.");
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { courseId } = await assertTeamDeliverableAccess(teamId);
  const status = await getCourseStatusFromDb(courseId);
  if (status === "archived") {
    throw new Error("종료된 수업에서는 채팅을 새로 작성할 수 없습니다.");
  }

  markTeamChatWarm(teamId);
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

  if (!isTeamChatWarm(teamId)) {
    const { courseId } = await assertTeamDeliverableAccess(teamId);
    const status = await getCourseStatusFromDb(courseId);
    if (status === "archived") {
      throw new Error("종료된 수업에서는 채팅을 새로 작성할 수 없습니다.");
    }
  }

  const now = new Date();
  const displayTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  // sort_order 컬럼은 bigint — 밀리초 타임스탬프로 메시지 순서 보장
  const sortOrder = now.getTime();

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
      sort_order: sortOrder,
    })
    .select("id, sender, text, display_time, is_mine, is_anon")
    .single();

  if (error) throw error;

  return mapTeamDetailChatMessageRow(data as TeamDetailChatMessageRow, currentUser.name);
}

function createDirectMessageId(courseId: string): string {
  const slug = courseId.replace(/[^a-z0-9]+/gi, "-").slice(0, 12);
  return `dm-${slug}-${Date.now()}`;
}

export type DirectMessageThread = {
  peerUserId: string;
  peerName: string;
  lastMessage: string;
  lastTime: string;
  lastAt: string;
  lastSenderUserId: string;
};

async function listDirectMessageThreadsFromDb(courseId: string): Promise<DirectMessageThread[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!courseId) throw new Error("수업 정보가 없습니다.");

  await assertActiveCourseMembership(courseId);

  const { data, error } = await supabase
    .from("ai_direct_messages")
    .select("sender_user_id, recipient_user_id, text, created_at")
    .eq("course_id", courseId)
    .or(
      `sender_user_id.eq.${currentUser.id},recipient_user_id.eq.${currentUser.id}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const latestByPeer = new Map<
    string,
    { text: string; created_at: string; sender_user_id: string }
  >();
  for (const row of data ?? []) {
    const senderId = row.sender_user_id as string;
    const recipientId = row.recipient_user_id as string;
    const peerId = senderId === currentUser.id ? recipientId : senderId;
    if (!peerId || peerId === currentUser.id) continue;
    if (!latestByPeer.has(peerId)) {
      latestByPeer.set(peerId, {
        text: row.text as string,
        created_at: row.created_at as string,
        sender_user_id: senderId,
      });
    }
  }

  if (latestByPeer.size === 0) return [];

  const peerIds = [...latestByPeer.keys()];
  const { data: users, error: usersError } = await supabase
    .from("ai_users")
    .select("id, name")
    .in("id", peerIds);

  if (usersError) throw usersError;

  const nameById = new Map((users ?? []).map((u) => [u.id as string, u.name as string]));

  return peerIds
    .map((peerUserId) => {
      const latest = latestByPeer.get(peerUserId)!;
      const created = new Date(latest.created_at);
      const lastTime = `${created.getMonth() + 1}/${created.getDate()} ${created
        .getHours()
        .toString()
        .padStart(2, "0")}:${created.getMinutes().toString().padStart(2, "0")}`;
      return {
        peerUserId,
        peerName: nameById.get(peerUserId) ?? "수강생",
        lastMessage: latest.text,
        lastTime,
        lastAt: latest.created_at,
        lastSenderUserId: latest.sender_user_id,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

/** 상단 마이페이지 인박스 — 수업 N회 반복 조회 없이 일괄 스냅샷 */
export type NavInboxSnapshot = {
  announcements: Array<{
    courseId: string;
    courseName: string;
    id: string;
    title: string;
    sortOrder: number;
    authorUserId?: string;
  }>;
  directMessages: Array<{
    courseId: string;
    courseName: string;
    peerUserId: string;
    peerName: string;
    preview: string;
    lastAt: string;
    lastSenderUserId: string;
  }>;
};

async function getNavInboxSnapshotFromDb(): Promise<NavInboxSnapshot> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) return { announcements: [], directMessages: [] };

  const accessibleCourseIds = await getAccessibleCourseIds();
  if (accessibleCourseIds.length === 0) return { announcements: [], directMessages: [] };

  const [coursesResult, announcementsResult, messagesResult] = await Promise.all([
    supabase
      .from("ai_courses")
      .select("id, name")
      .in("id", accessibleCourseIds)
      .eq("status", "active"),
    supabase
      .from("ai_announcements")
      .select("id, title, sort_order, course_id, author_user_id")
      .in("course_id", accessibleCourseIds),
    supabase
      .from("ai_direct_messages")
      .select("course_id, sender_user_id, recipient_user_id, text, created_at")
      .in("course_id", accessibleCourseIds)
      .or(
        `sender_user_id.eq.${currentUser.id},recipient_user_id.eq.${currentUser.id}`
      )
      .order("created_at", { ascending: false }),
  ]);

  if (coursesResult.error) throw coursesResult.error;
  if (announcementsResult.error && !isMissingRelationError(announcementsResult.error)) {
    throw announcementsResult.error;
  }
  if (messagesResult.error && !isMissingRelationError(messagesResult.error)) {
    throw messagesResult.error;
  }

  const courseNameById = new Map(
    (coursesResult.data ?? []).map((row) => [row.id as string, row.name as string])
  );
  const activeCourseIds = new Set(courseNameById.keys());

  const announcements = (announcementsResult.data ?? [])
    .filter((row) => activeCourseIds.has(row.course_id as string))
    .map((row) => ({
      courseId: row.course_id as string,
      courseName: courseNameById.get(row.course_id as string) ?? "수업",
      id: row.id as string,
      title: row.title as string,
      sortOrder: row.sort_order as number,
      authorUserId: (row.author_user_id as string | null) ?? undefined,
    }));

  const latestByPeer = new Map<
    string,
    {
      courseId: string;
      peerUserId: string;
      preview: string;
      lastAt: string;
      lastSenderUserId: string;
    }
  >();

  for (const row of messagesResult.data ?? []) {
    const courseId = row.course_id as string;
    if (!activeCourseIds.has(courseId)) continue;
    const senderId = row.sender_user_id as string;
    const recipientId = row.recipient_user_id as string;
    const peerId = senderId === currentUser.id ? recipientId : senderId;
    if (!peerId || peerId === currentUser.id) continue;
    const dedupeKey = `${courseId}:${peerId}`;
    if (!latestByPeer.has(dedupeKey)) {
      latestByPeer.set(dedupeKey, {
        courseId,
        peerUserId: peerId,
        preview: row.text as string,
        lastAt: row.created_at as string,
        lastSenderUserId: senderId,
      });
    }
  }

  let directMessages: NavInboxSnapshot["directMessages"] = [];
  if (latestByPeer.size > 0) {
    const peerIds = [...new Set([...latestByPeer.values()].map((t) => t.peerUserId))];
    const { data: users, error: usersError } = await supabase
      .from("ai_users")
      .select("id, name")
      .in("id", peerIds);
    if (usersError) throw usersError;

    const nameById = new Map((users ?? []).map((u) => [u.id as string, u.name as string]));
    directMessages = [...latestByPeer.values()].map((thread) => ({
      courseId: thread.courseId,
      courseName: courseNameById.get(thread.courseId) ?? "수업",
      peerUserId: thread.peerUserId,
      peerName: nameById.get(thread.peerUserId) ?? "수강생",
      preview: thread.preview,
      lastAt: thread.lastAt,
      lastSenderUserId: thread.lastSenderUserId,
    }));
  }

  return { announcements, directMessages };
}

async function getDirectMessagesFromDb(
  courseId: string,
  peerUserId: string
): Promise<ChatMessage[]> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!courseId || !peerUserId) throw new Error("대화 상대 정보가 없습니다.");

  await assertActiveCourseMembership(courseId);

  const { data, error } = await supabase
    .from("ai_direct_messages")
    .select("id, sender_user_id, text, created_at")
    .eq("course_id", courseId)
    .or(
      `and(sender_user_id.eq.${currentUser.id},recipient_user_id.eq.${peerUserId}),and(sender_user_id.eq.${peerUserId},recipient_user_id.eq.${currentUser.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "1:1 채팅(ai_direct_messages) 테이블이 없습니다. Supabase에 마이그레이션을 적용해 주세요."
      );
    }
    throw error;
  }

  return (data ?? []).map((row) => {
    const created = new Date(row.created_at as string);
    const displayTime = `${created.getHours().toString().padStart(2, "0")}:${created
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const isMine = row.sender_user_id === currentUser.id;
    return {
      id: row.id as string,
      sender: isMine ? currentUser.name : "상대",
      text: row.text as string,
      time: displayTime,
      isMine,
      isAnon: false,
    };
  });
}

async function warmDirectChatSendContextInDb(courseId: string, peerUserId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!courseId || !peerUserId) throw new Error("대화 상대 정보가 없습니다.");
  if (peerUserId === currentUser.id) throw new Error("본인과는 채팅할 수 없습니다.");

  await assertActiveCourseMembership(courseId);
  const allowedIds = await getCourseDirectMessagePeerIdsFromDb(courseId);
  if (!allowedIds.has(peerUserId)) {
    throw new Error("같은 수업 구성원과만 1:1 채팅할 수 있습니다.");
  }

  markDirectChatWarm(courseId, peerUserId);
}

async function sendDirectMessageInDb(
  courseId: string,
  peerUserId: string,
  textInput: string
): Promise<ChatMessage> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!courseId || !peerUserId) throw new Error("대화 상대 정보가 없습니다.");
  if (peerUserId === currentUser.id) throw new Error("본인과는 채팅할 수 없습니다.");

  const text = textInput.trim();
  if (!text) throw new Error("메시지를 입력해주세요.");

  if (!isDirectChatWarm(courseId, peerUserId)) {
    await assertActiveCourseMembership(courseId);
    const allowedIds = await getCourseDirectMessagePeerIdsFromDb(courseId);
    if (!allowedIds.has(peerUserId)) {
      throw new Error("같은 수업 구성원과만 1:1 채팅할 수 있습니다.");
    }
  }

  const now = new Date();
  const displayTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("ai_direct_messages")
    .insert({
      id: createDirectMessageId(courseId),
      course_id: courseId,
      sender_user_id: currentUser.id,
      recipient_user_id: peerUserId,
      text,
      created_at: now.toISOString(),
    })
    .select("id, sender_user_id, text, created_at")
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "1:1 채팅(ai_direct_messages) 테이블이 없습니다. Supabase에 마이그레이션을 적용해 주세요."
      );
    }
    throw error;
  }

  return {
    id: data.id as string,
    sender: currentUser.name,
    text: data.text as string,
    time: displayTime,
    isMine: true,
    isAnon: false,
  };
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
  return buildTeamProgressInsight(deliverables, logs).summary;
}

const CODE_EXT = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "java",
  "go",
  "rs",
  "c",
  "cpp",
  "sql",
]);

/** vision #125 — 산출물·트러블슈팅 기반 인사이트 (Edge 미연결 시 폴백) */
export function buildTeamProgressInsight(
  deliverables: TeamDeliverable[],
  logs: TroubleshootingLog[]
): {
  summary: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  architecture_risks: string[];
  improvements: string[];
  model: string;
} {
  const resolved = logs.filter((log) => log.status === "resolved");
  const inProgress = logs.filter((log) => log.status !== "resolved");
  const fileItems = deliverables.filter((d) => d.kind !== "link");
  const linkOnlyItems = deliverables.filter((d) => d.kind === "link");
  const withDeployLink = deliverables.filter((d) => deliverableHasDeployLink(d));
  const codeFiles = fileItems.filter((d) => CODE_EXT.has(getDeliverableExtension(d.fileName)));
  const archives = fileItems.filter((d) => isDeliverableArchiveFile(d.fileName, d.mimeType));

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (deliverables.length === 0) {
    gaps.push("산출물이 없습니다. 중간 발표 자료·소스 ZIP·데모 링크를 먼저 공유하세요.");
  } else if (archives.length > 0) {
    const latest = deliverables[0];
    const latestLabel = latest
      ? deliverableProgressLabel({
          fileName: latest.fileName,
          mimeType: latest.mimeType,
          subtitle: latest.subtitle,
          description: latest.description,
          kind: latest.kind,
          publicUrl: latest.publicUrl,
        })
      : "프로젝트 ZIP";
    strengths.push(
      `프로젝트 압축본「${latestLabel}」이 등록되어 있습니다. ZIP 내부는 Edge AI가 README·소스를 읽어 요약합니다.`
    );
  } else if (codeFiles.length > 0) {
    strengths.push(
      `핵심 소스 파일(${codeFiles
        .slice(0, 2)
        .map((d) => d.fileName)
        .join(", ")}${codeFiles.length > 2 ? " …" : ""})이 올라와 코드 리뷰가 가능합니다.`
    );
  } else if (fileItems.length > 0) {
    gaps.push(
      "업로드 파일명만으로는 소스 형식을 확인하기 어렵습니다. .ts·.tsx·.py 또는 프로젝트 ZIP을 올려 주세요."
    );
  }

  if (withDeployLink.length > 0) {
    const latestDeploy = [...withDeployLink].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const deployUrl = latestDeploy ? resolveDeliverableDeployUrl(latestDeploy) : null;
    let host = "데모";
    if (deployUrl) {
      try {
        host = new URL(deployUrl).hostname.replace(/^www\./, "");
      } catch {
        host = "데모";
      }
    }
    strengths.push(
      `배포·데모 URL이 등록되어 있습니다${linkOnlyItems.length > 0 ? ` (링크 산출물 ${linkOnlyItems.length}건)` : ""} — 최신: ${host}.`
    );
  }

  if (resolved.length > 0) {
    strengths.push(
      `트러블슈팅 ${resolved.length}건이 해결 완료로 기록되었습니다${
        resolved[0]?.problem ? ` (예: ${resolved[0].problem.slice(0, 40)})` : ""
      }.`
    );
  }

  if (inProgress.length > 0) {
    gaps.push(
      `진행 중 이슈 ${inProgress.length}건 — ${inProgress
        .slice(0, 2)
        .map((l) => l.problem.slice(0, 30))
        .join(" / ")}`
    );
  } else if (logs.length === 0) {
    gaps.push("트러블슈팅 로그가 없어 문제 해결 과정이 드러나지 않습니다.");
  }

  const withSubtitle = deliverables.filter((d) => d.subtitle?.trim()).length;
  if (withSubtitle < deliverables.length && deliverables.length > 0) {
    gaps.push("일부 산출물에 부제목·설명이 비어 있어 팀원이 맥락을 파악하기 어렵습니다.");
  }

  const latest = deliverables[0];
  const latestBriefDesc = briefDeliverableDescriptionSummary(latest?.description, 48);
  const latestLabel = latest
    ? deliverableProgressLabel({
        fileName: latest.fileName,
        mimeType: latest.mimeType,
        subtitle: latest.subtitle,
        description: latest.description,
        kind: latest.kind,
        publicUrl: latest.publicUrl,
      })
    : "";

  const next_steps: string[] = [];
  const architecture_risks: string[] = [];
  const improvements: string[] = [];

  if (logs.length === 0) {
    next_steps.push("트러블슈팅 로그를 남기며 막힌 지점·해결 과정을 기록하세요.");
  }
  if (codeFiles.length === 0 && fileItems.length > 0 && archives.length === 0) {
    next_steps.push("핵심 소스(.ts·.tsx·.py) 또는 README를 산출물 ZIP에 포함해 업로드하세요.");
    architecture_risks.push("실행 가능한 소스가 드러나지 않아 아키텍처·품질 검토가 어렵습니다.");
  }
  if (archives.length > 0 && codeFiles.length === 0) {
    next_steps.push(
      "팀 상세의 AI 통합 진행상황이 로딩될 때까지 기다리거나, ZIP이 손상되지 않았는지 확인하세요. (파일명이 「.」만 보이면 업로드 시 .zip 확장자를 유지하세요.)"
    );
  }
  if (withDeployLink.length === 0 && deliverables.length > 0) {
    next_steps.push("배포·데모 URL을 링크 산출물 또는 설명란 배포 링크로 등록하세요.");
  }
  if (inProgress.length > 0) {
    next_steps.push(`진행 중 이슈 ${inProgress.length}건을 해결·회고까지 마무리하세요.`);
  }
  if (resolved.length > 0 && deliverables.length >= 2) {
    improvements.push("해결한 이슈를 README·발표 자료에 연결해 학습 기록을 남기세요.");
  }

  const summaryParts: string[] = [];
  if (latest) {
    const kind =
      archives.length > 0
        ? "프로젝트 압축본"
        : codeFiles.length > 0
          ? "소스 파일"
          : withDeployLink.some((d) => d.id === latest.id)
            ? "배포 산출물"
            : "산출물";
    const titlePart = latestLabel ? `「${latestLabel}」` : "산출물";
    summaryParts.push(
      `최근 ${kind} ${titlePart}이 등록되었습니다${latestBriefDesc ? ` — ${latestBriefDesc}` : ""}.`
    );
  } else {
    summaryParts.push("아직 산출물이 없어 프로젝트 구현 상태를 확인하기 어렵습니다.");
  }
  if (inProgress.length > 0) {
    summaryParts.push(`진행 중 이슈가 ${inProgress.length}건 남아 있습니다.`);
  } else if (logs.length === 0) {
    summaryParts.push("트러블슈팅 기록이 없어 협업·디버깅 과정이 보이지 않습니다.");
  }
  if (next_steps[0]) summaryParts.push(`우선 ${next_steps[0]}`);

  return {
    summary: summaryParts.join(" "),
    strengths,
    gaps,
    next_steps: next_steps.slice(0, 4),
    architecture_risks: architecture_risks.slice(0, 4),
    improvements: improvements.slice(0, 4),
    model: "draft-db-insight",
  };
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

  const [evalResult, roster] = await Promise.all([
    supabase
      .from("ai_team_detail_professor_student_evals")
      .select("student_row_id, comment")
      .eq("team_id", teamId)
      .eq("professor_user_id", currentUser.id),
    getTeamMembersWithNamesFromDb(teamId),
  ]);

  if (evalResult.error) {
    if (isMissingRelationError(evalResult.error)) return {};
    throw evalResult.error;
  }

  const userIdByMemberId = new Map(roster.map((m) => [m.userId, m.userId]));
  const nameToUserId = new Map(roster.map((m) => [m.name.trim(), m.userId]));

  const merged: Record<string, string> = {};
  for (const row of evalResult.data ?? []) {
    const rawId = String(row.student_row_id ?? "");
    const comment = (row.comment as string) ?? "";
    const userId =
      userIdByMemberId.get(rawId) ??
      nameToUserId.get(rawId) ??
      roster.find((m) => m.userId === rawId)?.userId ??
      rawId;
    if (userId) merged[userId] = comment;
  }
  return merged;
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

  const roster = await getTeamMembersWithNamesFromDb(teamId);
  const member = roster.find((m) => m.userId === studentRowId);
  if (!member) {
    throw new Error("이 팀에 속한 학생만 평가할 수 있습니다.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("ai_team_detail_professor_student_evals").upsert(
    {
      id: createProfessorStudentEvalId(teamId, currentUser.id, member.userId),
      team_id: teamId,
      student_row_id: member.userId,
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
  contributionRating: number | null;
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
    .select("id, team_id, teammate_id, good_keywords, bad_keywords, comment, contribution_rating")
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
    const contributionRating =
      row.contribution_rating != null ? Number(row.contribution_rating) : null;
    result[row.teammate_id] = {
      good,
      bad,
      comment,
      contributionRating,
      submitted:
        good.length > 0 ||
        bad.length > 0 ||
        comment.length > 0 ||
        contributionRating != null,
    };
  }
  return result;
}

async function submitPeerReviewInDb(
  teamId: string,
  teammateId: string,
  input: {
    goodKeywords: string[];
    badKeywords: string[];
    comment?: string;
    contributionRating?: number | null;
  }
): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId || !teammateId) throw new Error("팀·팀원 정보가 없습니다.");

  const goodKeywords = input.goodKeywords.filter(Boolean);
  const badKeywords = input.badKeywords.filter(Boolean);
  const comment = input.comment?.trim() ?? "";
  const contributionRating =
    input.contributionRating != null ? Math.round(Number(input.contributionRating)) : null;
  if (
    contributionRating != null &&
    (contributionRating < 0 || contributionRating > 100 || Number.isNaN(contributionRating))
  ) {
    throw new Error("기여도는 0~100 사이로 입력해 주세요.");
  }

  if (
    goodKeywords.length === 0 &&
    badKeywords.length === 0 &&
    !comment &&
    contributionRating == null
  ) {
    throw new Error("키워드, 기여도, 또는 코멘트를 입력해주세요.");
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
      contribution_rating: contributionRating,
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

  await adjustMannerTemperatureFromPeerReview(
    teammateId,
    goodKeywords.length * POSITIVE_PEER_REVIEW_DELTA,
    badKeywords.length * NEGATIVE_PEER_REVIEW_DELTA
  );
}

async function adjustMannerTemperatureFromPeerReview(
  targetUserId: string,
  goodPoints: number,
  badPoints: number
): Promise<void> {
  const delta = goodPoints - badPoints;
  if (delta === 0) return;

  const { data: row, error: fetchError } = await supabase
    .from("ai_user_learning_profiles")
    .select("user_id, temperature")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (fetchError) {
    if (isMissingRelationError(fetchError)) return;
    throw fetchError;
  }

  const current = Number(row?.temperature) || DEFAULT_MANNER_TEMPERATURE;
  const next = Math.max(0, Math.min(100, current + delta));

  if (row) {
    const { error } = await supabase
      .from("ai_user_learning_profiles")
      .update({ temperature: next })
      .eq("user_id", targetUserId);
    if (error && !isMissingRelationError(error)) throw error;
    return;
  }

  const { error: insertError } = await supabase.from("ai_user_learning_profiles").insert({
    user_id: targetUserId,
    temperature: next,
    team_project_count: 0,
    portfolio_file: "",
    detailed_bio: "",
    keywords: [],
  });
  if (insertError && !isMissingRelationError(insertError)) throw insertError;
}

/** vision #53 후속 — peer_review_students 행 id도 user_id 로 정규화 (교수 평가·동료평가 키 일치) */
async function getTeamDetailPeerReviewStudentsFromDb(teamId?: string): Promise<PeerReviewStudent[]> {
  if (!teamId) return [];

  const [detailResult, roster] = await Promise.all([
    supabase
      .from("ai_team_detail_peer_review_students")
      .select("id, name, contribution, peer_keywords, peer_comment, roles, sort_order, team_id")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
    getTeamMembersWithNamesFromDb(teamId),
  ]);

  if (detailResult.error) throw detailResult.error;

  const userIdByName = new Map(
    roster.map((member) => [member.name.trim(), member.userId] as const)
  );

  const detailRows = detailResult.data ?? [];
  if (detailRows.length > 0) {
    return detailRows.map((student) => ({
      id: userIdByName.get(student.name.trim()) ?? student.id,
      name: student.name,
      contribution: student.contribution,
      peerKeywords: asArray<string>(student.peer_keywords),
      peerComment: student.peer_comment,
      roles: asArray<string>(student.roles),
    }));
  }

  return roster.map((member) => ({
    id: member.userId,
    name: member.name,
    contribution: member.contribution,
    peerKeywords: [] as string[],
    peerComment: "",
    roles: [] as string[],
  }));
}

async function getTeamDetailReviewKeywordsFromDb(teamId?: string) {
  const config = await getTeamDetailConfigFromDb(teamId);
  const configuredGood = asArray<string>(config.good_keywords);
  const configuredBad = asArray<string>(config.bad_keywords);

  return {
    good:
      configuredGood.length > 0 ? configuredGood : [...DEFAULT_PEER_REVIEW_GOOD_KEYWORDS],
    bad: configuredBad,
  };
}

async function getTeamDetailFeedbackOptionsFromDb(teamId?: string): Promise<string[]> {
  const config = await getTeamDetailConfigFromDb(teamId);
  const options = asArray<string>(config.feedback_options);
  const base = options.length > 0 ? options : [...DEFAULT_TEAM_FEEDBACK_OPTIONS];
  return base.filter((option) => option !== NEGATIVE_TEAM_FEEDBACK_OPTION);
}

async function recordTeamActivityInDb(
  teamId: string,
  input: { tag: string; title: string; description: string }
): Promise<void> {
  const { data: latest, error: orderError } = await supabase
    .from("ai_team_activities")
    .select("sort_order")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (orderError) {
    if (isMissingRelationError(orderError)) return;
    throw orderError;
  }

  const nextOrder = (latest?.[0]?.sort_order ?? 0) + 1;
  const displayTime = new Date().toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const { error } = await supabase.from("ai_team_activities").insert({
    team_id: teamId,
    tag: input.tag,
    title: input.title,
    description: input.description.slice(0, 240),
    display_time: displayTime,
    sort_order: nextOrder,
  });

  if (error && !isMissingRelationError(error)) throw error;
}

async function getTeamMembersWithNamesFromDb(teamId: string) {
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
    const role = member.role === "leader" ? "leader" : "member";
    return {
      userId: member.user_id ?? member.id,
      name: user?.name ?? "팀원",
      imageUrl: user ? resolveUserImageUrl(user) : undefined,
      contribution: role === "leader" ? 100 : 80,
      role,
      sort_order: member.sort_order,
      team_id: teamId,
    };
  });
}

/** vision #53 — detail teammates 행 id(예: team-swe-schedule-mate-1)가 아닌 Firebase user id 로 반환 */
async function getTeamDetailTeammatesFromDb(teamId?: string): Promise<PeerReviewTeammate[]> {
  if (!teamId) return [];

  const [detailResult, roster] = await Promise.all([
    supabase
      .from("ai_team_detail_teammates")
      .select("id, name, contribution, sort_order, team_id")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
    getTeamMembersWithNamesFromDb(teamId),
  ]);

  if (detailResult.error) throw detailResult.error;

  const userIdByName = new Map(
    roster.map((member) => [member.name.trim(), member.userId] as const)
  );

  const roleByUserId = new Map(roster.map((member) => [member.userId, member.role] as const));
  const imageUrlByUserId = new Map(
    roster.map((member) => [member.userId, member.imageUrl] as const)
  );

  const detailRows = detailResult.data ?? [];
  if (detailRows.length > 0) {
    return detailRows.flatMap((row) => {
      const userId = userIdByName.get(row.name.trim());
      if (!userId) return [];
      return [
        {
          id: userId,
          name: row.name,
          contribution: row.contribution,
          role: roleByUserId.get(userId) ?? "member",
          imageUrl: imageUrlByUserId.get(userId),
          sort_order: row.sort_order,
          team_id: teamId,
        },
      ];
    });
  }

  return roster.map((member) => ({
    id: member.userId,
    name: member.name,
    contribution: member.contribution,
    role: member.role,
    imageUrl: member.imageUrl,
    sort_order: member.sort_order,
    team_id: teamId,
  }));
}

async function isStudentMemberOfTeamFromDb(teamId: string): Promise<boolean> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser || currentUser.role !== "student" || !teamId) return false;

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) return false;

  const myTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
  return myTeamId === teamId;
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

  const { data: myRow, error: myRowError } = await supabase
    .from("ai_team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (myRowError) throw myRowError;
  if (!myRow) throw new Error("이 팀의 멤버가 아닙니다.");
  if (myRow.role !== "leader") throw new Error("팀장만 팀플 스테이지 진행 상황을 수정할 수 있습니다.");

  const stageNames = await getCourseStageNamesFromDb(courseId);
  const clamped = Math.max(0, Math.min(completedStages, stageNames.length));
  const progressPct =
    stageNames.length > 0 ? Math.round((clamped / stageNames.length) * 100) : 0;

  const { data, error } = await supabase
    .from("ai_teams")
    .update({
      completed_stages: clamped,
      progress: progressPct,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId)
    .select("id, completed_stages, progress")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "스테이지 진행이 저장되지 않았습니다. Supabase ai_teams UPDATE 권한(RLS)을 확인해 주세요."
    );
  }
}

async function saveProfessorProfileInDb(input: {
  department: string;
  office: string;
  officeHours: string;
  researchAreas: string[];
  bio?: string;
  teachingStyle?: string;
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
      bio: input.bio?.trim() || null,
      teaching_style: input.teachingStyle?.trim() || null,
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
      author_user_id: currentUser.id,
      status,
      display_timestamp: displayTimestamp,
      problem,
      plan: input.plan?.trim() || null,
      solution: input.solution?.trim() || null,
      sort_order: sortOrder,
    })
    .select("id, author, author_user_id, status, display_timestamp, problem, plan, solution, sort_order, team_id")
    .single();

  if (error) throw error;

  const mapped = mapTroubleshootingLogRow(data);
  void recordTeamActivityInDb(teamId, {
    tag: "트러블슈팅",
    title: "트러블슈팅 등록",
    description: problem,
  }).catch((activityError) => console.warn("팀 활동 기록 실패:", activityError));

  return mapped;
}

async function getTroubleshootingLogById(logId: string) {
  const { data, error } = await supabase
    .from("ai_team_detail_troubleshooting_logs")
    .select("id, author, author_user_id, status, display_timestamp, problem, plan, solution, team_id")
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
  const authorId = existing.author_user_id as string | null;
  const isAuthor = authorId ? authorId === currentUser.id : existing.author === currentUser.name;
  if (!isAuthor) {
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

function sanitizeDeliverablePathSegment(segment: string): string {
  const extension = getDeliverableExtension(segment);
  const base = segment
    .slice(0, segment.length - (extension ? extension.length + 1 : 0))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 80);
  const safeBase = base || "file";
  return extension ? `${safeBase}.${extension}` : safeBase;
}

/** Storage object key — Supabase/S3 allows only ASCII [A-Za-z0-9._-] (no 한글·spaces). */
function buildDeliverableStorageFileName(fileName: string, _extension: string): string {
  return sanitizeDeliverablePathSegment(fileName);
}

function normalizeDeliverableRelativePath(file: File): string | null {
  const raw = file.webkitRelativePath?.trim();
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized || null;
}

/** 단일 파일 업로드 키 (ZIP·PDF 등). 폴더는 클라이언트에서 ZIP 1개로 묶어 업로드 */
function buildDeliverableStorageObjectKey(
  courseId: string,
  teamId: string,
  deliverableId: string,
  file: File
): string {
  const relativePath = normalizeDeliverableRelativePath(file);
  if (relativePath) {
    const safePath = relativePath
      .split("/")
      .filter(Boolean)
      .map((segment) => sanitizeDeliverablePathSegment(segment))
      .join("/");
    return `${courseId}/${teamId}/${deliverableId}/${safePath}`;
  }
  const extension = getDeliverableExtension(file.name);
  const storageFileName = buildDeliverableStorageFileName(file.name, extension);
  return `${courseId}/${teamId}/${deliverableId}_${storageFileName}`;
}

function resolveDeliverableUploadDisplayName(file: File, meta?: TeamDeliverableSubmitMeta): string {
  const title = meta?.title?.trim();
  if (title) return title;
  return normalizeDeliverableRelativePath(file) || file.name;
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

const DELIVERABLE_SELECT_COLUMNS =
  "id, team_id, course_id, uploaded_by_user_id, uploader_name, file_name, file_size, mime_type, public_url, storage_path, description, subtitle, created_at";

const DELIVERABLE_LINK_LINE_PREFIX = "🔗 배포 링크: ";

function appendDeployLinkToDescription(
  description: string | null | undefined,
  linkUrl?: string
): string | null {
  const trimmedLink = linkUrl?.trim();
  if (!trimmedLink) return description?.trim() || null;
  const normalized = normalizeDeliverableUrl(trimmedLink);
  const line = `${DELIVERABLE_LINK_LINE_PREFIX}${normalized}`;
  const base = description?.trim() || "";
  if (base.includes(normalized)) return base || null;
  return base ? `${base}\n\n${line}` : line;
}

function resolveDeliverableDisplayName(
  fileName: string,
  meta?: TeamDeliverableSubmitMeta
): string {
  const title = meta?.title?.trim();
  return title || fileName;
}

function isDeliverableLinkRow(row: {
  storage_path?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  public_url?: string | null;
}): boolean {
  if ((row.storage_path ?? "").startsWith("link://")) return true;
  if (row.mime_type === "text/url") return true;
  const size = Number(row.file_size ?? 0);
  const url = row.public_url ?? "";
  return size === 0 && /^https?:\/\//i.test(url);
}

function resolveDeliverablePublicUrl(row: {
  public_url?: string | null;
  storage_path?: string | null;
  description?: string | null;
}): string {
  const direct = row.public_url?.trim();
  if (direct) return direct;
  const fromDescription = extractDeployLinkFromDescription(row.description);
  if (fromDescription) return fromDescription;
  const storagePath = row.storage_path?.trim();
  if (storagePath && !storagePath.startsWith("link://")) {
    const { data } = supabase.storage.from(TEAM_DELIVERABLES_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }
  return "";
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
  public_url: string | null;
  storage_path?: string | null;
  description?: string | null;
  subtitle?: string | null;
  created_at: string;
}): TeamDeliverable {
  const isLink = isDeliverableLinkRow(row);
  return {
    id: row.id,
    teamId: row.team_id,
    courseId: row.course_id,
    uploaderId: row.uploaded_by_user_id,
    uploaderName: row.uploader_name,
    fileName: row.file_name,
    fileSize: Number(row.file_size ?? 0),
    mimeType: row.mime_type ?? undefined,
    publicUrl: resolveDeliverablePublicUrl(row),
    kind: isLink ? "link" : "file",
    subtitle: row.subtitle?.trim() || undefined,
    description: row.description?.trim() || undefined,
    createdAt: asDate(row.created_at),
  };
}

async function assertTeamDeliverableAccess(teamId: string): Promise<{ courseId: string }> {
  let courseId = getCachedTeamCourseId(teamId);
  if (!courseId) {
    courseId = await getTeamCourseIdFromDb(teamId);
    if (!courseId) throw new Error("팀 정보를 찾을 수 없습니다.");
    setCachedTeamCourseId(teamId, courseId);
  }

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
  if (currentUser.role === "professor") {
    throw new Error("교수는 팀 산출물을 등록·수정할 수 없습니다.");
  }
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
    .select(DELIVERABLE_SELECT_COLUMNS)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapDeliverableRow(row));
}

async function uploadTeamDeliverableInDb(
  teamId: string,
  file: File,
  meta?: TeamDeliverableSubmitMeta
): Promise<TeamDeliverable> {
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
  const storagePath = buildDeliverableStorageObjectKey(courseId, teamId, deliverableId, file);

  const contentType =
    file.type ||
    (extension === "zip"
      ? "application/zip"
      : extension === "7z"
        ? "application/x-7z-compressed"
        : undefined);

  try {
    await uploadFileToStorage({
      bucket: TEAM_DELIVERABLES_BUCKET,
      path: storagePath,
      file,
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
  } catch (uploadError) {
    throw formatDeliverableStorageError(uploadError);
  }

  const { data: urlData } = supabase.storage.from(TEAM_DELIVERABLES_BUCKET).getPublicUrl(storagePath);
  const now = new Date().toISOString();
  const description = appendDeployLinkToDescription(meta?.description, meta?.linkUrl);
  const subtitle = meta?.subtitle?.trim() || null;
  const displayName = resolveDeliverableUploadDisplayName(file, meta);

  const { data, error } = await supabase
    .from("ai_team_deliverables")
    .insert({
      id: deliverableId,
      team_id: teamId,
      course_id: courseId,
      uploaded_by_user_id: currentUser.id,
      uploader_name: currentUser.name,
      file_name: displayName,
      subtitle,
      description,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type || null,
      public_url: urlData.publicUrl,
      created_at: now,
      updated_at: now,
    })
    .select(DELIVERABLE_SELECT_COLUMNS)
    .single();

  if (error) {
    await supabase.storage.from(TEAM_DELIVERABLES_BUCKET).remove([storagePath]);
    throw error;
  }

  const mapped = mapDeliverableRow(data);
  void recordTeamActivityInDb(teamId, {
    tag: "산출물",
    title: "새 소스 업로드!",
    description: displayName,
  }).catch((activityError) => console.warn("팀 활동 기록 실패:", activityError));

  return mapped;
}

async function addTeamDeliverableLinkInDb(
  teamId: string,
  input: { url: string; title?: string; subtitle?: string; description?: string }
): Promise<TeamDeliverable> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!teamId) throw new Error("팀 정보가 없습니다.");

  const { courseId } = await assertStudentOwnTeamWrite(teamId);
  const normalizedUrl = normalizeDeliverableUrl(input.url);
  const parsed = new URL(normalizedUrl);
  const fallbackName = `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  const title = input.title?.trim() || fallbackName;
  const subtitle = input.subtitle?.trim() || null;
  const description = input.description?.trim() || null;
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
      subtitle,
      description,
      storage_path: `link://${deliverableId}`,
      file_size: 0,
      mime_type: "text/url",
      public_url: normalizedUrl,
      created_at: now,
      updated_at: now,
    })
    .select(DELIVERABLE_SELECT_COLUMNS)
    .single();

  if (error) throw error;

  const mapped = mapDeliverableRow(data);
  void recordTeamActivityInDb(teamId, {
    tag: "링크",
    title: "새 링크 등록!",
    description: title,
  }).catch((activityError) => console.warn("팀 활동 기록 실패:", activityError));

  return mapped;
}

async function deleteTeamDeliverableInDb(deliverableId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: existing, error: fetchError } = await supabase
    .from("ai_team_deliverables")
    .select(
      "id, team_id, uploaded_by_user_id, storage_path, mime_type, file_size, public_url"
    )
    .eq("id", deliverableId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("파일을 찾을 수 없습니다.");

  await assertTeamDeliverableAccess(existing.team_id);

  const isOwner = String(existing.uploaded_by_user_id) === String(currentUser.id);
  const canDeleteAsStaff = ["professor", "admin"].includes(currentUser.role);
  if (!isOwner && !canDeleteAsStaff) {
    throw new Error("본인이 업로드한 파일 또는 교수만 삭제할 수 있습니다.");
  }

  const isLink = isDeliverableLinkRow(existing);
  if (!isLink && existing.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(TEAM_DELIVERABLES_BUCKET)
      .remove([existing.storage_path]);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("ai_team_deliverables").delete().eq("id", deliverableId);
  if (error) throw error;
}

async function assertCanModifyDeliverable(
  existing: { team_id: string; uploaded_by_user_id: string }
): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  await assertTeamDeliverableAccess(existing.team_id);

  const isOwner = String(existing.uploaded_by_user_id) === String(currentUser.id);
  const canModifyAsStaff = ["professor", "admin"].includes(currentUser.role);
  if (!isOwner && !canModifyAsStaff) {
    throw new Error("본인이 등록한 산출물 또는 교수만 수정할 수 있습니다.");
  }
}

const COURSE_MATERIALS_BUCKET = "ai_course_materials";
const COURSE_MATERIAL_MAX_BYTES = 100 * 1024 * 1024;

function toCourseMaterialStorageError(error: { message?: string }): Error {
  const raw = error.message ?? "업로드에 실패했습니다.";
  const lower = raw.toLowerCase();
  if (lower.includes("bucket") && (lower.includes("not found") || lower.includes("not exist"))) {
    return new Error(
      "강의 자료 Storage 버킷(ai_course_materials)이 없습니다. Supabase에 마이그레이션을 적용해 주세요."
    );
  }
  return new Error(raw);
}

function createCourseMaterialId(courseId: string): string {
  const slug = courseId.replace(/[^a-z0-9]+/gi, "-").slice(0, 20);
  return `cm-${slug}-${Date.now()}`;
}

async function getCourseMaterialsFromDb(courseId: string): Promise<CourseMaterial[]> {
  const accessible = await getAccessibleCourseIds();
  if (!accessible.includes(courseId)) return [];

  const { data, error } = await supabase
    .from("ai_course_materials")
    .select(
      "id, course_id, title, file_name, file_size, mime_type, public_url, uploader_name, created_at"
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    fileName: row.file_name,
    fileSize: Number(row.file_size ?? 0),
    mimeType: row.mime_type ?? undefined,
    publicUrl: row.public_url,
    uploaderName: row.uploader_name ?? "교수",
    createdAt: asDate(row.created_at),
  }));
}

async function uploadCourseMaterialInDb(
  courseId: string,
  file: File,
  title?: string
): Promise<CourseMaterial> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!["professor", "admin"].includes(currentUser.role)) {
    throw new Error("강의 자료는 교수만 업로드할 수 있습니다.");
  }

  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");
  if (course.status === "archived") {
    throw new Error("종료된 수업에는 자료를 업로드할 수 없습니다.");
  }

  if (file.size > COURSE_MATERIAL_MAX_BYTES) {
    throw new Error("파일 크기는 100MB 이하여야 합니다.");
  }

  const materialId = createCourseMaterialId(courseId);
  const extension = getDeliverableExtension(file.name);
  const storageFileName = buildDeliverableStorageFileName(file.name, extension || "bin");
  const storagePath = `${courseId}/${materialId}_${storageFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(COURSE_MATERIALS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw toCourseMaterialStorageError(uploadError);

  const { data: urlData } = supabase.storage.from(COURSE_MATERIALS_BUCKET).getPublicUrl(storagePath);
  const displayTitle = title?.trim() || file.name;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_course_materials")
    .insert({
      id: materialId,
      course_id: courseId,
      title: displayTitle,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      uploaded_by_user_id: currentUser.id,
      uploader_name: currentUser.name,
      created_at: now,
    })
    .select(
      "id, course_id, title, file_name, file_size, mime_type, public_url, uploader_name, created_at"
    )
    .single();

  if (error) throw error;

  return {
    id: data.id,
    courseId: data.course_id,
    title: data.title,
    fileName: data.file_name,
    fileSize: Number(data.file_size ?? 0),
    mimeType: data.mime_type ?? undefined,
    publicUrl: data.public_url,
    uploaderName: data.uploader_name ?? currentUser.name,
    createdAt: asDate(data.created_at),
  };
}

async function deleteCourseMaterialInDb(materialId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!["professor", "admin"].includes(currentUser.role)) {
    throw new Error("강의 자료는 교수만 삭제할 수 있습니다.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("ai_course_materials")
    .select("id, course_id, storage_path")
    .eq("id", materialId)
    .maybeSingle();

  if (fetchError) {
    if (isMissingRelationError(fetchError)) throw new Error("강의 자료 기능이 아직 준비되지 않았습니다.");
    throw fetchError;
  }
  if (!existing) throw new Error("자료를 찾을 수 없습니다.");

  if (existing.storage_path) {
    await supabase.storage.from(COURSE_MATERIALS_BUCKET).remove([existing.storage_path]);
  }

  const { error } = await supabase.from("ai_course_materials").delete().eq("id", materialId);
  if (error) throw error;
}

async function updateTeamDeliverableInDb(
  deliverableId: string,
  input: {
    title?: string;
    subtitle?: string;
    description?: string;
    url?: string;
    file?: File;
  }
): Promise<TeamDeliverable> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: existing, error: fetchError } = await supabase
    .from("ai_team_deliverables")
    .select(
      "id, team_id, course_id, uploaded_by_user_id, uploader_name, file_name, storage_path, file_size, mime_type, public_url, description"
    )
    .eq("id", deliverableId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("산출물을 찾을 수 없습니다.");

  if (currentUser.role === "student") {
    await assertStudentOwnTeamWrite(existing.team_id);
  }
  await assertCanModifyDeliverable(existing);

  const isLink = isDeliverableLinkRow(existing);
  const now = new Date().toISOString();
  const title = input.title?.trim();
  const subtitle =
    input.subtitle !== undefined ? input.subtitle.trim() || null : (existing as { subtitle?: string }).subtitle ?? null;
  const description =
    input.description !== undefined
      ? appendDeployLinkToDescription(input.description, input.url)
      : input.url
        ? appendDeployLinkToDescription(existing.description, input.url)
        : existing.description;

  if (isLink) {
    const url = input.url?.trim();
    if (!url) throw new Error("배포 링크를 입력해주세요.");
    const normalizedUrl = normalizeDeliverableUrl(url);
    const displayTitle = title || existing.file_name;

    const { data, error } = await supabase
      .from("ai_team_deliverables")
      .update({
        file_name: displayTitle,
        subtitle,
        description,
        public_url: normalizedUrl,
        updated_at: now,
      })
      .eq("id", deliverableId)
      .select(DELIVERABLE_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return mapDeliverableRow(data);
  }

  let storagePath = existing.storage_path;
  let fileSize = Number(existing.file_size ?? 0);
  let mimeType = existing.mime_type;
  let publicUrl = existing.public_url;
  let displayName = title || existing.file_name;

  if (input.file) {
    const extension = getDeliverableExtension(input.file.name);
    if (!extension || !TEAM_DELIVERABLE_ALLOWED_EXT.has(extension)) {
      throw new Error("지원하지 않는 파일 형식입니다. (예: zip, ts, py, pdf, png)");
    }
    if (input.file.size > TEAM_DELIVERABLE_MAX_BYTES) {
      throw new Error("파일 크기는 500MB 이하여야 합니다.");
    }

    const newId = createDeliverableId(existing.team_id);
    const storageFileName = buildDeliverableStorageFileName(input.file.name, extension);
    const newStoragePath = `${existing.course_id}/${existing.team_id}/${newId}_${storageFileName}`;

    const replaceContentType =
      input.file.type ||
      (extension === "zip"
        ? "application/zip"
        : extension === "7z"
          ? "application/x-7z-compressed"
          : undefined);

    try {
      await uploadFileToStorage({
        bucket: TEAM_DELIVERABLES_BUCKET,
        path: newStoragePath,
        file: input.file,
        contentType: replaceContentType,
        cacheControl: "3600",
        upsert: false,
      });
    } catch (uploadError) {
      throw formatDeliverableStorageError(uploadError);
    }

    const { error: removeError } = await supabase.storage
      .from(TEAM_DELIVERABLES_BUCKET)
      .remove([existing.storage_path]);
    if (removeError) throw removeError;

    const { data: urlData } = supabase.storage.from(TEAM_DELIVERABLES_BUCKET).getPublicUrl(newStoragePath);
    storagePath = newStoragePath;
    fileSize = input.file.size;
    mimeType = replaceContentType ?? input.file.type ?? null;
    publicUrl = urlData.publicUrl;
    if (!title) {
      displayName = resolveDeliverableDisplayName(input.file.name, { title: undefined });
    }
  }

  const { data, error } = await supabase
    .from("ai_team_deliverables")
    .update({
      file_name: displayName,
      subtitle,
      description,
      storage_path: storagePath,
      file_size: fileSize,
      mime_type: mimeType,
      public_url: publicUrl,
      updated_at: now,
    })
    .eq("id", deliverableId)
    .select(DELIVERABLE_SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return mapDeliverableRow(data);
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

async function getTeamWorkspaceHeaderFromDb(teamId: string) {
  const { data, error } = await supabase
    .from("ai_teams")
    .select("id, name, project_title, badge")
    .eq("id", teamId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: (data.name ?? "").trim() || teamId,
    projectTitle: (data.project_title ?? "").trim(),
    badge: data.badge?.trim() || undefined,
  };
}

const AUTO_TEAM_BADGE = "자동배정";
const TEAM_MEMBER_COLORS = [
  "cc-team-avatar-tint-1",
  "cc-team-avatar-tint-2",
  "cc-team-avatar-tint-3",
  "cc-team-avatar-tint-4",
  "cc-team-avatar-tint-5",
  "cc-team-avatar-tint-1",
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

/** vision #87 — 공지 등록은 팀 배정 assert와 분리 (담당 교수·진행 중 수업) */
async function assertProfessorCanManageAnnouncements(courseId: string) {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  if (currentUser.role === "admin") return currentUser;

  const course = await getCourseByIdFromDb(courseId);
  if (!course) throw new Error("수업을 찾을 수 없습니다.");
  if (course.status !== "active") {
    throw new Error("진행 중인 수업에서만 공지를 등록할 수 있습니다.");
  }
  if (
    currentUser.role !== "professor" ||
    String(course.professorId) !== String(currentUser.id)
  ) {
    throw new Error("담당 교수만 공지를 등록할 수 있습니다.");
  }

  return currentUser;
}

function formatAnnouncementDbError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/row-level security|42501|policy/i.test(message)) {
    return new Error(
      "공지 저장 권한이 없습니다. Supabase ai_announcements INSERT 정책을 확인해 주세요."
    );
  }
  return error instanceof Error ? error : new Error(message);
}

async function assertActiveCourseMembership(courseId: string) {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const status = await getCourseStatusFromDb(courseId);
  if (!status) throw new Error("수업을 찾을 수 없습니다.");
  if (status !== "active") throw new Error("종료된 수업에서는 팀을 변경할 수 없습니다.");

  if (currentUser.role === "admin") return { currentUser };

  const accessible = await getAccessibleCourseIds();
  if (!accessible.includes(courseId)) {
    throw new Error("이 수업에 접근할 수 없습니다.");
  }

  return { currentUser };
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

async function assertStudentsUnassignedInCourse(courseId: string, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;

  const courseStudents = await getCourseUsers(courseId, "student");
  const allowedIds = new Set(courseStudents.map((user) => user.id));
  const assignedIds = new Set(await getAssignedStudentIdsInCourseFromDb(courseId));

  for (const userId of userIds) {
    if (!allowedIds.has(userId)) {
      throw new Error("수업에 등록되지 않은 학생이 포함되어 있습니다.");
    }
    if (assignedIds.has(userId)) {
      throw new Error("이미 다른 팀에 속한 학생은 선택할 수 없습니다.");
    }
  }
}

async function insertTeamMembersInDb(
  teamId: string,
  courseId: string,
  userIds: string[],
  leaderUserId: string
): Promise<void> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  if (!uniqueIds.includes(leaderUserId)) {
    throw new Error("팀장은 팀원 목록에 포함되어야 합니다.");
  }

  await assertStudentsUnassignedInCourse(courseId, uniqueIds);

  const orderedIds = [leaderUserId, ...uniqueIds.filter((id) => id !== leaderUserId)];
  const users = await getUsersByIds(orderedIds);
  const now = new Date().toISOString();

  const rows = orderedIds.map((userId, index) => {
    const user = users.find((item) => item.id === userId);
    return {
      id: `tm-${teamId}-${index + 1}`,
      team_id: teamId,
      user_id: userId,
      initial: user?.name?.slice(0, 1) ?? "?",
      color: TEAM_MEMBER_COLORS[index % TEAM_MEMBER_COLORS.length],
      role: userId === leaderUserId ? "leader" : "member",
      sort_order: index + 1,
      created_at: now,
    };
  });

  const { error } = await supabase.from("ai_team_members").insert(rows);
  if (error) throw error;
}

async function createTeamInDb(
  courseId: string,
  input: { name: string; projectTitle?: string; memberUserIds?: string[] }
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

  const requestedIds = Array.from(new Set((input.memberUserIds ?? []).filter(Boolean)));

  if (currentUser.role === "student") {
    const existingTeamId = await getMyTeamIdInCourseFromDb(courseId, currentUser.id);
    if (existingTeamId) {
      throw new Error("이미 다른 팀에 속해 있습니다. 탈퇴 후 새 팀을 만들 수 있습니다.");
    }

    const memberIds = [currentUser.id, ...requestedIds.filter((id) => id !== currentUser.id)];
    await assertStudentsUnassignedInCourse(courseId, memberIds);
    await insertTeamMembersInDb(teamId, courseId, memberIds, currentUser.id);
  } else if (requestedIds.length > 0) {
    await assertStudentsUnassignedInCourse(courseId, requestedIds);
    await insertTeamMembersInDb(teamId, courseId, requestedIds, requestedIds[0]);
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

  const { data: myRow, error: myRowError } = await supabase
    .from("ai_team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (myRowError) throw myRowError;
  if (!myRow) throw new Error("이 팀의 멤버가 아닙니다.");

  if (myRow.role === "leader") {
    const { data: nextLeader, error: nextError } = await supabase
      .from("ai_team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .neq("user_id", currentUser.id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextError) throw nextError;

    if (nextLeader?.user_id) {
      const { error: promoteError } = await supabase
        .from("ai_team_members")
        .update({ role: "leader" })
        .eq("team_id", teamId)
        .eq("user_id", nextLeader.user_id);

      if (promoteError) throw promoteError;
    }
  }

  const { error } = await supabase
    .from("ai_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", currentUser.id);

  if (error) throw error;

  const { count, error: countError } = await supabase
    .from("ai_team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (countError) throw countError;
  if ((count ?? 0) === 0) {
    const { error: deleteTeamError } = await supabase.from("ai_teams").delete().eq("id", teamId);
    if (deleteTeamError) throw deleteTeamError;
  }
}

async function updateTeamProfileInDb(
  teamId: string,
  input: { name?: string; projectTitle?: string }
): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") {
    throw new Error("학생만 팀 정보를 수정할 수 있습니다.");
  }

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀을 찾을 수 없습니다.");

  await assertActiveCourseMembership(courseId);

  const { data: myRow, error: myRowError } = await supabase
    .from("ai_team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (myRowError) throw myRowError;
  if (!myRow) throw new Error("이 팀의 멤버가 아닙니다.");
  if (myRow.role !== "leader") throw new Error("팀장만 팀명·프로젝트명을 수정할 수 있습니다.");

  const patch: { name?: string; project_title?: string } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("팀 이름을 입력해주세요.");
    patch.name = name;
  }
  if (input.projectTitle !== undefined) {
    patch.project_title = input.projectTitle.trim() || "팀 프로젝트";
  }

  const { data, error } = await supabase
    .from("ai_teams")
    .update(patch)
    .eq("id", teamId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("팀 정보가 저장되지 않았습니다. Supabase ai_teams UPDATE 권한(RLS)을 확인해 주세요.");
  }
}

async function transferTeamLeaderInDb(teamId: string, newLeaderUserId: string): Promise<void> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (currentUser.role !== "student") {
    throw new Error("학생만 팀장을 변경할 수 있습니다.");
  }

  const trimmedLeaderId = newLeaderUserId.trim();
  if (!trimmedLeaderId) throw new Error("새 팀장을 선택해 주세요.");
  if (trimmedLeaderId === currentUser.id) {
    throw new Error("이미 팀장입니다.");
  }

  const courseId = await getTeamCourseIdFromDb(teamId);
  if (!courseId) throw new Error("팀을 찾을 수 없습니다.");

  await assertActiveCourseMembership(courseId);

  const { data: members, error: membersError } = await supabase
    .from("ai_team_members")
    .select("user_id, role")
    .eq("team_id", teamId);

  if (membersError) throw membersError;

  const rows = members ?? [];
  const myRow = rows.find((row) => row.user_id === currentUser.id);
  if (!myRow) throw new Error("이 팀의 멤버가 아닙니다.");
  if (myRow.role !== "leader") throw new Error("팀장만 팀장을 넘길 수 있습니다.");

  const nextLeader = rows.find((row) => row.user_id === trimmedLeaderId);
  if (!nextLeader) throw new Error("선택한 학생이 이 팀에 속해 있지 않습니다.");

  const { error: demoteError } = await supabase
    .from("ai_team_members")
    .update({ role: "member" })
    .eq("team_id", teamId)
    .eq("user_id", currentUser.id);

  if (demoteError) throw demoteError;

  const { error: promoteError } = await supabase
    .from("ai_team_members")
    .update({ role: "leader" })
    .eq("team_id", teamId)
    .eq("user_id", trimmedLeaderId);

  if (promoteError) throw promoteError;

  const { data: verifyLeader, error: verifyError } = await supabase
    .from("ai_team_members")
    .select("user_id, role")
    .eq("team_id", teamId)
    .eq("role", "leader")
    .maybeSingle();

  if (verifyError) throw verifyError;
  if (verifyLeader?.user_id !== trimmedLeaderId) {
    throw new Error(
      "팀장 변경이 저장되지 않았습니다. 잠시 후 다시 시도하거나 Supabase 권한(RLS)을 확인해 주세요."
    );
  }
}

async function getTeamManagementFromDb(courseId?: string): Promise<TeamManagementInfo | null> {
  const currentUser = await getCurrentAiUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const selectedCourseId = await getSelectedCourseId(courseId);
  if (!selectedCourseId) return null;

  const course = await getCourseByIdFromDb(selectedCourseId);
  if (!course) return null;

  const teamId = await getMyTeamIdInCourseFromDb(selectedCourseId, currentUser.id);
  if (!teamId) return null;

  const [teamResult, stageNames] = await Promise.all([
    supabase.from("ai_teams").select("id, name, project_title, completed_stages").eq("id", teamId).maybeSingle(),
    getCourseStageNamesFromDb(selectedCourseId),
  ]);

  const { data: team, error: teamError } = teamResult;

  if (teamError) throw teamError;
  if (!team) return null;

  const { data: memberRows, error: membersError } = await supabase
    .from("ai_team_members")
    .select("user_id, role, sort_order")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true });

  if (membersError) throw membersError;

  const users = await getUsersByIds(
    Array.from(new Set((memberRows ?? []).map((row) => row.user_id).filter(Boolean))),
  );

  const members = (memberRows ?? []).map((row) => {
    const user = users.find((item) => item.id === row.user_id);
    const role = row.role === "leader" ? "leader" : "member";
    return {
      id: row.user_id,
      name: user?.name ?? "팀원",
      studentId: user?.student_number ?? undefined,
      role,
      isSelf: row.user_id === currentUser.id,
    };
  });

  const myRole = members.find((member) => member.isSelf)?.role ?? null;

  const completedRaw = Number(team.completed_stages ?? 0);
  const completedStages = Math.max(0, Math.min(completedRaw, stageNames.length));

  return {
    teamId: team.id,
    teamName: team.name,
    projectTitle: team.project_title ?? "",
    members,
    myRole,
    isArchived: course.status === "archived",
    completedStages,
    stageNames,
  };
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
    listMaterials: getCourseMaterialsFromDb,
    uploadMaterial: uploadCourseMaterialInDb,
    deleteMaterial: deleteCourseMaterialInDb,
  },
  memberships: {
    joinByCode: joinCourseByCodeInDb,
    leave: leaveCourseMembershipInDb,
  },
  catalog: {
    list: listCatalogFromDb,
    join: joinFromCatalogInDb,
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
    getWorkspaceHeader: getTeamWorkspaceHeaderFromDb,
    getAssignedStudentIds: getAssignedStudentIdsInCourseFromDb,
    getMyTeamIdInCourse: getMyTeamIdInCourseFromDb,
    getManagement: getTeamManagementFromDb,
    isStudentMember: isStudentMemberOfTeamFromDb,
    create: createTeamInDb,
    join: joinTeamInDb,
    leave: leaveTeamInDb,
    transferLeader: transferTeamLeaderInDb,
    updateProfile: updateTeamProfileInDb,
    updateCompletedStages: updateTeamCompletedStagesInDb,
    saveRandomAssignment: saveRandomTeamsInDb,
  },
  directMessages: {
    getThread: getDirectMessagesFromDb,
    send: sendDirectMessageInDb,
    warmSendContext: warmDirectChatSendContextInDb,
    listThreads: listDirectMessageThreadsFromDb,
  },
  navInbox: {
    getSnapshot: getNavInboxSnapshotFromDb,
  },
  teamStages: {
    getAll: getTeamStagesFromDb,
    getByCourse: getCourseStagesFromDb,
    replace: replaceCourseStagesInDb,
  },
  announcements: {
    getAll: getAnnouncementsFromDb,
    create: createAnnouncementInDb,
    delete: deleteAnnouncementInDb,
  },
  studentNetwork: {
    getStudents: getNetworkStudentsFromDb,
    getExtras: getStudentExtrasFromDb,
    getPeerEvaluations: getCourseStudentPeerEvaluationsFromDb,
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
    warmChatSendContext: warmTeamChatSendContextInDb,
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
    updateDeliverable: updateTeamDeliverableInDb,
    recommendTroubleshootingAi: recommendTroubleshootingFromEdge,
  },
  syllabi: {
    search: searchSyllabiFromDb,
    getById: getSyllabusByIdFromDb,
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
    buildMyPageReportView,
    generateReport: generateAiReportFromEdge,
  },
};
