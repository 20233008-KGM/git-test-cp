import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api/supabase-api";
import { MAX_PEER_REVIEW_CUSTOM_KEYWORDS } from "../constants/peerReview";
import { useAuth } from "../contexts/AuthContext";
import type { Course, PeerReviewTeammate } from "../types";

type PeerReviewDraft = {
  good: string[];
  bad: string[];
  comment: string;
  contributionRating: number | null;
  submitted: boolean;
};

export default function TeamPeerReviewPage() {
  const { courseId = "", teamId = "" } = useParams<{ courseId: string; teamId: string }>();
  const { user, isStudent } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [teammates, setTeammates] = useState<PeerReviewTeammate[]>([]);
  const [goodKeywords, setGoodKeywords] = useState<string[]>([]);
  const [badKeywords, setBadKeywords] = useState<string[]>([]);
  const [peerReviews, setPeerReviews] = useState<Record<string, PeerReviewDraft>>({});
  const [customKeywordByMember, setCustomKeywordByMember] = useState<Record<string, string>>({});
  const [submittingPeerReviewId, setSubmittingPeerReviewId] = useState<string | null>(null);

  const myName = user?.name ?? "";
  const isArchived = course?.status === "archived";
  const isEvaluationOpen = isArchived;

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
              myPeerReviews[member.id] ?? {
                good: [],
                bad: [],
                comment: "",
                contributionRating: null,
                submitted: false,
              },
            ])
        )
      );
    });
  }, [courseId, myName, teamId]);

  const allGoodOptions = useMemo(() => {
    const custom = Object.values(peerReviews).flatMap((r) =>
      r.good.filter((kw) => !goodKeywords.includes(kw))
    );
    return [...new Set([...goodKeywords, ...custom])];
  }, [goodKeywords, peerReviews]);

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

  const addCustomKeyword = (memberId: string) => {
    const raw = customKeywordByMember[memberId]?.trim() ?? "";
    if (!raw) return;
    setPeerReviews((prev) => {
      const review = prev[memberId];
      if (!review) return prev;
      if (review.good.includes(raw)) return prev;
      if (review.good.length >= goodKeywords.length + MAX_PEER_REVIEW_CUSTOM_KEYWORDS) {
        alert(`커스텀 키워드는 최대 ${MAX_PEER_REVIEW_CUSTOM_KEYWORDS}개까지 추가할 수 있습니다.`);
        return prev;
      }
      return {
        ...prev,
        [memberId]: { ...review, good: [...review.good, raw] },
      };
    });
    setCustomKeywordByMember((prev) => ({ ...prev, [memberId]: "" }));
  };

  const markPeerReviewSuccess = (memberId: string, savedDraft?: PeerReviewDraft) => {
    setPeerReviews((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        ...(savedDraft ?? {}),
        submitted: true,
      },
    }));
    alert("동료 피드백이 성공적으로 반영되었습니다.");
  };

  const handleSubmitPeerReview = async (memberId: string) => {
    if (!teamId || submittingPeerReviewId || !isEvaluationOpen) return;
    const review = peerReviews[memberId];
    if (!review) return;

    setSubmittingPeerReviewId(memberId);
    try {
      await api.teamDetail.submitPeerReview(teamId, memberId, {
        goodKeywords: review.good,
        badKeywords: review.bad,
        comment: review.comment,
        contributionRating: review.contributionRating,
      });
      markPeerReviewSuccess(memberId);
    } catch (error) {
      console.error(error);
      try {
        const saved = await api.teamDetail.getMyPeerReviews(teamId);
        const persisted = saved[memberId];
        if (persisted?.submitted) {
          markPeerReviewSuccess(memberId, persisted);
          return;
        }
      } catch (verifyError) {
        console.warn("동료 피드백 저장 확인 실패:", verifyError);
      }
      alert(error instanceof Error ? error.message : "동료 피드백 저장에 실패했습니다.");
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

      {!isEvaluationOpen && (
        <div className="cc-alert-warning mb-6 rounded px-4 py-3 text-sm font-bold">
          교수가 수업을 종료(아카이브)한 뒤에만 조원평가를 제출할 수 있습니다.
          {course && course.status !== "archived" && (
            <span className="mt-1 block font-normal">
              현재 수업 상태: {course.status}. 수업 목록에서 「수업 종료」 후 다시 시도해 주세요.
            </span>
          )}
        </div>
      )}

      {isEvaluationOpen && teammates.filter((m) => m.name !== myName).length === 0 && (
        <div className="cc-alert-warning mb-6 rounded px-4 py-3 text-sm">
          평가할 팀원 정보를 불러오지 못했습니다. 팀 관리에서 멤버가 등록되어 있는지 확인해 주세요.
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 py-2">
          <span className="text-base font-medium text-black">
            {myName}
            <span className="ml-1 text-sm cc-text-secondary">(본인)</span>
          </span>
        </div>

        {teammates
          .filter((member) => member.name !== myName)
          .map((member) => {
            const review = peerReviews[member.id];
            if (!review) return null;
            const memberGoodOptions = [
              ...allGoodOptions,
              ...review.good.filter((kw) => !allGoodOptions.includes(kw)),
            ];
            return (
              <div key={member.id} className="space-y-3 rounded-[10px] border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-medium text-black">{member.name}</span>
                  <label className="flex items-center gap-2 text-sm text-black">
                    기여도
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={review.contributionRating ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const next = raw === "" ? null : Number(raw);
                        setPeerReviews((prev) => ({
                          ...prev,
                          [member.id]: { ...prev[member.id], contributionRating: next },
                        }));
                      }}
                      data-testid={`peer-review-contribution-${member.id}`}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                    />
                    %
                  </label>
                </div>

                <div className="rounded-[10px] bg-[#eff6ff] p-4">
                  <p className="mb-2 text-sm font-medium text-black">강점 키워드</p>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {memberGoodOptions.map((kw) => {
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
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={customKeywordByMember[member.id] ?? ""}
                      onChange={(e) =>
                        setCustomKeywordByMember((prev) => ({
                          ...prev,
                          [member.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomKeyword(member.id);
                        }
                      }}
                      placeholder="커스텀 키워드 입력"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                      data-testid={`peer-review-custom-input-${member.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => addCustomKeyword(member.id)}
                      className="rounded-lg border border-[#155dfc] px-3 py-1.5 text-xs font-bold text-[#155dfc]"
                    >
                      추가
                    </button>
                  </div>
                  {badKeywords.length > 0 && (
                    <>
                      <p className="mb-2 text-sm font-medium text-black">보완 키워드 (선택)</p>
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
                    </>
                  )}
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
                    disabled={submittingPeerReviewId === member.id || !isEvaluationOpen}
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
