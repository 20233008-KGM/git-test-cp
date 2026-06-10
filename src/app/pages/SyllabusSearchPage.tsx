import { useState, useCallback, useEffect } from "react";
import { api } from "../api/supabase-api";
import type { CourseSyllabus } from "../types";
import PageLoading from "../components/layout/PageLoading";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

export default function SyllabusSearchPage() {
  const [courseName, setCourseName] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [results, setResults] = useState<CourseSyllabus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setLoading(true);
      setError(null);
      try {
        const data = await api.syllabi.search({ courseName, department, semester });
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "검색에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [courseName, department, semester]
  );

  useEffect(() => {
    void handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">강의계획서 검색</h1>

      <form
        onSubmit={handleSearch}
        className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-bold text-gray-700">
            과목명
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="예: 자료구조"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--cc-primary)] focus:outline-none"
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            학과
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="예: 컴퓨터공학과"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--cc-primary)] focus:outline-none"
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            학기
            <input
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="예: 2026-1"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--cc-primary)] focus:outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-[var(--cc-primary)] px-6 py-2 text-sm font-bold text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-60"
        >
          {loading ? "검색 중…" : "검색"}
        </button>
      </form>

      {loading && <PageLoading message="검색 중…" />}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {results !== null && !loading && (
        <>
          <p className="mb-4 text-sm text-gray-500">검색 결과 {results.length}건</p>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-900">{s.courseName}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {s.courseCode && <span>{s.courseCode}</span>}
                        {s.department && <span>{s.department}</span>}
                        {s.semester && <span>{s.semester}</span>}
                        {s.grade && <span>{s.grade}학년</span>}
                        {s.professor && <span>담당: {s.professor}</span>}
                      </div>
                      <p className="mt-2 text-xs cc-text-muted">
                        {s.fileName} · {formatBytes(s.fileSize)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a
                        href={s.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        보기
                      </a>
                      <a
                        href={s.publicUrl}
                        download={s.fileName}
                        className="rounded-lg bg-[var(--cc-primary)] px-3 py-1.5 text-xs font-medium text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)]"
                      >
                        다운로드
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
