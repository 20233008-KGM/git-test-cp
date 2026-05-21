import React, { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { Course, CourseStatus, CreateCourseInput } from "../types";

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
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuthenticated, isProfessor, isAdmin, isStudent, user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const canManageCourses = isProfessor || isAdmin;
  const openCreateModal = () => {
    setForm({ ...emptyForm, code: generateAutoCourseCode() });
    setShowCreateModal(true);
  };

  const loadCourses = async (status: CourseStatus) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await api.courses.getAll({ status });
      setCourses(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses(statusFilter);
  }, [statusFilter]);

  const updateForm = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateStage = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, stageIndex) => (stageIndex === index ? value : stage)),
    }));
  };

  const addStage = () => {
    setForm((prev) => ({ ...prev, stages: [...prev.stages, ""] }));
  };

  const removeStage = (index: number) => {
    setForm((prev) => ({ ...prev, stages: prev.stages.filter((_, stageIndex) => stageIndex !== index) }));
  };

  const handleCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.courses.create({
        ...form,
        code: form.code.trim(),
        stages: form.stages.filter((stage) => stage.trim()),
      });
      setForm(emptyForm);
      setShowCreateModal(false);
      setStatusFilter("active");
      await loadCourses("active");
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
      await loadCourses(statusFilter);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 삭제하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveCourse = async (course: Course) => {
    if (!window.confirm(`'${course.name}' 수업을 종료하고 아카이브로 전환할까요?`)) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.courses.archive(course.id);
      await loadCourses(statusFilter);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 종료하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-gray-600">{"\uB85C\uB529 \uC911..."}</p>
      </div>
    );
  }

  if (!isAuthenticated) return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{"\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4"}</div>;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            {statusFilter === "active" ? "현재 진행 수업" : "종료된 수업"}
          </h1>
          <p className="mt-1 text-gray-600">{"\uCD1D"} {courses.length}{"\uAC1C \uACFC\uBAA9"}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {(["active", "archived"] as CourseStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                  statusFilter === status ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status === "active" ? "현재진행수업" : "종료된 수업"}
              </button>
            ))}
          </div>

          {canManageCourses && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              + 수업 생성
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {isStudent && statusFilter === "active" && (
        <form
          onSubmit={handleJoinCourse}
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-end sm:gap-4 sm:p-5"
        >
          <div className="flex-1">
            <p className="mb-1 text-sm font-bold text-gray-900">수업 코드로 등록</p>
            <p className="mb-2 text-xs text-gray-600">교수에게 받은 코드를 입력하세요 (예: WEB-2026)</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="수업 코드"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={joining}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:shrink-0"
          >
            {joining ? "등록 중..." : "수업 등록"}
          </button>
        </form>
      )}

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center sm:p-10">
          <p className="text-gray-600">등록된 수업이 없습니다.</p>
          {isStudent && statusFilter === "active" && (
            <form onSubmit={handleJoinCourse} className="mx-auto mt-6 max-w-sm space-y-3 text-left">
              <p className="text-sm text-gray-500">수업 코드로 등록하세요 (예: WEB-2026, DB-2026)</p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="수업 코드"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={joining}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {joining ? "등록 중..." : "수업 등록"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {courses.map((course) => {
            const canManageThisCourse = canManageCourses && (isAdmin || course.professorId === user?.id);
            const canArchiveCourse = canManageThisCourse && course.status === "active";

            return (
          <Link
            key={course.id}
            to={`/app/courses/${course.id}`}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-black text-gray-900 sm:text-xl">
                {course.name}
              </h2>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">{course.code}</span>
                {canManageCourses && course.status === "active" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      copyCourseCode(course.code);
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    코드 복사
                  </button>
                )}
              </div>
            </div>

            {course.status === "archived" && (
              <span className="mb-3 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                아카이브
              </span>
            )}

            {course.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {course.description}
              </p>
            )}

            <div className="space-y-1 text-sm">
              <p className="text-gray-600">{"\uAD50\uC218"}: {course.professor}</p>
              <p className="text-gray-600">{"\uC2DC\uAC04"}: {course.schedule}</p>
              {course.room && (
                <p className="text-gray-600">{"\uAC15\uC758\uC2E4"}: {course.room}</p>
              )}
              <p className="text-gray-600">
                {"\uC218\uAC15\uC0DD"}: {course.students}
                {course.maxStudents && `/${course.maxStudents}`}{"\uBA85"}
              </p>
              <p className="text-gray-600">{"\uD300\uD50C \uC2A4\uD14C\uC774\uC9C0"}: {course.stageCount ?? course.stages?.length ?? 0}{"\uAC1C"}</p>
            </div>

            {canArchiveCourse && (
              <button
                type="button"
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleArchiveCourse(course);
                }}
                className="mt-4 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                수업 종료
              </button>
            )}
            {canManageThisCourse && (
              <button
                type="button"
                data-testid={`course-delete-${course.id}`}
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleDeleteCourse(course);
                }}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                수업 삭제
              </button>
            )}
          </Link>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setShowCreateModal(false)}
        >
          <form
            onSubmit={handleCreateCourse}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">수업 생성</h2>
                <p className="mt-1 text-sm text-gray-500">수업 기본 정보와 팀플 스테이지를 입력합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg px-3 py-1 text-xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-gray-700">
                수업명
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                수업 코드
                <div className="mt-1 flex gap-2">
                  <input
                    required
                    value={form.code}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-normal outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm("code", generateAutoCourseCode())}
                    className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                  >
                    재생성
                  </button>
                </div>
              </label>
              <label className="text-sm font-bold text-gray-700">
                학기
                <input
                  required
                  value={form.semester}
                  onChange={(event) => updateForm("semester", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                일정
                <input
                  type="date"
                  required
                  value={form.schedule}
                  onChange={(event) => updateForm("schedule", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                강의실
                <input
                  value={form.room}
                  onChange={(event) => updateForm("room", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                최대 인원
                <input
                  type="number"
                  min={0}
                  value={form.maxStudents ?? ""}
                  onChange={(event) => updateForm("maxStudents", event.target.value ? Number(event.target.value) : undefined)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-bold text-gray-700">
              설명
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
              />
            </label>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">팀플 스테이지</p>
                <button type="button" onClick={addStage} className="text-sm font-bold text-blue-600 hover:underline">
                  + 단계 추가
                </button>
              </div>
              <div className="space-y-2">
                {form.stages.map((stage, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      required={index === 0}
                      value={stage}
                      onChange={(event) => updateStage(index, event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      placeholder={`${index + 1}단계`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStage(index)}
                      disabled={form.stages.length === 1}
                      className="rounded-lg border border-gray-200 px-3 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "저장 중..." : "생성"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
