import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { Course } from "../types";

export default function CourseAnnouncementComposePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isProfessor, isAdmin } = useAuth();
  const canManage = isProfessor || isAdmin;

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dDay, setDDay] = useState(7);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    void api.courses.getById(courseId).then((data) => setCourse(data ?? null));
  }, [courseId]);

  if (!courseId) {
    return <p className="p-6 text-gray-600">수업을 선택해 주세요.</p>;
  }

  if (!canManage) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        공지 작성은 교수만 할 수 있습니다.
      </div>
    );
  }

  const listPath = `/app/courses/${courseId}/announcements`;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <Link to={listPath} className="text-sm font-bold text-[#155dfc] hover:underline">
          ← 공지게시판
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[#155dfc] sm:text-3xl">공지 작성</h1>
        {course && (
          <p className="mt-1 text-sm text-gray-600">
            [{course.semester}] {course.name}
          </p>
        )}
      </div>

      {course && course.status !== "active" && (
        <div className="cc-alert-warning rounded-lg px-4 py-3 text-sm">
          종료(아카이브)된 수업에는 새 공지를 등록할 수 없습니다.
        </div>
      )}

      <form
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (course?.status !== "active") return;
          setSaving(true);
          try {
            await api.announcements.create(courseId, { title, description, dDay });
            navigate(listPath);
          } catch (error) {
            alert(error instanceof Error ? error.message : "공지 등록에 실패했습니다.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="flex flex-col gap-3">
          <input
            data-testid="announcement-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <textarea
            data-testid="announcement-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="내용"
            rows={6}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            D-
            <input
              type="number"
              min={0}
              value={dDay}
              onChange={(e) => setDDay(Number(e.target.value))}
              className="w-20 rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              data-testid="announcement-submit"
              disabled={saving || course?.status !== "active"}
              className="rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "등록 중…" : "공지 등록"}
            </button>
            <Link
              to={listPath}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              취소
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
