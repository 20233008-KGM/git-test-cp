import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { Announcement, Course } from "../types";

export default function CourseAnnouncementsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isProfessor, isAdmin } = useAuth();
  const canManage = isProfessor || isAdmin;

  const [course, setCourse] = useState<Course | null>(null);
  const isActiveCourse = course?.status === "active";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dDay, setDDay] = useState(7);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!courseId) return;
    const [courseData, announcementData] = await Promise.all([
      api.courses.getById(courseId),
      api.announcements.getAll(courseId),
    ]);
    setCourse(courseData ?? null);
    setAnnouncements(announcementData);
  };

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    void reload().finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId) {
    return <p className="p-6 text-gray-600">수업을 선택해 주세요.</p>;
  }

  if (!canManage) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        공지 작성은 교수만 할 수 있습니다. 팀 페이지 하단에서 최신 공지를 확인하세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#155dfc] sm:text-3xl">공지게시판</h1>
      {course && (
        <p className="text-sm text-gray-600">
          [{course.semester}] {course.name}
        </p>
      )}

      {!isActiveCourse && (
        <div className="cc-alert-warning rounded-lg px-4 py-3 text-sm">
          종료(아카이브)된 수업에는 새 공지를 등록할 수 없습니다. 아래 목록에서 기존 공지를 확인하세요.
        </div>
      )}

      <form
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await api.announcements.create(courseId, { title, description, dDay });
            setTitle("");
            setDescription("");
            setDDay(7);
            await reload();
          } catch (error) {
            alert(error instanceof Error ? error.message : "공지 등록에 실패했습니다.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <h2 className="mb-4 text-lg font-bold text-gray-900">새 공지 작성</h2>
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
            rows={4}
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
          <button
            type="submit"
            data-testid="announcement-submit"
            disabled={saving || !isActiveCourse}
            className="w-full rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "등록 중…" : "공지 등록"}
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">등록된 공지</h2>
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중…</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 공지가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {announcements.map((ann, index) => (
              <li
                key={`${ann.title}-${index}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="font-bold text-gray-900">{ann.title}</p>
                <p className="mt-1 text-sm text-gray-600">{ann.description}</p>
                <span className="mt-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                  D-{ann.dDay}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
