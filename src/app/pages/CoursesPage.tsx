import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { api, invalidateApiSessionCache } from "../api/supabase-api";
import AppModal from "../components/layout/AppModal";
import M3Button from "../components/layout/M3Button";
import PageHeader from "../components/layout/PageHeader";
import PageLoading from "../components/layout/PageLoading";
import CourseListCard from "../components/courses/CourseListCard";
import StageNameListEditor, {
  createStageRow,
  type StageRow,
} from "../components/courses/StageNameListEditor";
import { useAuth } from "../contexts/AuthContext";
import { useDebouncedRealtimeReload } from "../hooks/useDebouncedRealtimeReload";
import { defaultNewCourseDates } from "../utils/courseDates";
import type { Course, CourseStatus, CreateCourseInput } from "../types";
import { supabase } from "../supabase";

const defaultStageNames = ["아이디어 기획", "서비스 디자인", "프론트 개발", "백엔드 개발", "발표 및 배포"];

function generateAutoCourseCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (size: number) =>
    Array.from({ length: size }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CC-${pick(4)}-${pick(4)}`;
}

const emptyForm: CreateCourseInput = {
  name: "",
  code: "",
  semester: "2026-1",
  schedule: "",
  ...defaultNewCourseDates(),
  room: "",
  maxStudents: undefined,
  description: "",
  stages: defaultStageNames,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CourseStatus>("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateCourseInput>(emptyForm);
  const [stageRows, setStageRows] = useState<StageRow[]>(
    emptyForm.stages.map((name) => createStageRow(name))
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuthenticated, isProfessor, isAdmin, isStudent, user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const canManageCourses = isProfessor || isAdmin;
  const openCreateModal = () => {
    const nextStages = [...emptyForm.stages];
    setForm({
      ...emptyForm,
      code: generateAutoCourseCode(),
      ...defaultNewCourseDates(),
      stages: nextStages,
    });
    setStageRows(nextStages.map((name) => createStageRow(name)));
    setShowCreateModal(true);
  };

  const loadCourses = useCallback(async (status: CourseStatus, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setErrorMessage("");

    try {
      const data = await api.courses.getAll({ status });
      setCourses(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업 목록을 불러오지 못했습니다.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCourses(statusFilter);
  }, [statusFilter, loadCourses]);

  const courseListRealtimeTables = useMemo(
    () => [{ table: "ai_courses" }, { table: "ai_course_memberships" }],
    []
  );

  useDebouncedRealtimeReload(
    "courses-list-live",
    isAuthenticated,
    () => {
      invalidateApiSessionCache();
      return loadCourses(statusFilter, { silent: true });
    },
    courseListRealtimeTables
  );

  const updateForm = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncStagesToForm = (rows: StageRow[]) => {
    setStageRows(rows);
    setForm((prev) => ({ ...prev, stages: rows.map((r) => r.name) }));
  };

  const handleCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const created = await api.courses.create({
        ...form,
        code: form.code.trim(),
        stages: stageRows.map((row) => row.name.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setForm({
        ...emptyForm,
        code: generateAutoCourseCode(),
        ...defaultNewCourseDates(),
      });
      setStageRows(emptyForm.stages.map((name) => createStageRow(name)));
      setStatusFilter("active");
      setCourses((prev) => [created, ...prev.filter((course) => course.id !== created.id)]);
      await loadCourses("active", { silent: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 생성하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCourseCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert(`수업 코드 '${code}' 를 복사했습니다.`);
    } catch {
      alert(`수업 코드: ${code}`);
    }
  };

  const handleJoinCourse = async (event: FormEvent) => {
    event.preventDefault();
    setJoining(true);
    setErrorMessage("");

    try {
      const result = await api.memberships.joinByCode(joinCode);
      setJoinCode("");
      await loadCourses(statusFilter);
      alert(`'${result.courseName}' 수업에 등록되었습니다.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업 등록에 실패했습니다.");
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (
      !window.confirm(
        `'${course.name}' 수업과 연결된 팀·공지·멤버십 데이터를 모두 삭제합니다. 계속할까요?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.courses.delete(course.id);
      setCourses((prev) => prev.filter((item) => item.id !== course.id));
      await loadCourses(statusFilter, { silent: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 삭제하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

const handleArchiveCourse = async (course: Course) => {
    if (!window.confirm(`'${course.name}' 수업을 종료할까요? (수강생들의 팀 프로젝트 경험치가 +1 증가합니다.)`)) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      // 1. 기존 수업 종료(아카이브) API 호출
      await api.courses.archive(course.id);

      // 2. 수강생 목록 가져오기
      const { data: members, error: memberError } = await supabase
        .from('ai_course_memberships')
        .select('user_id')
        .eq('course_id', course.id);

      if (memberError) throw memberError;

// 3. 학생들 경험치 +1 (빈 칸이면 새로 만드는 Upsert 방식!)
      if (members && members.length > 0) {
        for (const member of members) {
          const studentId = member.user_id;

          // single() 대신 maybeSingle()을 써서 데이터가 없어도 에러가 안 나게 합니다.
          const { data: profileData } = await supabase
            .from('ai_user_learning_profiles')
            .select('team_project_count')
            .eq('user_id', studentId)
            .maybeSingle(); 

          const newCount = (profileData?.team_project_count || 0) + 1;

          // update 대신 upsert(있으면 덮어쓰기, 없으면 새로 생성)를 사용합니다!
          const { error: upsertError } = await supabase
            .from('ai_user_learning_profiles')
            .upsert(
              { user_id: studentId, team_project_count: newCount }, 
              { onConflict: 'user_id' } // user_id가 겹치면 덮어써라!
            );

          // 만약 권한 문제(RLS) 등으로 실패하면 개발자 도구에 빨간 글씨로 띄워줍니다.
          if (upsertError) {
            console.error(`학생(${studentId}) 경험치 업데이트 실패:`, upsertError.message);
          }
        }
      }

      // 4. 화면 새로고침
      await loadCourses(statusFilter);
      alert("수업이 종료되었고 경험치가 성공적으로 반영되었습니다!");

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 종료하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🌟 1순위: 로그인 안 했으면 로딩이고 뭐고 즉시 메인으로 쫓아냄!
  if (!isAuthenticated) {
    return <Navigate to="/" replace />; 
  }

  // 🌟 2순위: 로그인 한 사람만 로딩 화면을 볼 수 있음
  if (loading) {
    return <PageLoading shell message="수업 목록을 불러오는 중…" testId="courses-page-loading" />;
  }

  return (
    <div className="cc-app-shell w-full py-4 sm:py-6">
      <PageHeader
        title={statusFilter === "active" ? "현재 진행 수업" : "종료된 수업"}
        subtitle={`총 ${courses.length}개 과목`}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="m3-chip-group" role="tablist" aria-label="수업 상태">
              {(["active", "archived"] as CourseStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                  className={`m3-chip ${statusFilter === status ? "m3-chip--selected" : ""}`}
                >
                  {status === "active" ? "현재 진행 수업" : "종료된 수업"}
                </button>
              ))}
            </div>
            <Link to="/app/syllabi">
              <M3Button variant="outlined" type="button">
                강의계획서 검색
              </M3Button>
            </Link>
            {canManageCourses ? (
              <M3Button variant="filled" type="button" onClick={openCreateModal} data-testid="course-create-open">
                + 수업 생성
              </M3Button>
            ) : null}
          </div>
        }
      />

      {errorMessage && (
        <div role="alert" aria-live="polite" className="cc-alert-error mb-4 rounded-xl px-4 py-3 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {isStudent && statusFilter === "active" && courses.length > 0 && (
        <form
          onSubmit={handleJoinCourse}
          data-testid="courses-join-by-code-banner"
          className="cc-alert-info cc-courses-join-row mb-6 rounded-2xl p-4 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="courses-join-code-banner" className="cc-label mb-1 block font-bold">
              수업 코드로 등록
            </label>
            <p id="courses-join-code-hint" className="cc-text-secondary mb-2 text-xs">
              교수에게 받은 코드를 입력하세요 (예: WEB-2026)
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="courses-join-code-banner"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="수업 코드"
                aria-describedby="courses-join-code-hint"
                className="cc-input min-h-[2.75rem] flex-1 px-3 py-2 text-sm"
                data-testid="courses-join-code-input"
                required
              />
              <M3Button
                type="submit"
                variant="filled"
                disabled={joining}
                className="cc-courses-join-submit inline-flex h-[2.75rem] shrink-0 items-center justify-center px-5"
                data-testid="courses-join-submit"
              >
                {joining ? "등록 중..." : "수업 등록"}
              </M3Button>
            </div>
          </div>
        </form>
      )}

      {courses.length === 0 ? (
        <div
          data-testid="courses-empty-state"
          className="m3-surface-card border-dashed p-8 text-center sm:p-10"
        >
          <p className="cc-text-secondary">등록된 수업이 없습니다.</p>
          {isStudent && statusFilter === "active" && (
            <form
              onSubmit={handleJoinCourse}
              data-testid="courses-join-by-code-empty"
              className="mx-auto mt-6 max-w-sm space-y-3 text-left"
            >
              <label htmlFor="courses-join-code-empty" className="cc-label block">
                수업 코드로 등록하세요 (예: WEB-2026, DB-2026)
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="courses-join-code-empty"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="수업 코드"
                  className="cc-input min-h-[2.75rem] flex-1 px-3 py-2 text-sm"
                  data-testid="courses-join-code-input"
                  required
                />
                <M3Button
                  type="submit"
                  variant="filled"
                  disabled={joining}
                  className="cc-courses-join-submit inline-flex h-[2.75rem] shrink-0 items-center justify-center px-5 sm:w-auto"
                  data-testid="courses-join-submit"
                >
                  {joining ? "등록 중..." : "수업 등록"}
                </M3Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {courses.map((course) => {
            const canManageThisCourse = canManageCourses && (isAdmin || course.professorId === user?.id);
            const canArchiveCourse = canManageThisCourse && course.status === "active";

            return (
              <CourseListCard
                key={course.id}
                course={course}
                canManageCourses={canManageCourses}
                canArchiveCourse={canArchiveCourse}
                canManageThisCourse={canManageThisCourse}
                submitting={submitting}
                onCopyCode={copyCourseCode}
                onArchive={handleArchiveCourse}
                onDelete={(c) => void handleDeleteCourse(c)}
              />
            );
          })}
        </div>
      )}

      <AppModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        testId="courses-create-modal-overlay"
        ariaLabel="수업 생성"
        panelClassName="max-h-[90vh] max-w-2xl !p-0 overflow-y-auto"
      >
          <form
            onSubmit={handleCreateCourse}
            className="w-full p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="cc-modal-title">수업 생성</h2>
                <p className="cc-modal-subtitle">수업 기본 정보와 팀플 스테이지를 입력합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="cc-icon-btn-ghost"
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="cc-field cc-form-label">
                수업명
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  data-testid="course-create-name"
                  className="cc-input"
                />
              </label>
              <label className="cc-field cc-form-label">
                수업 코드
                <div className="cc-field-row">
                  <input
                    required
                    value={form.code}
                    readOnly
                    className="cc-input cc-input--readonly-surface"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm("code", generateAutoCourseCode())}
                    className="cc-btn-tonal-sm"
                  >
                    재생성
                  </button>
                </div>
              </label>
              <label className="cc-field cc-form-label sm:col-span-2">
                학기
                <input
                  required
                  value={form.semester}
                  onChange={(event) => updateForm("semester", event.target.value)}
                  className="cc-input"
                />
              </label>
              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <label className="cc-field cc-form-label">
                  시작일
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(event) => updateForm("startDate", event.target.value)}
                    className="cc-input"
                    data-testid="course-create-start-date"
                  />
                </label>
                <label className="cc-field cc-form-label">
                  종료일
                  <input
                    type="date"
                    required
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) => updateForm("endDate", event.target.value)}
                    className="cc-input"
                    data-testid="course-create-end-date"
                  />
                </label>
              </div>
              <label className="cc-field cc-form-label sm:col-span-2">
                강의 시간
                <input
                  value={form.schedule}
                  onChange={(event) => updateForm("schedule", event.target.value)}
                  placeholder="예: 월, 수 14:00–16:00"
                  className="cc-input"
                  data-testid="course-create-schedule"
                />
              </label>
              <label className="cc-field cc-form-label">
                강의실
                <input
                  value={form.room}
                  onChange={(event) => updateForm("room", event.target.value)}
                  className="cc-input"
                />
              </label>
              <label className="cc-field cc-form-label">
                최대 인원
                <input
                  type="number"
                  min={0}
                  value={form.maxStudents ?? ""}
                  onChange={(event) => updateForm("maxStudents", event.target.value ? Number(event.target.value) : undefined)}
                  className="cc-input"
                />
              </label>
            </div>

            <label className="cc-field cc-form-label mt-4">
              설명
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                className="cc-textarea min-h-24"
              />
            </label>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="cc-form-label">팀플 스테이지</p>
                <button
                  type="button"
                  onClick={() => syncStagesToForm([...stageRows, createStageRow()])}
                  className="m3-btn m3-btn--text !min-h-0 !py-1"
                >
                  + 단계 추가
                </button>
              </div>
              <StageNameListEditor
                rows={stageRows}
                onRowsChange={syncStagesToForm}
                inputTestIdPrefix="course-create-stage"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <M3Button type="button" variant="outlined" onClick={() => setShowCreateModal(false)}>
                취소
              </M3Button>
              <M3Button type="submit" variant="filled" disabled={submitting} data-testid="course-create-submit">
                {submitting ? "저장 중..." : "생성"}
              </M3Button>
            </div>
          </form>
      </AppModal>
    </div>
  );
}