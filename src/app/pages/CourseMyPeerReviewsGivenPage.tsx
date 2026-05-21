import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, type MyPeerReviewGivenItem } from "../api/supabase-api";
import EvalSchemaNotice from "../components/EvalSchemaNotice";
import { useAuth } from "../contexts/AuthContext";

export default function CourseMyPeerReviewsGivenPage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const { isStudent } = useAuth();
  const [items, setItems] = useState<MyPeerReviewGivenItem[]>([]);
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
    void api.courseEvals
      .getMyPeerReviewsGiven(courseId)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "조회에 실패했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!isStudent) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm font-bold text-amber-900">
        학생 계정에서만 「내 조원평가」를 조회할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6" data-testid="course-my-peer-reviews-given">
      <div>
        <Link
          to={courseId ? `/app/courses/${courseId}` : "/app/courses"}
          className="text-sm font-bold text-[#155dfc] hover:underline"
        >
          ← 수업으로
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[#0f172a]">내 조원평가</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          내가 팀원에게 남긴 평가만 표시합니다. 다른 팀원이 나에게 남긴 평가는 보이지 않습니다.
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
      {!loading && !error && items.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          제출한 조원평가가 없습니다.
        </p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <article
            key={`${item.teammateName}-${index}`}
            className="rounded-[14px] border border-[#dbeafe] bg-white p-5 shadow-sm"
            data-testid="course-my-peer-review-card"
          >
            <h2 className="text-lg font-black text-[#1c398e]">{item.teammateName}</h2>
            {item.goodKeywords.length > 0 && (
              <p className="mt-2 text-sm text-emerald-800">
                <span className="font-bold">강점:</span> {item.goodKeywords.join(", ")}
              </p>
            )}
            {item.badKeywords.length > 0 && (
              <p className="mt-1 text-sm text-amber-800">
                <span className="font-bold">보완:</span> {item.badKeywords.join(", ")}
              </p>
            )}
            {item.comment && (
              <p className="mt-2 text-sm leading-6 text-gray-700">{item.comment}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
