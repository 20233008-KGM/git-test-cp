import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { api, buildTeamProgressSummary } from "../api/supabase-api";
import { supabase } from "../supabase";
import type {
  ChatMessage,
  Course,
  PeerReviewStudent,
  PeerReviewTeammate,
  TeamDeliverable,
  TeamRetrospectiveSections,
  TeamSubmissionFeedbackItem,
  TeamSubmissionRetrospectiveItem,
  TeamSubmissionPeerReviewItem,
  TroubleshootingLog,
} from "../types";

export default function TeamDetailPage() {
  const { id, teamId, courseId } = useParams<{ id?: string; teamId?: string; courseId?: string }>();
  const selectedTeamId = teamId ?? id ?? "";
  const { isProfessor, isStudent, isAdmin, user } = useAuth();
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showStudentEvalModal, setShowStudentEvalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [problemInput, setProblemInput] = useState("");
  const [planInput, setPlanInput] = useState("");
  const [course, setCourse] = useState<Course | null>(null);

  // 피드백 상태
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([]);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
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
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChatModal) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatModal]);

  const myName = user?.name ?? (isProfessor ? "교수" : "학생");
  const isArchived = course?.status === "archived";

  const handleCreateTroubleshootingLog = async () => {
    if (!selectedTeamId || !problemInput.trim()) {
      alert("문제 내용을 입력해주세요.");
      return;
    }

    setSubmittingLog(true);
    try {
      const created = await api.teamDetail.createTroubleshootingLog(selectedTeamId, {
        problem: problemInput,
        plan: planInput,
        solution: solutionInput,
      });
      setTroubleshootingLogs((prev) => [...prev, created]);
      setProblemInput("");
      setPlanInput("");
      setSolutionInput("");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "트러블슈팅 등록에 실패했습니다.");
    } finally {
      setSubmittingLog(false);
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || !selectedTeamId || sendingChat || isArchived) return;

    setSendingChat(true);
    try {
      const created = await api.teamDetail.sendChatMessage(selectedTeamId, {
        text,
        isAnon: chatAnon,
      });
      setChatMessages((prev) => (prev.some((msg) => msg.id === created.id) ? prev : [...prev, created]));
      setChatInput("");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "메시지 전송에 실패했습니다.");
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    if (!showChatModal || !selectedTeamId) return;

    const channel = supabase
      .channel(`team-chat-${selectedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_team_detail_chat_messages",
          filter: `team_id=eq.${selectedTeamId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender: string;
            text: string;
            display_time: string;
            is_anon: boolean;
          };
          const isAnon = row.is_anon;
          const isMine = !isAnon && row.sender === myName;

          setChatMessages((prev) => {
            if (prev.some((msg) => msg.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                sender: row.sender,
                text: row.text,
                time: row.display_time,
                isMine,
                isAnon,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [showChatModal, selectedTeamId, myName]);

  const [studentEvalInputs, setStudentEvalInputs] = useState<Record<string, string>>({});
  const [projectEval, setProjectEval] = useState({
    completionComment: "",
    problemSolvingComment: "",
    holisticComment: "",
  });
  const [savingProfessorEval, setSavingProfessorEval] = useState(false);
  const [teamSubmissionFeedbacks, setTeamSubmissionFeedbacks] = useState<
    TeamSubmissionFeedbackItem[]
  >([]);
  const [teamSubmissionRetrospectives, setTeamSubmissionRetrospectives] = useState<
    TeamSubmissionRetrospectiveItem[]
  >([]);
  const [teamSubmissionPeerReviews, setTeamSubmissionPeerReviews] = useState<
    TeamSubmissionPeerReviewItem[]
  >([]);

  const [allStudents, setAllStudents] = useState<PeerReviewStudent[]>([]);
  const [goodKeywords, setGoodKeywords] = useState<string[]>([]);
  const [badKeywords, setBadKeywords] = useState<string[]>([]);
  const [teammates, setTeammates] = useState<PeerReviewTeammate[]>([]);
  const [troubleshootingLogs, setTroubleshootingLogs] = useState<TroubleshootingLog[]>([]);
  const [solutionInput, setSolutionInput] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogForm, setEditLogForm] = useState({ problem: "", plan: "", solution: "" });
  const [deliverables, setDeliverables] = useState<TeamDeliverable[]>([]);
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const deliverableInputRef = useRef<HTMLInputElement>(null);

  const canEditLog = (log: TroubleshootingLog) => log.author === myName;
  const canResolveLog = (log: TroubleshootingLog) =>
    log.status === "in-progress" &&
    !isArchived &&
    (log.author === myName || isProfessor || isAdmin);

  const canUploadDeliverable = !isArchived && (isStudent || isProfessor || isAdmin);

  const teamProgressSummary = useMemo(
    () => buildTeamProgressSummary(deliverables, troubleshootingLogs),
    [deliverables, troubleshootingLogs]
  );

  const projectEvalAutoHints = useMemo(() => {
    const fileList =
      deliverables.length > 0
        ? deliverables.map((item) => item.fileName).join(", ")
        : "업로드된 산출물 없음";
    const solvedList =
      troubleshootingLogs
        .filter((log) => log.status === "resolved")
        .map((log) => log.problem)
        .filter(Boolean)
        .join(" / ") || "해결 완료된 트러블슈팅 없음";
    return { files: fileList, solved: solvedList };
  }, [deliverables, troubleshootingLogs]);

  const handleSaveStudentEvals = async () => {
    if (!selectedTeamId || savingProfessorEval) return;
    setSavingProfessorEval(true);
    try {
      await Promise.all(
        Object.entries(studentEvalInputs).map(([studentRowId, comment]) =>
          api.teamDetail.saveProfessorStudentEval(selectedTeamId, studentRowId, comment)
        )
      );
      setShowStudentEvalModal(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "학생 평가 저장에 실패했습니다.");
    } finally {
      setSavingProfessorEval(false);
    }
  };

  const handleSaveProjectEval = async () => {
    if (!selectedTeamId || savingProfessorEval) return;
    setSavingProfessorEval(true);
    try {
      await api.teamDetail.saveProfessorProjectEval(selectedTeamId, projectEval);
      setShowEvalModal(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "프로젝트 평가 저장에 실패했습니다.");
    } finally {
      setSavingProfessorEval(false);
    }
  };

  const handleDeliverableUpload = async (fileList: FileList | null) => {
    if (!selectedTeamId || !fileList?.[0]) return;

    setUploadingDeliverable(true);
    try {
      const created = await api.teamDetail.uploadDeliverable(selectedTeamId, fileList[0]);
      setDeliverables((prev) => [created, ...prev]);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "파일 업로드에 실패했습니다.");
    } finally {
      setUploadingDeliverable(false);
      if (deliverableInputRef.current) deliverableInputRef.current.value = "";
    }
  };

  const handleDeleteDeliverable = async (deliverable: TeamDeliverable) => {
    if (!window.confirm(`"${deliverable.fileName}" 파일을 삭제할까요?`)) return;

    setUploadingDeliverable(true);
    try {
      await api.teamDetail.deleteDeliverable(deliverable.id);
      setDeliverables((prev) => prev.filter((item) => item.id !== deliverable.id));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "파일 삭제에 실패했습니다.");
    } finally {
      setUploadingDeliverable(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const startEditLog = (log: TroubleshootingLog) => {
    setEditingLogId(log.id);
    setEditLogForm({
      problem: log.problem,
      plan: log.plan ?? "",
      solution: log.solution ?? "",
    });
  };

  const handleUpdateLog = async (e: React.FormEvent, logId: string) => {
    e.preventDefault();
    setSubmittingLog(true);
    try {
      const updated = await api.teamDetail.updateTroubleshootingLog(logId, {
        problem: editLogForm.problem,
        plan: editLogForm.plan,
        solution: editLogForm.solution,
      });
      setTroubleshootingLogs((prev) => prev.map((log) => (log.id === logId ? updated : log)));
      setEditingLogId(null);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "수정에 실패했습니다.");
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("이 트러블슈팅 기록을 삭제할까요?")) return;

    setSubmittingLog(true);
    try {
      await api.teamDetail.deleteTroubleshootingLog(logId);
      setTroubleshootingLogs((prev) => prev.filter((log) => log.id !== logId));
      if (editingLogId === logId) setEditingLogId(null);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleResolveLog = async (log: TroubleshootingLog) => {
    const solution = window.prompt("해결 방법을 입력하세요.", log.solution ?? "");
    if (solution === null) return;
    if (!solution.trim()) {
      alert("해결 방법을 입력해주세요.");
      return;
    }

    setSubmittingLog(true);
    try {
      const updated = await api.teamDetail.resolveTroubleshootingLog(log.id, solution);
      setTroubleshootingLogs((prev) => prev.map((item) => (item.id === log.id ? updated : item)));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "해결 완료 처리에 실패했습니다.");
    } finally {
      setSubmittingLog(false);
    }
  };

  const [peerReviews, setPeerReviews] = useState<
    Record<string, { good: string[]; bad: string[]; comment: string; submitted: boolean }>
  >({});
  const [submittingPeerReviewId, setSubmittingPeerReviewId] = useState<string | null>(null);

  const emptyRetrospectiveSections = (): TeamRetrospectiveSections => ({
    role: { auto: "", custom: "" },
    strengths: { auto: "", custom: "" },
    regrets: { auto: "", custom: "" },
    growth: { auto: "", custom: "" },
  });
  const [retrospectiveSections, setRetrospectiveSections] = useState<TeamRetrospectiveSections>(
    emptyRetrospectiveSections
  );
  const [retrospectiveSubmitted, setRetrospectiveSubmitted] = useState(false);
  const [submittingRetrospective, setSubmittingRetrospective] = useState(false);

  const handleSubmitRetrospective = async () => {
    if (!selectedTeamId || submittingRetrospective || isArchived) return;

    setSubmittingRetrospective(true);
    try {
      await api.teamDetail.submitRetrospective(selectedTeamId, retrospectiveSections);
      setRetrospectiveSubmitted(true);
      setShowRetrospectiveModal(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "회고록 저장에 실패했습니다.");
    } finally {
      setSubmittingRetrospective(false);
    }
  };

  const updateRetrospectiveCustom = (
    key: keyof TeamRetrospectiveSections,
    custom: string
  ) => {
    setRetrospectiveSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], custom },
    }));
  };

  const handleSubmitFeedback = async () => {
    if (!selectedTeamId || submittingFeedback || isArchived) return;
    if (selectedFeedbacks.length === 0 && !customFeedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      await api.teamDetail.submitFeedback(selectedTeamId, {
        selectedOptions: selectedFeedbacks,
        customText: customFeedbackText,
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "피드백 저장에 실패했습니다.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitPeerReview = async (memberId: string) => {
    if (!selectedTeamId || submittingPeerReviewId) return;
    const review = peerReviews[memberId];
    if (!review) return;

    setSubmittingPeerReviewId(memberId);
    try {
      await api.teamDetail.submitPeerReview(selectedTeamId, memberId, {
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
      api.teamDetail.getMyFeedback(selectedTeamId),
      api.teamDetail.getChatMessages(selectedTeamId),
      api.teamDetail.getPeerReviewStudents(selectedTeamId),
      api.teamDetail.getMyPeerReviews(selectedTeamId),
      api.teamDetail.getReviewKeywords(selectedTeamId),
      api.teamDetail.getTeammates(selectedTeamId),
      api.teamDetail.getTroubleshootingLogs(selectedTeamId),
      api.teamDetail.getDeliverables(selectedTeamId),
      api.teamDetail.getRetrospectiveDraft(selectedTeamId),
    ]).then(
      ([
        feedbackData,
        myFeedback,
        chatData,
        reviewStudents,
        myPeerReviews,
        reviewKeywords,
        teammateData,
        logData,
        deliverableData,
        retrospectiveDraft,
      ]) => {
        setFeedbackOptions(feedbackData);
        if (myFeedback) {
          setSelectedFeedbacks(myFeedback.selectedOptions);
          setCustomFeedbackText(myFeedback.customText ?? "");
          setFeedbackSubmitted(true);
        } else {
          setSelectedFeedbacks(feedbackData.slice(0, 2));
          setCustomFeedbackText("");
          setFeedbackSubmitted(false);
        }
        setChatMessages(chatData);
        setAllStudents(reviewStudents);
        setStudentEvalInputs((prev) => {
          const next = { ...prev };
          for (const student of reviewStudents) {
            if (!(student.id in next)) next[student.id] = "";
          }
          return next;
        });
        setGoodKeywords(reviewKeywords.good);
        setBadKeywords(reviewKeywords.bad);
        setTeammates(teammateData);
        setTroubleshootingLogs(logData);
        setDeliverables(deliverableData);
        setRetrospectiveSections(retrospectiveDraft.sections);
        setRetrospectiveSubmitted(retrospectiveDraft.submitted);
        const reviewerName = user?.name ?? "";
        setPeerReviews(
          Object.fromEntries(
            teammateData
              .filter((member) => member.name !== reviewerName)
              .map((member) => [
                member.id,
                myPeerReviews[member.id] ?? { good: [], bad: [], comment: "", submitted: false },
              ])
          )
        );
      }
    );
  }, [selectedTeamId, user?.name]);

  useEffect(() => {
    if (!courseId) return;

    api.courses.getById(courseId).then((courseData) => {
      setCourse(courseData ?? null);
    });
  }, [courseId]);

  useEffect(() => {
    if (!selectedTeamId || (!isProfessor && !isAdmin)) return;

    void Promise.all([
      api.teamDetail.getProfessorStudentEvals(selectedTeamId),
      api.teamDetail.getProfessorProjectEval(selectedTeamId),
      api.teamDetail.getTeamSubmissionFeedbacks(selectedTeamId),
      api.teamDetail.getTeamSubmissionRetrospectives(selectedTeamId),
      api.teamDetail.getTeamSubmissionPeerReviews(selectedTeamId),
    ]).then(([studentEvals, savedProjectEval, feedbacks, retrospectives, peerReviews]) => {
      setStudentEvalInputs((prev) => ({ ...prev, ...studentEvals }));
      setProjectEval(savedProjectEval);
      setTeamSubmissionFeedbacks(feedbacks);
      setTeamSubmissionRetrospectives(retrospectives);
      setTeamSubmissionPeerReviews(peerReviews);
    });
  }, [selectedTeamId, isProfessor, isAdmin]);

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
            {isArchived ? (
              <span className="rounded-[10px] border border-gray-200 bg-white px-6 py-2.5 text-base font-bold text-gray-500">
                종료된 수업: 읽기 전용
              </span>
            ) : isProfessor ? (
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
                  {retrospectiveSubmitted ? "회고록 수정" : "회고록 작성"}
                </button>
              </div>
            )}
          </div>
        </div>

        {isArchived && (
          <div className="mb-6 rounded-[14px] border border-gray-200 bg-white px-5 py-4 text-sm font-bold text-gray-600 shadow-sm">
            이 수업은 아카이브 상태입니다. 평가, 업로드, 문제 등록, 피드백 작성은 비활성화됩니다.
          </div>
        )}

        {/* AI 통합 진행상황 요약 */}
        <div className="bg-gradient-to-r from-[#bfd3ff] to-[#e8e9ff] border border-[#c6d2ff] rounded-[14px] p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#312c85] mb-2">
            ✨ AI 통합 진행상황 요약
          </h3>
          <p className="text-sm text-[#372aac] leading-relaxed">{teamProgressSummary}</p>
        </div>

        {(isProfessor || isAdmin) && (
          <div
            className="mb-6 rounded-[14px] border border-[#c6d2ff] bg-white p-5 shadow-sm"
            data-testid="professor-team-submissions"
          >
            <h3 className="text-base font-bold text-[#1e3a6e] mb-3">팀 제출 현황</h3>
            <p className="text-sm text-gray-600 mb-4">
              피드백 {teamSubmissionFeedbacks.length}건 · 동료평가{" "}
              {teamSubmissionPeerReviews.length}건 · 회고록 {teamSubmissionRetrospectives.length}건
              {teamSubmissionFeedbacks.length === 0 &&
                teamSubmissionPeerReviews.length === 0 &&
                teamSubmissionRetrospectives.length === 0 &&
                " (번들 v2 SQL 미실행 시 비어 있을 수 있습니다)"}
            </p>
            {teamSubmissionFeedbacks.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">피드백</p>
                {teamSubmissionFeedbacks.map((item) => (
                  <div
                    key={`fb-${item.authorName}`}
                    className="rounded-lg border border-gray-100 bg-[#f8fafc] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[#155dfc]">{item.authorName}</span>
                    {item.selectedOptions.length > 0 && (
                      <span className="text-gray-700"> — {item.selectedOptions.join(", ")}</span>
                    )}
                    {item.customText && (
                      <p className="mt-1 text-gray-600">{item.customText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {teamSubmissionPeerReviews.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">동료평가</p>
                {teamSubmissionPeerReviews.map((item) => (
                  <div
                    key={`pr-${item.teammateId}-${item.goodKeywords.join("-")}`}
                    className="rounded-lg border border-gray-100 bg-[#f8fafc] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[#155dfc]">{item.teammateName}</span>
                    {item.goodKeywords.length > 0 && (
                      <span className="text-gray-700"> · 👍 {item.goodKeywords.join(", ")}</span>
                    )}
                    {item.badKeywords.length > 0 && (
                      <span className="text-gray-600"> · 👎 {item.badKeywords.join(", ")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {teamSubmissionRetrospectives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">회고록</p>
                {teamSubmissionRetrospectives.map((item) => (
                  <div
                    key={`retro-${item.authorName}`}
                    className="rounded-lg border border-gray-100 bg-[#f8fafc] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[#155dfc]">{item.authorName}</span>
                    <p className="mt-1 text-gray-600 line-clamp-2">
                      {item.sections.role.custom ||
                        item.sections.role.auto ||
                        "내용 없음"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

            {/* 팀 산출물 파일 */}
            <div className="space-y-3">
              {deliverables.length === 0 ? (
                <p className="rounded-[10px] border border-dashed border-gray-300 bg-[#f9fafb] px-3 py-4 text-center text-sm text-[#6a7282]">
                  업로드된 산출물이 없습니다.
                </p>
              ) : (
                deliverables.map((item) => {
                  const canDelete =
                    !isArchived &&
                    (user?.id === item.uploaderId || isProfessor || isAdmin);

                  return (
                    <div
                      key={item.id}
                      className="bg-[#f9fafb] border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0">📄</span>
                          <span className="text-sm font-medium text-[#1e2939] truncate">{item.fileName}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#6a7282]">
                          {item.uploaderName} · {formatFileSize(item.fileSize)} ·{" "}
                          {new Date(item.createdAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <a
                          href={item.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={item.fileName}
                          className="bg-[#e5e7eb] text-[#1e2939] text-xs font-medium px-3 py-2 rounded hover:bg-gray-300 transition-colors"
                        >
                          다운로드
                        </a>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDeliverable(item)}
                            disabled={uploadingDeliverable}
                            className="text-xs text-red-600 hover:underline disabled:opacity-60"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {canUploadDeliverable && (
                <>
                  <input
                    ref={deliverableInputRef}
                    type="file"
                    accept=".pdf,.zip,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.md,.json,.doc,.docx,.xlsx"
                    className="hidden"
                    onChange={(e) => handleDeliverableUpload(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => deliverableInputRef.current?.click()}
                    disabled={uploadingDeliverable}
                    className="w-full bg-[#f9fafb] border border-dashed border-[rgba(0,0,0,0.1)] rounded py-2.5 text-[#4a5565] font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
                  >
                    {uploadingDeliverable ? "업로드 중..." : "+ 파일 업로드 (최대 50MB)"}
                  </button>
                </>
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
              {/* 트러블슈팅 등록 폼 */}
              {!isArchived && (
                <div className="bg-white border-2 border-[rgba(174,174,174,0.3)] rounded-[10px] shadow-md p-4 mb-4">
                  <p className="text-xs text-red-600 font-medium mb-2">
                    새 트러블슈팅 기록
                  </p>
                  <textarea
                    value={problemInput}
                    onChange={(e) => setProblemInput(e.target.value)}
                    placeholder="발견한 문제를 입력하세요."
                    rows={2}
                    className="mb-2 w-full rounded-[5px] border border-gray-200 p-2 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    value={planInput}
                    onChange={(e) => setPlanInput(e.target.value)}
                    placeholder="해결 계획 (선택)"
                    className="mb-2 w-full rounded-[5px] border border-gray-200 p-2 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    value={solutionInput}
                    onChange={(e) => setSolutionInput(e.target.value)}
                    placeholder="해결 방법 (입력 시 해결 완료로 저장)"
                    className="mb-2 w-full rounded-[5px] border border-gray-200 p-2 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTroubleshootingLog}
                    disabled={submittingLog}
                    className="w-full rounded-[5px] bg-[#155dfc] py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submittingLog ? "등록 중..." : "기록 등록"}
                  </button>
                </div>
              )}

              {/* 트러블슈팅 로그 목록 */}
              <div className="space-y-4">
                {troubleshootingLogs.map((log) => {
                  const isEditing = editingLogId === log.id;
                  return (
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
                        <span className="text-xs font-bold text-[#1e2939]">{log.author}</span>
                        {canEditLog(log) && !isArchived && !isEditing && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEditLog(log)}
                              className="text-[10px] text-blue-600 hover:underline"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              disabled={submittingLog}
                              className="text-[10px] text-red-600 hover:underline disabled:opacity-60"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#99a1af]">{log.timestamp}</span>
                    </div>

                    {isEditing ? (
                      <form onSubmit={(e) => handleUpdateLog(e, log.id)} className="space-y-2">
                        <textarea
                          value={editLogForm.problem}
                          onChange={(e) => setEditLogForm((prev) => ({ ...prev, problem: e.target.value }))}
                          rows={2}
                          className="w-full rounded border border-gray-200 p-2 text-xs"
                          required
                        />
                        <input
                          type="text"
                          value={editLogForm.plan}
                          onChange={(e) => setEditLogForm((prev) => ({ ...prev, plan: e.target.value }))}
                          placeholder="해결 계획"
                          className="w-full rounded border border-gray-200 p-2 text-xs"
                        />
                        <input
                          type="text"
                          value={editLogForm.solution}
                          onChange={(e) => setEditLogForm((prev) => ({ ...prev, solution: e.target.value }))}
                          placeholder="해결 방법"
                          className="w-full rounded border border-gray-200 p-2 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submittingLog}
                            className="rounded bg-[#155dfc] px-3 py-1.5 text-xs text-white disabled:opacity-60"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLogId(null)}
                            className="rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-700"
                          >
                            취소
                          </button>
                        </div>
                      </form>
                    ) : (
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
                    )}

                    <div className="mt-3 flex flex-col gap-2 border-t border-[#f3f4f6] pt-3 sm:flex-row sm:items-center sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="rounded-[20px] bg-[#155dfc] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        채팅방 이동
                      </button>
                      {canResolveLog(log) && (
                        <button
                          type="button"
                          onClick={() => handleResolveLog(log)}
                          disabled={submittingLog}
                          className="rounded border border-[#b9f8cf] bg-[#f0fdf4] px-3 py-2 text-[11px] font-medium text-[#008236] hover:bg-green-100 disabled:opacity-60"
                        >
                          ✅ 해결 완료 처리
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

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

          {isArchived ? (
            <div className="rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm font-bold text-gray-500">
              종료된 수업에서는 피드백을 새로 작성할 수 없습니다.
            </div>
          ) : feedbackSubmitted ? (
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
                  type="button"
                  data-testid="team-feedback-submit"
                  disabled={
                    submittingFeedback ||
                    (selectedFeedbacks.length === 0 && !customFeedbackText)
                  }
                  className="rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400 sm:px-8"
                  onClick={() => void handleSubmitFeedback()}
                >
                  {submittingFeedback ? "저장 중…" : "완료"}
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
              {isArchived ? (
                <p className="text-center text-sm font-bold text-gray-500">종료된 수업에서는 채팅을 새로 작성할 수 없습니다.</p>
              ) : (
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
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChat(); } }}
                      placeholder="메시지를 입력하세요."
                      className="flex-1 bg-transparent text-sm text-[#1e2939] placeholder:text-[#9d9d9d] outline-none"
                    />
                  </div>
                  <button
                    onClick={() => void sendChat()}
                    disabled={!chatInput.trim() || sendingChat}
                    className="bg-[#155dfc] disabled:bg-[#c7d9f8] text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                    aria-label="전송"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 rotate-90">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 평가 모달 (교수만) */}
      {isProfessor && !isArchived && showEvalModal && (
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
                    <p className="text-[17px] text-black whitespace-pre-wrap">
                      {projectEvalAutoHints.files}
                    </p>
                  </div>
                  {/* 평가 입력란 */}
                  <div className="bg-white rounded-[5px] shadow-md p-4">
                    <textarea
                      value={projectEval.completionComment}
                      onChange={(e) =>
                        setProjectEval((prev) => ({
                          ...prev,
                          completionComment: e.target.value,
                        }))
                      }
                      placeholder="평가를 입력하세요."
                      data-testid="professor-eval-completion"
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
                    <p className="text-[17px] text-black whitespace-pre-wrap">
                      {projectEvalAutoHints.solved}
                    </p>
                  </div>
                  {/* 평가 입력란 */}
                  <div className="bg-white rounded-[5px] shadow-md p-4">
                    <textarea
                      value={projectEval.problemSolvingComment}
                      onChange={(e) =>
                        setProjectEval((prev) => ({
                          ...prev,
                          problemSolvingComment: e.target.value,
                        }))
                      }
                      placeholder="평가를 입력하세요."
                      data-testid="professor-eval-problem-solving"
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
                      value={projectEval.holisticComment}
                      onChange={(e) =>
                        setProjectEval((prev) => ({
                          ...prev,
                          holisticComment: e.target.value,
                        }))
                      }
                      placeholder="평가를 입력하세요."
                      data-testid="professor-eval-holistic"
                      className="w-full h-[333px] text-[17px] text-[#595959] placeholder:text-[#595959] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  data-testid="professor-project-eval-submit"
                  disabled={savingProfessorEval}
                  onClick={() => void handleSaveProjectEval()}
                  className="bg-[#155dfc] text-white px-8 py-2 rounded-[10px] text-[17px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {savingProfessorEval ? "저장 중…" : "완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 학생 평가 모달 (교수만) */}
      {isProfessor && !isArchived && showStudentEvalModal && (
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
                  type="button"
                  data-testid="professor-student-eval-submit"
                  disabled={savingProfessorEval}
                  onClick={() => void handleSaveStudentEvals()}
                  className="bg-[#155dfc] text-white px-16 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60"
                >
                  {savingProfessorEval ? "저장 중…" : "다음"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 회고록 모달 (학생만) */}
      {isStudent && !isArchived && showRetrospectiveModal && (
        <div
          className="my-6 flex w-full items-center justify-center rounded-2xl bg-[rgba(79,79,79,0.83)] p-4"
          onClick={() => setShowRetrospectiveModal(false)}
        >
          <div
            className="bg-white rounded-[10px] shadow-2xl max-w-[1191px] w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
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
              {(
                [
                  { key: "role" as const, title: "본인이 한 역할" },
                  { key: "strengths" as const, title: "잘한점" },
                  { key: "regrets" as const, title: "아쉬운 점" },
                  { key: "growth" as const, title: "발전한 점" },
                ] as const
              ).map(({ key, title }) => (
                <div key={key} className="bg-[#eff6ff] rounded-[10px] shadow-md p-6">
                  <p className="text-[20px] font-medium text-black text-center mb-4">{title}</p>
                  <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4 mb-4">
                    <p className="text-[17px] font-medium text-black mb-3">자동연동</p>
                    <p className="text-[17px] text-black whitespace-pre-wrap">
                      {retrospectiveSections[key].auto || "—"}
                    </p>
                  </div>
                  <div className="bg-white rounded-[5px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] p-4">
                    <p className="text-[17px] font-medium text-black mb-3">직접입력</p>
                    <input
                      type="text"
                      value={retrospectiveSections[key].custom}
                      onChange={(e) => updateRetrospectiveCustom(key, e.target.value)}
                      placeholder="직접 입력하세요."
                      disabled={isArchived}
                      data-testid={`retrospective-custom-${key}`}
                      className="w-full text-[17px] text-black placeholder:text-[#9d9d9d] outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  data-testid="retrospective-submit"
                  disabled={submittingRetrospective || isArchived}
                  onClick={() => void handleSubmitRetrospective()}
                  className="bg-[#155dfc] text-white px-16 py-2 rounded-[10px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] text-[17px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {submittingRetrospective ? "저장 중…" : retrospectiveSubmitted ? "수정 저장" : "완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 조원 평가 모달 (학생만) */}
      {isStudent && !isArchived && showPeerReviewModal && (
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
                <span className="text-base font-medium text-black">
                  {myName}
                  <span className="text-[#6a7282] text-sm ml-1">(본인)</span>
                </span>
                <span className="text-base font-medium text-black">
                  기여도 :{" "}
                  <span className="text-[#155dfc] font-bold">
                    {teammates.find((m) => m.name === myName)?.contribution ?? 0}%
                  </span>
                </span>
              </div>

              {/* 각 팀원 평가 */}
              {teammates.filter((member) => member.name !== myName).map((member) => {
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
                          type="button"
                          data-testid={`peer-review-submit-${member.id}`}
                          onClick={() => void handleSubmitPeerReview(member.id)}
                          disabled={submittingPeerReviewId === member.id}
                          className={`px-8 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-60 ${
                            review.submitted
                              ? "bg-green-500 text-white"
                              : "bg-[#155dfc] text-white hover:bg-blue-700"
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
      {!isArchived && showFeedbackCustomModal && (
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