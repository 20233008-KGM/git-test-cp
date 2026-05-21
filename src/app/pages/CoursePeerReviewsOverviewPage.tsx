import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, type CoursePeerReviewOverviewRow } from "../api/supabase-api";
import EvalSchemaNotice from "../components/EvalSchemaNotice";
import { useAuth } from "../contexts/AuthContext";

export default function CoursePeerReviewsOverviewPage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const { isProfessor, isAdmin } = useAuth();
  const [rows, setRows] = useState<CoursePeerReviewOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingEvalTables, setMissingEvalTables] = useState<string[]>([]);
  const [legacyPeerDisplayTable, setLegacyPeerDisplayTable] = useState(false);

  useEffect(() => {
    if (!courseId) return;
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
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api.coursePeerReviews
      .getOverview(courseId)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "동료평가를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!isProfessor && !isAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm font-bold text-amber-900">
        교수·관리자만 동료평가 전체 조회를 사용할 수 있습니다.
      </div>
    );
  }

  const byTeam = rows.reduce<Record<string, CoursePeerReviewOverviewRow[]>>((acc, row) => {
    const list = acc[row.teamId] ?? [];
    list.push(row);
    acc[row.teamId] = list;
    return acc;
  }, {});

  return (
    <div
      className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6"
      data-testid="course-peer-reviews-overview"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={courseId ? `/app/courses/${courseId}/teams` : "/app/courses"}
            className="text-sm font-bold text-[#155dfc] hover:underline"
          >
            ← 팀 목록
          </Link>
          <h1 className="mt-2 text-2xl font-black text-[#0f172a]">동료평가 전체 조회</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            수업 내 팀별로 학생들이 남긴 조원평가를 확인합니다.
          </p>
        </div>
      </div>

      <EvalSchemaNotice
        missingTables={missingEvalTables}
        legacyPeerDisplayTable={legacyPeerDisplayTable}
      />

      {loading && (
        <p className="text-sm font-medium text-[#64748b]">불러오는 중…</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </p>
      )}
      {!loading && !error && rows.length === 0 && (
        <p className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
          아직 제출된 동료평가가 없습니다.
        </p>
      )}

      {Object.entries(byTeam).map(([teamId, teamRows]) => (
        <section
          key={teamId}
          className="rounded-[14px] border border-[#dbeafe] bg-white p-5 shadow-sm"
          data-testid={`peer-reviews-team-${teamId}`}
        >
          <h2 className="mb-4 text-lg font-black text-[#1c398e]">{teamRows[0]?.teamName ?? teamId}</h2>
          <div className="space-y-4">
            {teamRows.map((row, index) => (
              <article
                key={`${row.reviewerName}-${row.teammateName}-${index}`}
                className="rounded-lg border border-gray-100 bg-[#f8fafc] p-4"
              >
                <p className="text-sm font-bold text-gray-900">
                  {row.reviewerName} → {row.teammateName}
                </p>
                {row.goodKeywords.length > 0 && (
                  <p className="mt-2 text-xs text-emerald-800">
                    <span className="font-bold">강점:</span> {row.goodKeywords.join(", ")}
                  </p>
                )}
                {row.badKeywords.length > 0 && (
                  <p className="mt-1 text-xs text-amber-800">
                    <span className="font-bold">보완:</span> {row.badKeywords.join(", ")}
                  </p>
                )}
                {row.comment && (
                  <p className="mt-2 text-xs leading-5 text-gray-700">{row.comment}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
