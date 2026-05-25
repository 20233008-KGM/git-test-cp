import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api/supabase-api";
import AppModal from "../components/layout/AppModal";
import PageLoading from "../components/layout/PageLoading";
import { useAuth } from "../contexts/AuthContext";
import type { Announcement, Course } from "../types";

export default function CourseAnnouncementsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isProfessor, isAdmin } = useAuth();
  const canManage = isProfessor || isAdmin;

  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selected, setSelected] = useState<Announcement | null>(null);
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

  const composePath = `/app/courses/${courseId}/announcements/compose`;
  const isActiveCourse = course?.status === "active";

  return (
    <div className="w-full min-w-0 space-y-6" data-testid="course-announcements-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#155dfc] sm:text-3xl">공지게시판</h1>
          {course && (
            <p className="mt-1 text-sm text-gray-600">
              [{course.semester}] {course.name}
            </p>
          )}
        </div>
        {canManage && (
          <Link
            to={composePath}
            data-testid="announcement-compose-link"
            className={`inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold ${
              isActiveCourse
                ? "bg-[#155dfc] text-white hover:bg-blue-700"
                : "pointer-events-none bg-gray-200 text-gray-500"
            }`}
            aria-disabled={!isActiveCourse}
          >
            공지 작성
          </Link>
        )}
      </div>

      {!canManage && (
        <p className="text-sm text-gray-600">
          공지 목록을 확인할 수 있습니다. 작성은 담당 교수만 가능합니다.
        </p>
      )}

      {canManage && !isActiveCourse && (
        <div className="cc-alert-warning rounded-lg px-4 py-3 text-sm">
          종료(아카이브)된 수업에는 새 공지를 등록할 수 없습니다. 아래에서 기존 공지를 확인하세요.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">등록된 공지</h2>
        {loading ? (
          <PageLoading layout="inline" size="sm" message="공지를 불러오는 중…" />
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 공지가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {announcements.map((ann) => (
              <li key={ann.id ?? ann.title}>
                <button
                  type="button"
                  data-testid={`announcement-card-${ann.id ?? "row"}`}
                  onClick={() => setSelected(ann)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-bold text-gray-900">{ann.title}</p>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                      D-{ann.dDay}
                    </span>
                  </div>
                  {ann.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{ann.description}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AppModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        ariaLabel="공지 상세"
        testId="announcement-detail-modal"
      >
        {selected && (
          <div className="space-y-4 p-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                D-{selected.dDay}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {selected.description?.trim() || "내용이 없습니다."}
            </p>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              onClick={() => setSelected(null)}
            >
              닫기
            </button>
          </div>
        )}
      </AppModal>
    </div>
  );
}
