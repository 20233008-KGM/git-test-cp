import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/mock-data";
import type { ChatMessage, PeerReviewStudent, PeerReviewTeammate, TroubleshootingLog } from "../types";

export default function TeamDetailPage() {
  const { id, teamId, courseId } = useParams<{ id?: string; teamId?: string; courseId?: string }>();
  const selectedTeamId = teamId ?? id ?? "";
  const { isProfessor, isStudent, user } = useAuth();
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showStudentEvalModal, setShowStudentEvalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [problemInput, setProblemInput] = useState("");
  const [planInput, setPlanInput] = useState("");

  // 피드백 상태
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([]);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedbackCustomModal, setShowFeedbackCustomModal] = useState(false);
  const [customFeedbackText, setCustomFeedbackText] = useState("");
  const [customFeedbackDraft, setCustomFeedbackDraft] = useState("");

  const toggleFeedback = (label: string) => {
    setSelectedFeedbacks((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  // 채팅 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatAnon, setChatAnon] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChatModal) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatModal]);

  const myName = isProfessor ? "성보경 교수님" : (user?.name ?? "류지원");

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        sender: chatAnon ? "익명" : myName,
        text,
        time: timeStr,
        isMine: true,
        isAnon: chatAnon,
      },
    ]);
    setChatInput("");
  };

  // 학생 평가용 교수 입력 상태
  const [studentEvalInputs, setStudentEvalInputs] = useState<Record<string, string>>({
    s1: "", s2: "", s3: "", s4: "",
  });

  const [allStudents, setAllStudents] = useState<PeerReviewStudent[]>([]);
  const [goodKeywords, setGoodKeywords] = useState<string[]>([]);
  const [badKeywords, setBadKeywords] = useState<string[]>([]);
  const [teammates, setTeammates] = useState<PeerReviewTeammate[]>([]);
  const [troubleshootingLogs, setTroubleshootingLogs] = useState<TroubleshootingLog[]>([]);

  const [peerReviews, setPeerReviews] = useState<
    Record<string, { good: string[]; bad: string[]; comment: string; submitted: boolean }>
  >({});

  const toggleKeyword = (memberId: string, type: "good" | "bad", keyword: string) => {
    setPeerReviews((prev) => {
      const arr = prev[memberId][type];
      return {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [type]: arr.includes(keyword) ? arr.filter((k) => k !== keyword) : [...arr, keyword],
        },
      };
    });
  };

  useEffect(() => {
    if (!selectedTeamId) return;

    Promise.all([
      api.teamDetail.getFeedbackOptions(selectedTeamId),
      api.teamDetail.getChatMessages(selectedTeamId),
      api.teamDetail.getPeerReviewStudents(selectedTeamId),
      api.teamDetail.getReviewKeywords(selectedTeamId),
      api.teamDetail.getTeammates(selectedTeamId),
      api.teamDetail.getTroubleshootingLogs(selectedTeamId),
    ]).then(([feedbackData, chatData, reviewStudents, reviewKeywords, teammateData, logData]) => {
      setFeedbackOptions(feedbackData);
      setSelectedFeedbacks(feedbackData.slice(0, 2));
      setChatMessages(chatData);
      setAllStudents(reviewStudents);
      setGoodKeywords(reviewKeywords.good);
      setBadKeywords(reviewKeywords.bad);
      setTeammates(teammateData);
      setTroubleshootingLogs(logData);
      setPeerReviews(
        Object.fromEntries(
          teammateData.map((member) => [member.id, { good: [], bad: [], comment: "", submitted: false }])
        )
      );
    });
  }, [selectedTeamId]);

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <div className="mx-auto w-full max-w-[1504px] px-4 py-6 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-10">
          <Link
            to={courseId ? `/app/courses/${courseId}/teams` : "/app/teams"}
            className="text-[#155dfc] text-base font-medium hover:underline mb-4 inline-block"
          >
            ← 뒤로가기
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="break-words text-2xl font-black text-[#155dfc] sm:text-[30px]">{selectedTeamId}</h1>
            {isProfessor ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowStudentEvalModal(true)}
                  className="bg-white border-2 border-[#155dfc] text-[#155dfc] px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-50 transition-colors"
                >
                  학생 평가
                </button>
                <button
                  onClick={() => setShowEvalModal(true)}
                  className="bg-[#155dfc] text-white px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-700 transition-colors"
                >
                  프로젝트 평가
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowPeerReviewModal(true)}
                  className="bg-white border-2 border-[#155dfc] text-[#155dfc] px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-50 transition-colors"
                >
                  조원 평가
                </button>
                <button
                  onClick={() => setShowRetrospectiveModal(true)}
                  className="bg-[#155dfc] text-white px-6 py-2.5 rounded-[10px] font-bold text-base hover:bg-blue-700 transition-colors"
                >
                  회고록 작성
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI 통합 진행상황 요약 */}
        <div className="bg-gradient-to-r from-[#bfd3ff] to-[#e8e9ff] border border-[#c6d2ff] rounded-[14px] p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#312c85] mb-2">
            ✨ AI 통합 진행상황 요약
          </h3>
          <p className="text-sm text-[#372aac] leading-relaxed">
            현재 배포된 <span className="font-bold">[웹페이지 v1.0]</span>과
            교수님께 전달한{" "}
            <span className="font-bold">[구현 애로사항]</span>을 종합한 결과:
            <br />팀은 프론트엔드 UI 퍼블리싱은 90% 이상 완료했으나, 백엔드 DB와의
            연결에서 CORS 에러 문제를 겪고 있습니다. ~~한 방법으로 문제를
            해결해볼 계획이며, 전체 프로젝트 진행률은 약 70%로 추정됩니다.
          </p>
        </div>

        {/* 2열 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 왼쪽: 프로젝트 산출물 & 공간 */}
          <div className="bg-white rounded-[14px] shadow-md border border-[rgba(0,0,0,0.1)] p-5">
            <h2 className="text-lg font-bold text-[#1e2939] mb-6">
              📁 프로젝트 산출물 & 공간
            </h2>

            {/* 배포된 서비스 */}
            <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[10px] p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌐</span>
                  <div>
                    <p className="text-sm font-bold text-[#1c398e]">
                      실제 배포된 서비스 (v1.0)
                    </p>
                    <a
                      href="https://campus-connect.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#155dfc] hover:underline"
                    >
                      https://campus-connect.vercel.app
                    </a>
                  </div>
                </div>
                <button className="bg-[#155dfc] text-white text-xs font-medium px-4 py-2 rounded-[10px] hover:bg-blue-700 transition-colors shadow-sm">
                  바로가기 ↗
                </button>
              </div>
            </div>

            {/* 프로젝트 스크린샷 */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex h-[137px] items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] shadow-md">
                  <div className="bg-white px-4 py-1 rounded-[10px]">
                    <p className="text-lg font-semibold text-black">1조 - FIGMA</p>
                  </div>
              </div>
              <div className="flex h-[137px] items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#ede9fe] to-[#c4b5fd] shadow-md">
                  <div className="bg-white px-4 py-1 rounded-[10px]">
                    <p className="text-lg font-semibold text-black">1조 - 중간발표</p>
                  </div>
              </div>
              <div className="flex h-[137px] items-center justify-center overflow-hidden rounded-[10px] bg-[#eee] shadow-md">
                  <div className="bg-white px-4 py-1 rounded-[10px]">
                    <p className="text-lg font-semibold text-black">1조 - 기말발표</p>
                  </div>
              </div>
            </div>

            {/* 파일 다운로드 */}
            <div className="space-y-3">
              <div className="bg-[#f9fafb] border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💻</span>
                  <span className="text-sm text-[#1e2939]">source_code_final.zip</span>
                </div>
                <button className="bg-[#e5e7eb] text-[#1e2939] text-xs font-medium px-3 py-2 rounded hover:bg-gray-300 transition-colors">
                  ⬇️ 다운로드
                </button>
              </div>
              <div className="bg-[#f9fafb] border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📄</span>
                  <span className="text-sm text-[#1e2939]">주제발표_초안.pdf</span>
                </div>
              </div>

              {/* 학생 전용: 파일 업로드 버튼 */}
              {isStudent && (
                <button className="w-full bg-[#f9fafb] border border-dashed border-[rgba(0,0,0,0.1)] rounded py-2.5 text-[#4a5565] font-medium hover:bg-gray-100 transition-colors">
                  + 링크 / 파일 업로드
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽: 트러블슈팅 로그 */}
          <div className="bg-white rounded-[14px] shadow-md border border-[rgba(0,0,0,0.1)] p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-[#1c398e]">
                🛠️ 트러블슈팅 로그
              </h2>
              <span className="text-xs text-[#6a7282]">문제 해결 과정 및 피드백</span>
            </div>

            <div className="bg-[rgba(239,246,255,0.3)] border border-[#dbeafe] rounded-[10px] p-4 space-y-4 max-h-[565px] overflow-y-auto">
              {/* 문제 입력 폼 (교수만 표시) */}
              {isProfessor && (
                <div className="bg-white border-2 border-[rgba(174,174,174,0.3)] rounded-[10px] shadow-md p-4 mb-4">
                  <p className="text-xs text-red-600 font-medium mb-2">
                    !!!문제 발견!!!
                  </p>
                  <p className="text-xs text-red-600 mb-2">
                    🚨 문제: 서버 코드에서 DB를 불러오는데 문제 발생.
                  </p>
                  <div className="bg-[#f0f0f0] rounded-[5px] p-2 mb-2">
                    <input
                      type="text"
                      placeholder="해결을 원할 시 해결 계획을 입력하세요."
                      className="w-full bg-transparent text-xs text-[#a8a8a8] outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#155dfc] text-white text-xs font-semibold py-1.5 rounded-[5px] hover:bg-blue-700 transition-colors">
                      문제 등록
                    </button>
                    <button className="flex-1 bg-[#b60000] text-white text-xs font-semibold py-1.5 rounded-[5px] hover:bg-red-700 transition-colors">
                      문제 무시
                    </button>
                  </div>
                </div>
              )}

              {/* 트러블슈팅 로그 목록 */}
              <div className="space-y-4">
                {troubleshootingLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-white rounded-[10px] shadow-sm p-4 ${
                      log.status === "in-progress"
                        ? "border border-[#fff085]"
                        : "border border-[#e5e7eb]"
                    }`}
                  >
                    {/* 헤더 */}
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        {log.status === "resolved" ? (
                          <span className="bg-[#dcfce7] border border-[#b9f8cf] text-[#008236] text-[10px] font-bold px-2 py-1 rounded-full">
                            🟢 해결 완료
                          </span>
                        ) : (
                          <span className="bg-[#fef9c2] border border-[#fff085] text-[#a65f00] text-[10px] font-bold px-2 py-1 rounded-full">
                            🟡 해결 중
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#1e2939]">
                          {log.author}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#99a1af]">
                        {log.timestamp}
                      </span>
                    </div>

                    {/* 내용 */}
                    <div className="space-y-2">
                      <p className="text-xs">
                        <span className="font-bold text-[#fb2c36]">🚨 문제:</span>
                        <span className="text-[#364153]"> {log.problem}</span>
                      </p>
                      {log.plan && (
                        <p className="text-xs">
                          <span className="font-bold text-[#2b7fff]">🏃 계획:</span>
                          <span className="text-[#364153]"> {log.plan}</span>
                        </p>
                      )}
                      {log.solution && (
                        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded p-3">
                          <p className="text-xs font-bold text-[#016630] mb-1">
                            ✅ 해결 방법:
                          </p>
                          <p className="text-xs text-[#016630]">{log.solution}</p>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="mt-3 flex flex-col gap-2 border-t border-[#f3f4f6] pt-3 sm:flex-row sm:items-center">
                      <button
                        onClick={() => setShowChatModal(true)}
                        className="bg-[#155dfc] text-white text-xs font-bold px-4 py-2 rounded-[20px] hover:bg-blue-700 transition-colors"
                      >
                        채팅방 이동
                      </button>
                      {log.status === "in-progress" && isProfessor && (
                        <>
                          <button className="bg-[#f3f4f6] text-[#364153] text-[11px] font-medium px-3 py-2 rounded hover:bg-gray-200 transition-colors">
                            💬 대댓글 달기
                          </button>
                          <button className="bg-[#f0fdf4] border border-[#b9f8cf] text-[#008236] text-[11px] font-medium px-3 py-2 rounded hover:bg-green-100 transition-colors">
                            ✅ 해결 완료 처리
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 학생 전용: 문제 보고 폼 */}
              {isStudent && (
                <div className="bg-[rgba(239,246,255,0.3)] border border-[#bedbff] rounded-[10px] p-3 shadow-sm">
                  <input
                    type="text"
                    value={problemInput}
                    onChange={(e) => setProblemInput(e.target.value)}
                    placeholder="🚨 어떤 문제(에러)를 겪고 있나요?"
                    className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-xs text-[#1e2939] placeholder:text-[rgba(30,41,57,0.5)] mb-3"
                  />
                  <input
                    type="text"
                    value={planInput}
                    onChange={(e) => setPlanInput(e.target.value)}
                    placeholder="🏃 원인을 어떻게 파악하고, 어떻게 해결할 계획인가요?"
                    className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-xs text-[#1e2939] placeholder:text-[rgba(30,41,57,0.5)] mb-3"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 text-xs text-[#6a7282]">
                      <input type="checkbox" className="w-3.5 h-3.5" />
                      <span>익명</span>
                    </label>
                    <button className="bg-[#0f172a] text-white px-4 py-2 rounded text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm">
                      기록 남기기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 피드백 섹션 */}
        <div className="bg-white rounded-[14px] border border-[rgba(0,0,0,0.1)] shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-[#1e2939] text-center mb-2">
            이 팀의 웹 서비스, 어떻게 생각하시나요?
          </h3>
          <p className="text-sm text-[#6a7282] text-center mb-6">
            배포된 링크를 확인해 보고, 피드백을 남겨주세요.
          </p>

          {feedbackSubmitted ? (
            /* ── 완료 상태 ── */
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">✅</span>
                <p className="text-base font-bold text-[#1e2939]">피드백이 완료되었습니다!</p>
                <p className="text-sm text-[#6a7282]">소중한 의견 감사합니다.</p>
              </div>
              {/* 선택된 키워드 요약 */}
              <div className="flex flex-wrap justify-center gap-2">
                {[...selectedFeedbacks, ...(customFeedbackText ? [`"${customFeedbackText}"`] : [])].map((label) => (
                  <span
                    key={label}
                    className="bg-[#eff6ff] border border-[#bedbff] text-[#1c398e] text-sm px-4 py-1.5 rounded-[14px] font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setFeedbackSubmitted(false);
                  setCustomFeedbackText("");
                  setCustomFeedbackDraft("");
                }}
                className="mt-2 rounded-[14px] border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-[#364153] transition-colors hover:bg-gray-50 sm:px-8"
              >
                🔄 피드백 다시하기
              </button>
            </div>
          ) : (
            /* ── 입력 상태 ── */
            <>
              <div className="flex justify-center gap-3 flex-wrap mb-4">
                {feedbackOptions.map((option) => (
                  <button
                    key={option}
                    className={`${
                      selectedFeedbacks.includes(option)
                        ? "bg-[#155dfc] text-white border-[#155dfc]"
                        : "bg-white text-[#364153] border-[rgba(0,0,0,0.1)]"
                    } px-6 py-2 rounded-[14px] border font-medium hover:opacity-90 transition-all`}
                    onClick={() => toggleFeedback(option)}
                  >
                    {option}
                  </button>
                ))}
                <button
                  className={`${
                    customFeedbackText
                      ? "bg-[#155dfc] text-white border-[#155dfc]"
                      : "bg-white text-[#848484] border-[rgba(0,0,0,0.1)]"
                  } px-6 py-2 rounded-[14px] border font-medium hover:opacity-90 transition-all`}
                  onClick={() => {
                    setCustomFeedbackDraft(customFeedbackText);
                    setShowFeedbackCustomModal(true);
                  }}
                >
                  {customFeedbackText ? `"${customFeedbackText}"` : "| 기타 입력"}
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  disabled={selectedFeedbacks.length === 0 && !customFeedbackText}
                  className="rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400 sm:px-8"
                  onClick={() => setFeedbackSubmitted(true)}
                >
                  완료
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 채팅 모달 */}
      {showChatModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.83)] p-4"
          onClick={() => setShowChatModal(false)}
        >
          <div
            className="bg-white rounded-[14px] shadow-2xl max-w-[680px] w-full flex flex-col"
            style={{ height: "min(720px, 90vh)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[14px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <h2 className="text-base font-bold text-black">채팅방</h2>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-[#f9fafb]">
              {chatMessages.map((msg) =>
                msg.isMine ? (
                  /* 내 메시지 — 오른쪽 정렬 */
                  <div key={msg.id} className="flex flex-col items-end">
                    <p className="text-xs font-medium text-[#6a7282] mb-1">
                      {msg.sender}
                    </p>
                    <div className="bg-[#155dfc] rounded-[14px] rounded-tr-[4px] px-4 py-2.5 max-w-[80%] shadow-sm">
                      <p className="text-sm text-white leading-relaxed break-words">
                        {msg.text}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#b0b8c1] mt-1">{msg.time}</p>
                  </div>
                ) : (
                  /* 상대 메시지 — 왼쪽 정렬 */
                  <div key={msg.id} className="flex flex-col items-start">
                    <p className="text-xs font-medium text-black mb-1">
                      {msg.sender}
                    </p>
                    <div className="bg-white border border-[#e5e7eb] rounded-[14px] rounded-tl-[4px] px-4 py-2.5 max-w-[80%] shadow-sm">
                      <p className="text-sm text-black leading-relaxed break-words">
                        {msg.text}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#b0b8c1] mt-1">{msg.time}</p>
                  </div>
                )
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* 입력 폼 */}
            <div className="px-5 py-4 border-t border-gray-200 bg-white rounded-b-[14px] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1.5 text-xs text-[#6a7282] flex-shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-[#155dfc]"
                    checked={chatAnon}
                    onChange={(e) => setChatAnon(e.target.checked)}
                  />
                  익명
                </label>
                <div className="flex-1 bg-[#f3f4f6] rounded-full px-4 py-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder="메시지를 입력하세요."
                    className="flex-1 bg-transparent text-sm text-[#1e2939] placeholder:text-[#9d9d9d] outline-none"
                  />
                </div>
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="bg-[#155dfc] disabled:bg-[#c7d9f8] text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                  aria-label="전송"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 rotate-90">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 평가 모달 (교수만) */}
      {isProfessor && showEvalModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.81)] p-4"
          onClick={() => setShowEvalModal(false)}
        >
          <div
            className="bg-white rounded-[10px] shadow-2xl max-w-[1191px] w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-[25px] font-bold text-black">
                학생 및 프로젝트 평가
              </h2>
              <button
                onClick={() => setShowEvalModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 text-xl font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="px-16 py-12 space-y-8">
              {/* 1. 작업 완성도 */}
              <div className="space-y-4">
                <h3 className="text-[25px] font-medium text-black text-center">
                  작업 완성도
                </h3>
                <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-4">
                  {/* 설명란 */}
                  <div className="bg-white rounded-[5px] shadow-md p-4 mb-4">
                    <p className="text-[17px] text-black">
                      코드 및 웹 사이트 보러 가기
                    </p>
                  </div>
                  {/* 평가 입력란 */}
                  <div className="bg-white rounded-[5px] shadow-md p-4">
                    <textarea
                      placeholder="평가를 입력하세요."
                      className="w-full h-[96px] text-[17px] text-[#595959] placeholder:text-[#595959] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. 문제 해결력 */}
              <div className="space-y-4">
                <h3 className="text-[25px] font-medium text-black text-center">
                  문제 해결력
                </h3>
                <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-4">
                  {/* 문제 해결 목록 */}
                  <div className="bg-white rounded-[5px] shadow-md p-4 mb-4">
                    <p className="text-[17px] text-black">
                      문제 해결 목록: DB문제 해결, 서버 구동 문제 해결
                    </p>
                  </div>
                  {/* 평가 입력란 */}
                  <div className="bg-white rounded-[5px] shadow-md p-4">
                    <textarea
                      placeholder="평가를 입력하세요."
                      className="w-full h-[98px] text-[17px] text-[#595959] placeholder:text-[#595959] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. 총체적 평가 */}
              <div className="space-y-4">
                <h3 className="text-[25px] font-medium text-black text-center">
                  총체적 평가
                </h3>
                <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-4">
                  {/* 평가 입력란 (큰 텍스트 영역) */}
                  <div className="bg-white rounded-[5px] shadow-md p-4">
                    <textarea
                      placeholder="평가를 입력하세요."
                      className="w-full h-[333px] text-[17px] text-[#595959] placeholder:text-[#595959] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 완료 버튼 */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setShowEvalModal(false)}
                  className="bg-[#155dfc] text-white px-8 py-2 rounded-[10px] text-[17px] font-bold hover:bg-blue-700 transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 학생 평가 모달 (교수만) */}
      {isProfessor && showStudentEvalModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.81)] p-4"
          onClick={() => setShowStudentEvalModal(false)}
        >
          <div
            className="bg-white rounded-[10px] shadow-2xl max-w-[780px] w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-lg font-bold text-black">학생 및 프로젝트 평가</h2>
              <button
                onClick={() => setShowStudentEvalModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 text-xl font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-7">
              {allStudents.map((student) => (
                <div key={student.id} className="space-y-3">
                  {/* 이름 + 평균 기여도 */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-black">{student.name}</span>
                    <span className="text-base font-medium text-black">
                      평균 기여도 :{" "}
                      <span className="text-[#155dfc] font-bold">{student.contribution}%</span>
                    </span>
                  </div>

                  {/* 역할 및 동료평가 참고 카드 */}
                  <div className="bg-[#eff6ff] rounded-[10px] shadow-sm p-4 space-y-3">
                    <p className="text-sm font-medium text-black">역할 및 동료평가 - 참고</p>

                    {/* 키워드 + 코멘트 영역 */}
                    <div className="bg-white border-2 border-[rgba(59,128,255,0.32)] rounded-[10px] p-3 space-y-2">
                      {/* 피어 키워드 칩 */}
                      <div className="flex flex-wrap gap-1.5">
                        {student.peerKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="bg-[#155dfc] text-white text-xs px-3 py-1.5 rounded-[10px] shadow-sm"
                          >
                            {kw}
                          </span>
                        ))}
                        {/* 피어 코멘트: 흰 배경 칩 */}
                        <span className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-[10px] shadow-sm">
                          {student.peerComment}
                        </span>
                      </div>

                      {/* 역할 칩 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {student.roles.map((role) => (
                          <span
                            key={role}
                            className="bg-[#155dfc] text-white text-xs px-3 py-1.5 rounded-[10px] shadow-sm"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 교수 평가 입력 */}
                  <div className="bg-white border border-gray-200 rounded-[10px] px-4 py-3">
                    <textarea
                      value={studentEvalInputs[student.id]}
                      onChange={(e) =>
                        setStudentEvalInputs((prev) => ({
                          ...prev,
                          [student.id]: e.target.value,
                        }))
                      }
                      placeholder="평가를 입력하세요."
                      rows={2}
                      className="w-full text-sm text-[#364153] placeholder:text-[#9d9d9d] outline-none bg-transparent resize-none"
                    />
                  </div>
                </div>
              ))}

              {/* 다음 버튼 */}
              <div className="flex justify-center pt-2 pb-2">
                <button
                  onClick={() => setShowStudentEvalModal(false)}
                  className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 회고록 모달 (학생만) */}
      {isStudent && showRetrospectiveModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.83)] p-4"
          onClick={() => setShowRetrospectiveModal(false)}
        >
          <div
            className="bg-white rounded-[10px] shadow-2xl max-w-[1191px] w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-[25px] font-bold text-black">회고록</h2>
              <button
                onClick={() => setShowRetrospectiveModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 text-xl font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="px-16 py-6 space-y-8">
              {/* 본인이 한 역할 */}
              <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-6">
                <p className="text-[20px] font-medium text-black text-center mb-4">
                  본인이 한 역할
                </p>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4 mb-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    자동연동
                  </p>
                  <p className="text-[17px] text-black">
                    백엔드 DB오류 해결/ 중간발표 초안 등록
                  </p>
                </div>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    직접입력
                  </p>
                  <input
                    type="text"
                    placeholder="직접 입력하세요."
                    className="w-full text-[17px] text-[#9d9d9d] placeholder:text-[#9d9d9d] outline-none"
                  />
                </div>
              </div>

              {/* 잘한점 */}
              <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-6">
                <p className="text-[20px] font-medium text-black text-center mb-4">
                  잘한점
                </p>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4 mb-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    자동연동
                  </p>
                  <p className="text-[17px] text-black">
                    어려운 오류를 스스로 해결함
                  </p>
                </div>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    직접입력
                  </p>
                  <input
                    type="text"
                    placeholder="직접 입력하세요."
                    className="w-full text-[17px] text-[#9d9d9d] placeholder:text-[#9d9d9d] outline-none"
                  />
                </div>
              </div>

              {/* 아쉬운 점 */}
              <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-6">
                <p className="text-[20px] font-medium text-black text-center mb-4">
                  아쉬운 점
                </p>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4 mb-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    자동연동
                  </p>
                  <p className="text-[17px] text-black">
                    백엔드 문제 해결 미완료
                  </p>
                </div>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    직접입력
                  </p>
                  <input
                    type="text"
                    placeholder="직접 입력하세요."
                    className="w-full text-[17px] text-[#9d9d9d] placeholder:text-[#9d9d9d] outline-none"
                  />
                </div>
              </div>

              {/* 발전한 점 */}
              <div className="bg-[#eff6ff] rounded-[10px] shadow-md p-6">
                <p className="text-[20px] font-medium text-black text-center mb-4">
                  발전한 점
                </p>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4 mb-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    자동연동
                  </p>
                  <p className="text-[17px] text-black">
                    데이터 연결에 능숙해짐
                  </p>
                </div>
                <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4">
                  <p className="text-[17px] font-medium text-black mb-3">
                    직접입력
                  </p>
                  <input
                    type="text"
                    placeholder="직접 입력하세요."
                    className="w-full text-[17px] text-[#9d9d9d] placeholder:text-[#9d9d9d] outline-none"
                  />
                </div>
              </div>

              {/* 완료 버튼 */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setShowRetrospectiveModal(false)}
                  className="bg-[#155dfc] text-white px-16 py-2 rounded-[10px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] text-[17px] font-medium hover:bg-blue-700 transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 조원 평가 모달 (학생만) */}
      {isStudent && showPeerReviewModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.83)] p-4"
          onClick={() => setShowPeerReviewModal(false)}
        >
          <div
            className="bg-white rounded-[10px] shadow-2xl max-w-[780px] w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-lg font-bold text-black">동료평가</h2>
              <button
                onClick={() => setShowPeerReviewModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 text-xl font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* 본인 정보 (읽기 전용) */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-base font-medium text-black">류지원<span className="text-[#6a7282] text-sm ml-1">(본인)</span></span>
                <span className="text-base font-medium text-black">
                  기여도 :{" "}
                  <span className="text-[#155dfc] font-bold">30%</span>
                </span>
              </div>

              {/* 각 팀원 평가 */}
              {teammates.map((member) => {
                const review = peerReviews[member.id];
                return (
                  <div key={member.id} className="space-y-3">
                    {/* 팀원 이름 + 기여도 */}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-black">{member.name}</span>
                      <span className="text-base font-medium text-black">
                        기여도 :{" "}
                        <span className="text-[#155dfc] font-bold">{member.contribution}%</span>
                      </span>
                    </div>

                    {/* 키워드 등록 카드 */}
                    <div className="bg-[#eff6ff] rounded-[10px] shadow-sm p-4 space-y-3">
                      <p className="text-sm font-medium text-black">키워드 등록</p>

                      {/* 키워드 그리드 */}
                      <div className="bg-white border-2 border-[rgba(59,128,255,0.32)] rounded-[10px] p-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* 좋아요 */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-black">좋아요</p>
                            <div className="flex flex-wrap gap-1.5">
                              {goodKeywords.map((kw) => {
                                const selected = review.good.includes(kw);
                                return (
                                  <button
                                    key={kw}
                                    onClick={() => toggleKeyword(member.id, "good", kw)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                      selected
                                        ? "bg-[#155dfc] text-white border-[#155dfc]"
                                        : "bg-white text-[#364153] border-gray-300 hover:border-[#155dfc]"
                                    }`}
                                  >
                                    {kw}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 아쉬워요 */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-black">아쉬워요</p>
                            <div className="flex flex-wrap gap-1.5">
                              {badKeywords.map((kw) => {
                                const selected = review.bad.includes(kw);
                                return (
                                  <button
                                    key={kw}
                                    onClick={() => toggleKeyword(member.id, "bad", kw)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                      selected
                                        ? "bg-[#155dfc] text-white border-[#155dfc]"
                                        : "bg-white text-[#364153] border-gray-300 hover:border-[#155dfc]"
                                    }`}
                                  >
                                    {kw}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 등록 완료 버튼 */}
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            setPeerReviews((prev) => ({
                              ...prev,
                              [member.id]: { ...prev[member.id], submitted: true },
                            }))
                          }
                          className={`px-8 py-2 rounded-full text-sm font-bold transition-colors ${
                            review.submitted
                              ? "bg-green-500 text-white"
                              : "bg-[#155dfc] text-white hover:bg-blue-700"
                          }`}
                        >
                          {review.submitted ? "✓ 등록됨" : "등록 완료"}
                        </button>
                      </div>
                    </div>

                    {/* 한줄 코멘트 */}
                    <div className="bg-white border border-gray-200 rounded-[10px] px-4 py-3">
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
                        className="w-full text-sm text-[#364153] placeholder:text-[#9d9d9d] outline-none bg-transparent"
                      />
                    </div>
                  </div>
                );
              })}

              {/* 다음 버튼 */}
              <div className="flex justify-center pt-2 pb-2">
                <button
                  onClick={() => setShowPeerReviewModal(false)}
                  className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 커스텀 모달 */}
      {showFeedbackCustomModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.83)] p-4"
          onClick={() => setShowFeedbackCustomModal(false)}
        >
          <div
            className="bg-white rounded-[10px] shadow-2xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-lg font-bold text-black">피드백 작성</h2>
              <button
                onClick={() => setShowFeedbackCustomModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 text-xl font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* 피드백 입력란 */}
              <div className="bg-white border border-gray-200 rounded-[10px] px-4 py-3">
                <textarea
                  value={customFeedbackDraft}
                  onChange={(e) => setCustomFeedbackDraft(e.target.value)}
                  placeholder="피드백을 입력하세요."
                  rows={4}
                  className="w-full text-sm text-[#364153] placeholder:text-[#9d9d9d] outline-none bg-transparent resize-none"
                />
              </div>

              {/* 등록 버튼 */}
              <div className="flex justify-center pt-2 pb-2">
                <button
                  onClick={() => {
                    setCustomFeedbackText(customFeedbackDraft);
                    setShowFeedbackCustomModal(false);
                  }}
                  className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}