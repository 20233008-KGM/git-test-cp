import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, type MyProfessorEvalInCourse } from "../api/supabase-api";
import EvalSchemaNotice from "../components/EvalSchemaNotice";
import { useAuth } from "../contexts/AuthContext";

export default function CourseProfessorEvalsPage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const { isStudent } = useAuth();
  const [evalData, setEvalData] = useState<MyProfessorEvalInCourse | null>(null);
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
      .getMyProfessorEvals(courseId)
      .then((data) => {
        if (!cancelled) setEvalData(data);
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
        학생 계정에서만 「교수 평가」를 조회할 수 있습니다.
      </div>
    );
  }

  const hasEval =
    evalData &&
    (evalData.studentComment ||
      evalData.projectCompletion ||
      evalData.projectProblemSolving ||
      evalData.projectHolistic);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6" data-testid="course-professor-evals-student">
      <div>
        <Link
          to={courseId ? `/app/courses/${courseId}` : "/app/courses"}
          className="text-sm font-bold text-[#155dfc] hover:underline"
        >
          ← 수업으로
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[#0f172a]">교수 평가</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          교수님이 남긴 나에 대한 평가와 팀 프로젝트 전반 평가입니다.
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
      {!loading && !error && !evalData && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          이 수업에 배정된 팀이 없습니다.
        </p>
      )}
      {!loading && !error && evalData && !hasEval && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          아직 교수 평가가 등록되지 않았습니다.
        </p>
      )}

      {evalData && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[#dbeafe] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-[#64748b]">팀 · 프로젝트</p>
            <h2 className="mt-1 text-lg font-black text-[#1c398e]">
              {evalData.teamName} — {evalData.projectTitle}
            </h2>
          </div>

          {evalData.studentComment && (
            <section
              className="rounded-[14px] border border-[#fff7ed] bg-[#fffbeb] p-5"
              data-testid="course-professor-eval-student"
            >
              <h3 className="text-base font-black text-[#c2410c]">학생 개인 평가</h3>
              <p className="mt-2 text-sm leading-6 text-gray-800">{evalData.studentComment}</p>
            </section>
          )}

          {(evalData.projectCompletion ||
            evalData.projectProblemSolving ||
            evalData.projectHolistic) && (
            <section
              className="rounded-[14px] border border-[#eff6ff] bg-[#f8fbff] p-5"
              data-testid="course-professor-eval-project"
            >
              <h3 className="text-base font-black text-[#155dfc]">프로젝트 평가</h3>
              {evalData.projectCompletion && (
                <p className="mt-2 text-sm text-gray-800">
                  <span className="font-bold">완성도:</span> {evalData.projectCompletion}
                </p>
              )}
              {evalData.projectProblemSolving && (
                <p className="mt-2 text-sm text-gray-800">
                  <span className="font-bold">문제 해결:</span> {evalData.projectProblemSolving}
                </p>
              )}
              {evalData.projectHolistic && (
                <p className="mt-2 text-sm leading-6 text-gray-800">
                  <span className="font-bold">총체 평가:</span> {evalData.projectHolistic}
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
