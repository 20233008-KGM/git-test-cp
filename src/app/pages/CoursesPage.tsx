import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { api, invalidateApiSessionCache } from "../api/supabase-api";
import PageHeader from "../components/layout/PageHeader";
import PageLoading from "../components/layout/PageLoading";
import CourseListCard from "../components/courses/CourseListCard";
import CatalogCourseCard from "../components/courses/CatalogCourseCard";
import { useAuth } from "../contexts/AuthContext";
import { useDebouncedRealtimeReload } from "../hooks/useDebouncedRealtimeReload";
import type { Course, CourseCatalogEntry, CourseStatus } from "../types";
import { supabase } from "../supabase";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [catalog, setCatalog] = useState<CourseCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CourseStatus>("active");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [debouncedCatalogSearch, setDebouncedCatalogSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [catalogJoiningId, setCatalogJoiningId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuthenticated, isProfessor, isAdmin, user } = useAuth();

  const canManageCourses = isProfessor || isAdmin;

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

  const loadCatalog = useCallback(async (search: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setCatalogLoading(true);
    }

    try {
      const data = await api.catalog.list({ search: search.trim() || undefined });
      setCatalog(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "전체 강의 목록을 불러오지 못했습니다.");
    } finally {
      if (!options?.silent) {
        setCatalogLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCourses(statusFilter);
  }, [statusFilter, loadCourses]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCatalogSearch(catalogSearch);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [catalogSearch]);

  useEffect(() => {
    if (statusFilter !== "active") return;
    void loadCatalog(debouncedCatalogSearch);
  }, [statusFilter, debouncedCatalogSearch, loadCatalog]);

  const courseListRealtimeTables = useMemo(
    () => [
      { table: "ai_courses" },
      { table: "ai_course_memberships" },
      { table: "ai_course_catalog" },
    ],
    []
  );

  useDebouncedRealtimeReload(
    "courses-list-live",
    isAuthenticated,
    () => {
      invalidateApiSessionCache();
      return Promise.all([
        loadCourses(statusFilter, { silent: true }),
        statusFilter === "active" ? loadCatalog(debouncedCatalogSearch, { silent: true }) : Promise.resolve(),
      ]);
    },
    courseListRealtimeTables
  );

  const copyCourseCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert(`수업 코드 '${code}' 를 복사했습니다.`);
    } catch {
      alert(`수업 코드: ${code}`);
    }
  };

  const handleCatalogJoin = async (entry: CourseCatalogEntry) => {
    if (catalogJoiningId) return;
    setCatalogJoiningId(entry.id);
    setErrorMessage("");

    try {
      const result = await api.catalog.join(entry.id);
      await Promise.all([
        loadCourses(statusFilter, { silent: true }),
        loadCatalog(debouncedCatalogSearch, { silent: true }),
      ]);
      navigate(`/app/courses/${result.courseId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "강의 입장에 실패했습니다.");
    } finally {
      setCatalogJoiningId(null);
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
    if (!window.confirm(`'${course.name}' 수업을 종료할까요?`)) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.courses.archive(course.id);

      const { data: members, error: memberError } = await supabase
        .from("ai_course_memberships")
        .select("user_id")
        .eq("course_id", course.id);

      if (memberError) throw memberError;

      if (members && members.length > 0) {
        for (const member of members) {
          const studentId = member.user_id;

          const { data: profileData } = await supabase
            .from("ai_user_learning_profiles")
            .select("team_project_count")
            .eq("user_id", studentId)
            .maybeSingle();

          const newCount = (profileData?.team_project_count || 0) + 1;

          const { error: upsertError } = await supabase
            .from("ai_user_learning_profiles")
            .upsert({ user_id: studentId, team_project_count: newCount }, { onConflict: "user_id" });

          if (upsertError) {
            console.error(`학생(${studentId}) 경험치 업데이트 실패:`, upsertError.message);
          }
        }
      }

      await loadCourses(statusFilter);
      alert("수업이 종료되었습니다. 프로젝트 평가를 할 수 있습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 종료하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <PageLoading shell message="수업 목록을 불러오는 중…" testId="courses-page-loading" />;
  }

  return (
    <div className="cc-app-shell w-full py-4 sm:py-6">
      <PageHeader
        title="수업"
        subtitle={
          statusFilter === "active"
            ? `내 강의 ${courses.length}개 · 전체 강의 ${catalog.length}개`
            : `종료된 수업 ${courses.length}개`
        }
        actions={
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
        }
      />

      {errorMessage && (
        <div role="alert" aria-live="polite" className="cc-alert-error mb-4 rounded-xl px-4 py-3 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <section className="mb-8" aria-labelledby="courses-my-heading">
        <h2 id="courses-my-heading" className="cc-section-title mb-4 text-lg font-bold">
          내 강의
        </h2>

        {courses.length === 0 ? (
          <div
            data-testid="courses-empty-state"
            className="m3-surface-card border-dashed p-8 text-center sm:p-10"
          >
            <p className="cc-text-secondary">
              {statusFilter === "active"
                ? "입장한 강의가 없습니다. 아래 전체 강의에서 강의를 선택해 입장하세요."
                : "종료된 수업이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {courses.map((course) => {
              const canManageThisCourse = canManageCourses && (isAdmin || course.professorId === user?.id);
              const canArchiveCourse = canManageThisCourse && course.status === "active";
              const isMyInstructorCourse = Boolean(
                isProfessor && user?.id && course.professorId === user.id
              );

              return (
                <CourseListCard
                  key={course.id}
                  course={course}
                  canManageCourses={canManageCourses}
                  canArchiveCourse={canArchiveCourse}
                  canManageThisCourse={canManageThisCourse}
                  isMyInstructorCourse={isMyInstructorCourse}
                  submitting={submitting}
                  onCopyCode={copyCourseCode}
                  onArchive={handleArchiveCourse}
                  onDelete={(c) => void handleDeleteCourse(c)}
                />
              );
            })}
          </div>
        )}
      </section>

      {statusFilter === "active" ? (
        <>
          <section className="mb-8" aria-labelledby="courses-search-heading">
            <h2 id="courses-search-heading" className="cc-section-title mb-4 text-lg font-bold">
              강의 검색
            </h2>
            <label htmlFor="courses-catalog-search" className="cc-label sr-only">
              강의명 검색
            </label>
            <input
              id="courses-catalog-search"
              type="search"
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
              placeholder="강의명으로 검색"
              className="cc-input w-full max-w-xl px-3 py-2 text-sm"
              data-testid="courses-catalog-search"
            />
          </section>

          <section aria-labelledby="courses-catalog-heading">
            <h2 id="courses-catalog-heading" className="cc-section-title mb-4 text-lg font-bold">
              전체 강의
            </h2>

            {catalogLoading ? (
              <p className="cc-text-secondary text-sm">전체 강의 목록을 불러오는 중…</p>
            ) : catalog.length === 0 ? (
              <div
                data-testid="courses-catalog-empty"
                className="m3-surface-card border-dashed p-8 text-center sm:p-10"
              >
                <p className="cc-text-secondary">
                  {debouncedCatalogSearch.trim()
                    ? "검색 결과가 없습니다."
                    : "등록된 전체 강의가 없습니다. 개발자가 카탈로그를 import 해주세요."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {catalog.map((entry) => {
                  const isMyInstructorCourse = Boolean(
                    isProfessor && user?.id && entry.professorId === user.id
                  );

                  return (
                    <CatalogCourseCard
                      key={entry.id}
                      entry={entry}
                      joining={catalogJoiningId === entry.id}
                      isMyInstructorCourse={isMyInstructorCourse}
                      onJoin={handleCatalogJoin}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
