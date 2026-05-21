import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { Course, TeamRetrospectiveSections } from "../types";

const emptyRetrospectiveSections = (): TeamRetrospectiveSections => ({
  role: { auto: "", custom: "" },
  strengths: { auto: "", custom: "" },
  regrets: { auto: "", custom: "" },
  growth: { auto: "", custom: "" },
});

export default function TeamRetrospectivePage() {
  const { courseId = "", teamId = "" } = useParams<{ courseId: string; teamId: string }>();
  const { isStudent } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [retrospectiveSections, setRetrospectiveSections] = useState<TeamRetrospectiveSections>(
    emptyRetrospectiveSections
  );
  const [retrospectiveSubmitted, setRetrospectiveSubmitted] = useState(false);
  const [submittingRetrospective, setSubmittingRetrospective] = useState(false);

  useEffect(() => {
    if (!courseId || !teamId) return;
    void Promise.all([
      api.courses.getById(courseId),
      api.teamDetail.getRetrospectiveDraft(teamId),
    ]).then(([courseData, draft]) => {
      setCourse(courseData ?? null);
      setRetrospectiveSections(draft.sections);
      setRetrospectiveSubmitted(draft.submitted);
    });
  }, [courseId, teamId]);

  const isArchived = course?.status === "archived";
  const isEvaluationOpen = isArchived;

  const updateRetrospectiveCustom = (key: keyof TeamRetrospectiveSections, custom: string) => {
    setRetrospectiveSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], custom },
    }));
  };

  const handleSubmitRetrospective = async () => {
    if (!teamId || submittingRetrospective || !isEvaluationOpen) return;
    setSubmittingRetrospective(true);
    try {
      await api.teamDetail.submitRetrospective(teamId, retrospectiveSections);
      setRetrospectiveSubmitted(true);
      alert("회고록이 저장되었습니다.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "회고록 저장에 실패했습니다.");
    } finally {
      setSubmittingRetrospective(false);
    }
  };

  if (!isStudent) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-gray-600">학생 계정에서만 회고록을 작성할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1191px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black" data-testid="team-retrospective-page-title">
            회고록 작성
          </h1>
          <p className="mt-1 text-sm text-gray-600">{teamId}</p>
        </div>
        <Link
          to={`/app/courses/${courseId}/teams/${teamId}`}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          팀 상세로 돌아가기
        </Link>
      </div>

      {!isEvaluationOpen && (
        <div className="mb-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          교수가 수업을 종료(아카이브)한 뒤에만 회고록을 작성할 수 있습니다.
        </div>
      )}

      <div className="space-y-6">
        {(
          [
            { key: "role" as const, title: "본인이 한 역할" },
            { key: "strengths" as const, title: "잘한점" },
            { key: "regrets" as const, title: "아쉬운 점" },
            { key: "growth" as const, title: "발전한 점" },
          ] as const
        ).map(({ key, title }) => (
          <div key={key} className="rounded-[10px] bg-[#eff6ff] p-6 shadow-md">
            <p className="mb-4 text-xl font-medium text-black">{title}</p>
            <div className="mb-4 rounded bg-white p-4 shadow">
              <p className="mb-2 text-sm font-semibold text-black">자동연동</p>
              <p className="whitespace-pre-wrap text-sm text-black">{retrospectiveSections[key].auto || "—"}</p>
            </div>
            <div className="rounded bg-white p-4 shadow">
              <p className="mb-2 text-sm font-semibold text-black">직접입력</p>
              <input
                type="text"
                value={retrospectiveSections[key].custom}
                onChange={(e) => updateRetrospectiveCustom(key, e.target.value)}
                placeholder="직접 입력하세요."
                disabled={!isEvaluationOpen}
                data-testid={`retrospective-custom-${key}`}
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          data-testid="retrospective-submit"
          disabled={submittingRetrospective || !isEvaluationOpen}
          onClick={() => void handleSubmitRetrospective()}
          className="rounded-[10px] bg-[#155dfc] px-12 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submittingRetrospective ? "저장 중…" : retrospectiveSubmitted ? "수정 저장" : "완료"}
        </button>
      </div>
    </div>
  );
}
