import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { Course, PeerReviewTeammate } from "../types";

type PeerReviewDraft = { good: string[]; bad: string[]; comment: string; submitted: boolean };

export default function TeamPeerReviewPage() {
  const { courseId = "", teamId = "" } = useParams<{ courseId: string; teamId: string }>();
  const { user, isStudent } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [teammates, setTeammates] = useState<PeerReviewTeammate[]>([]);
  const [goodKeywords, setGoodKeywords] = useState<string[]>([]);
  const [badKeywords, setBadKeywords] = useState<string[]>([]);
  const [peerReviews, setPeerReviews] = useState<Record<string, PeerReviewDraft>>({});
  const [submittingPeerReviewId, setSubmittingPeerReviewId] = useState<string | null>(null);

  const myName = user?.name ?? "";
  const isArchived = course?.status === "archived";

  useEffect(() => {
    if (!courseId || !teamId) return;
    void Promise.all([
      api.courses.getById(courseId),
      api.teamDetail.getTeammates(teamId),
      api.teamDetail.getMyPeerReviews(teamId),
      api.teamDetail.getReviewKeywords(teamId),
    ]).then(([courseData, teammateData, myPeerReviews, reviewKeywords]) => {
      setCourse(courseData ?? null);
      setTeammates(teammateData);
      setGoodKeywords(reviewKeywords.good);
      setBadKeywords(reviewKeywords.bad);
      setPeerReviews(
        Object.fromEntries(
          teammateData
            .filter((member) => member.name !== myName)
            .map((member) => [
              member.id,
              myPeerReviews[member.id] ?? { good: [], bad: [], comment: "", submitted: false },
            ])
        )
      );
    });
  }, [courseId, myName, teamId]);

  const toggleKeyword = (memberId: string, type: "good" | "bad", keyword: string) => {
    setPeerReviews((prev) => {
      const review = prev[memberId];
      if (!review) return prev;
      const arr = review[type];
      return {
        ...prev,
        [memberId]: {
          ...review,
          [type]: arr.includes(keyword) ? arr.filter((k) => k !== keyword) : [...arr, keyword],
        },
      };
    });
  };

  const handleSubmitPeerReview = async (memberId: string) => {
    if (!teamId || submittingPeerReviewId || isArchived) return;
    const review = peerReviews[memberId];
    if (!review) return;

    setSubmittingPeerReviewId(memberId);
    try {
      await api.teamDetail.submitPeerReview(teamId, memberId, {
        goodKeywords: review.good,
        badKeywords: review.bad,
        comment: review.comment,
      });
      setPeerReviews((prev) => ({
        ...prev,
        [memberId]: { ...prev[memberId], submitted: true },
      }));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "동료평가 저장에 실패했습니다.");
    } finally {
      setSubmittingPeerReviewId(null);
    }
  };

  if (!isStudent) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-gray-600">학생 계정에서만 조원평가를 작성할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black" data-testid="team-peer-review-page-title">
            조원 평가
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

      {isArchived && (
        <div className="mb-6 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          종료된 수업은 읽기 전용이라 조원평가를 제출할 수 없습니다.
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 py-2">
          <span className="text-base font-medium text-black">
            {myName}
            <span className="ml-1 text-sm text-[#6a7282]">(본인)</span>
          </span>
          <span className="text-base font-medium text-black">
            기여도 :{" "}
            <span className="font-bold text-[#155dfc]">{teammates.find((m) => m.name === myName)?.contribution ?? 0}%</span>
          </span>
        </div>

        {teammates.filter((member) => member.name !== myName).map((member) => {
          const review = peerReviews[member.id];
          if (!review) return null;
          return (
            <div key={member.id} className="space-y-3 rounded-[10px] border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-black">{member.name}</span>
                <span className="text-base font-medium text-black">
                  기여도 : <span className="font-bold text-[#155dfc]">{member.contribution}%</span>
                </span>
              </div>

              <div className="rounded-[10px] bg-[#eff6ff] p-4">
                <p className="mb-2 text-sm font-medium text-black">좋아요</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {goodKeywords.map((kw) => {
                    const selected = review.good.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => toggleKeyword(member.id, "good", kw)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          selected
                            ? "border-[#155dfc] bg-[#155dfc] text-white"
                            : "border-gray-300 bg-white text-[#364153] hover:border-[#155dfc]"
                        }`}
                      >
                        {kw}
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 text-sm font-medium text-black">아쉬워요</p>
                <div className="flex flex-wrap gap-1.5">
                  {badKeywords.map((kw) => {
                    const selected = review.bad.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => toggleKeyword(member.id, "bad", kw)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          selected
                            ? "border-[#155dfc] bg-[#155dfc] text-white"
                            : "border-gray-300 bg-white text-[#364153] hover:border-[#155dfc]"
                        }`}
                      >
                        {kw}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[10px] border border-gray-200 px-4 py-3">
                <input
                  type="text"
                  value={review.comment}
                  onChange={(e) =>
                    setPeerReviews((prev) => ({
                      ...prev,
                      [member.id]: { ...prev[member.id], comment: e.target.value },
                    }))
                  }
                  placeholder="한줄 코멘트를 작성하세요"
                  className="w-full bg-transparent text-sm text-[#364153] outline-none"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  data-testid={`peer-review-submit-${member.id}`}
                  onClick={() => void handleSubmitPeerReview(member.id)}
                  disabled={submittingPeerReviewId === member.id || isArchived}
                  className={`rounded-full px-8 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                    review.submitted ? "bg-green-500" : "bg-[#155dfc] hover:bg-blue-700"
                  }`}
                >
                  {submittingPeerReviewId === member.id
                    ? "저장 중…"
                    : review.submitted
                      ? "✓ 등록됨"
                      : "등록 완료"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
