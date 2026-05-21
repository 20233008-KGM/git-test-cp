import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type MyPageArchivedCourse } from "../api/supabase-api";
import EvalSchemaNotice from "../components/EvalSchemaNotice";
import { useAuth } from "../contexts/AuthContext";

export default function MyPageArchivedCoursesPage() {
  const { user, isStudent } = useAuth();
  const [courses, setCourses] = useState<MyPageArchivedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingEvalTables, setMissingEvalTables] = useState<string[]>([]);
  const [legacyPeerDisplayTable, setLegacyPeerDisplayTable] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setCourses([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api.myPage
      .getArchivedCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "과거 수업을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isStudent) return;
    let cancelled = false;
    void api.courseEvals.getSchemaStatus().then((status) => {
      if (!cancelled) {
        setMissingEvalTables(status.missingTables);
        setLegacyPeerDisplayTable(status.legacyPeerDisplayTable);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isStudent]);

  if (!isStudent) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm font-bold text-amber-900">
        학생 계정에서만 과거 수업을 조회할 수 있습니다.
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6"
      data-testid="mypage-archived-courses-page"
    >
      <div>
        <Link
          to="/app/mypage"
          className="text-sm font-bold text-[#155dfc] hover:underline"
        >
          ← 마이페이지
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[#0f172a]">과거 수업</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          종료(archived)된 수업에서 내 조원평가·교수 평가·팀 워크스페이스로 이동합니다.
        </p>
      </div>

      <EvalSchemaNotice
        missingTables={missingEvalTables}
        legacyPeerDisplayTable={legacyPeerDisplayTable}
      />

      {loading && <p className="text-sm text-[#64748b]">불러오는 중…</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </p>
      )}
      {!loading && !error && courses.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          종료된 수업 참여 기록이 없습니다.
        </p>
      )}

      <ul className="space-y-4">
        {courses.map((item) => (
          <li
            key={`${item.courseId}-${item.teamId}`}
            className="rounded-xl border border-[#dbeafe] bg-white p-5 shadow-sm"
            data-testid="mypage-archived-course-card"
          >
            <h2 className="text-lg font-black text-[#1c398e]">
              {item.courseName}
              {item.semester ? (
                <span className="ml-2 text-sm font-bold text-[#64748b]">{item.semester}</span>
              ) : null}
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">팀: {item.teamName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/app/courses/${item.courseId}/evals/my-peer-reviews`}
                className="rounded-lg border border-[#155dfc] bg-[#eff6ff] px-3 py-2 text-xs font-bold text-[#155dfc] hover:bg-[#dbeafe]"
                data-testid="mypage-archived-my-peer-reviews"
              >
                내 조원평가
              </Link>
              <Link
                to={`/app/courses/${item.courseId}/evals/professor`}
                className="rounded-lg border border-[#155dfc] bg-[#eff6ff] px-3 py-2 text-xs font-bold text-[#155dfc] hover:bg-[#dbeafe]"
                data-testid="mypage-archived-professor-evals"
              >
                교수 평가
              </Link>
              <Link
                to={`/app/courses/${item.courseId}/teams/${item.teamId}`}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                팀 워크스페이스
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
