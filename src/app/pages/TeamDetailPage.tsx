import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchTeamProgressInsightFromEdge,
  isClientMetadataFallbackInsight,
  isShallowProgressInsight,
  normalizeProgressInsightForDisplay,
  shouldPreferEdgeProgressInsight,
} from "../api/ai-team-progress";
import { api, buildTeamProgressInsight } from "../api/supabase-api";
import StudentQuickProfileModal from "../components/StudentQuickProfileModal";
import TeamDeliverableDetailModal from "../components/TeamDeliverableDetailModal";
import TeamDeliverableSubmitModal, {
  type TeamDeliverableFormPayload,
} from "../components/TeamDeliverableSubmitModal";
import TeamTroubleshootingEditModal from "../components/TeamTroubleshootingEditModal";
import TeamTroubleshootingSubmitModal, {
  type TroubleshootingFormPayload,
} from "../components/TeamTroubleshootingSubmitModal";
import { supabase } from "../supabase";
import {
  deliverableDeployLinkLabel,
  deliverableDeployUrl,
  externalDeliverableHref,
  isDeliverableArchiveFile,
} from "../utils/deliverableLinks";
import AppModal from "../components/layout/AppModal";
import M3Button from "../components/layout/M3Button";
import PageHeader from "../components/layout/PageHeader";
import UserAvatar from "../components/UserAvatar";
import {
  AiGeneratingIndicator,
  GeminiShimmerLines,
  GeminiShimmerPanel,
} from "../components/AiGeneratingIndicator";
import TeamPeerReviewPage from "./TeamPeerReviewPage";
import TeamRetrospectivePage from "./TeamRetrospectivePage";
import type {
  ChatMessage,
  Course,
  PeerReviewStudent,
  TeamDeliverable,
  TroubleshootingLog,
  PeerReviewTeammate,
  StudentProfile,
} from "../types";

export default function TeamDetailPage() {
  const { id, teamId, courseId } = useParams<{ id?: string; teamId?: string; courseId?: string }>();
  const selectedTeamId = teamId ?? id ?? "";
  const navigate = useNavigate();
  const { isProfessor, isStudent, isAdmin, user } = useAuth();
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<StudentProfile | null>(null);
  const [memberProfileLoading, setMemberProfileLoading] = useState(false);
  const [memberProfileError, setMemberProfileError] = useState<string | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showStudentEvalModal, setShowStudentEvalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [teamHeader, setTeamHeader] = useState<{
    name: string;
    projectTitle: string;
    badge?: string;
  } | null>(null);

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
  const isEvaluationOpen = isArchived;
  const [teammates, setTeammates] = useState<PeerReviewTeammate[]>([]);
  const [isMyTeamFromApi, setIsMyTeamFromApi] = useState(false);
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, number>>({});

  const handleCreateTroubleshootingLog = async (payload: TroubleshootingFormPayload) => {
    if (!selectedTeamId) return;

    setSubmittingLog(true);
    try {
      const created = await api.teamDetail.createTroubleshootingLog(selectedTeamId, {
        problem: payload.problem,
        plan: payload.plan,
        solution: payload.solution,
      });
      setTroubleshootingLogs((prev) => [...prev, created]);
      setShowTroubleshootingModal(false);
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
    let isCancelled = false;

    void api.teamDetail.warmChatSendContext(selectedTeamId).catch((err) => {
      console.warn("팀 채팅 준비 실패:", err);
    });

    void api.teamDetail
      .getChatMessages(selectedTeamId)
      .then((messages) => {
        if (!isCancelled) setChatMessages(messages);
      })
      .catch((err) => console.warn("채팅 새로고침 실패:", err));

    return () => {
      isCancelled = true;
    };
  }, [showChatModal, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) return;

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
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("팀 채팅 Realtime:", status, err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedTeamId, myName]);

  const [studentEvalInputs, setStudentEvalInputs] = useState<Record<string, string>>({});
  const [projectEval, setProjectEval] = useState({
    completionComment: "",
    problemSolvingComment: "",
    holisticComment: "",
  });
  const [savingProfessorEval, setSavingProfessorEval] = useState(false);

  const [allStudents, setAllStudents] = useState<PeerReviewStudent[]>([]);
  const [troubleshootingLogs, setTroubleshootingLogs] = useState<TroubleshootingLog[]>([]);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [editingTroubleshootingLog, setEditingTroubleshootingLog] = useState<TroubleshootingLog | null>(null);
  const [deliverables, setDeliverables] = useState<TeamDeliverable[]>([]);
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<TeamDeliverable | null>(null);
  const [detailDeliverable, setDetailDeliverable] = useState<TeamDeliverable | null>(null);
  const [showTroubleshootingModal, setShowTroubleshootingModal] = useState(false);

  const isMyTeamMemberFromRoster = useMemo(
    () => Boolean(user?.id && teammates.some((member) => member.id === user.id)),
    [teammates, user?.id]
  );
  const isMyTeamMember = isMyTeamFromApi || isMyTeamMemberFromRoster;

  const canEditLog = (log: TroubleshootingLog) => log.author === myName;
  const canResolveLog = (log: TroubleshootingLog) =>
    log.status === "in-progress" && !isArchived && isStudent && isMyTeamMember;

  const canWriteTroubleshooting = !isArchived && isStudent && isMyTeamMember;
  const canUploadDeliverable = !isArchived && isStudent && isMyTeamMember;

  const openMemberProfile = async (memberId: string) => {
    if (memberId === user?.id) return;
    setMemberProfileLoading(true);
    setMemberProfileError(null);
    setSelectedMemberProfile(null);
    try {
      const profile = await api.students.getById(memberId);
      if (!profile) {
        setMemberProfileError("프로필을 불러오지 못했습니다.");
        return;
      }
      setSelectedMemberProfile(profile);
    } catch (error) {
      console.error(error);
      setMemberProfileError(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다."
      );
    } finally {
      setMemberProfileLoading(false);
    }
  };

  const closeMemberProfile = () => {
    setSelectedMemberProfile(null);
    setMemberProfileError(null);
    setMemberProfileLoading(false);
  };

  const handleLeaveTeam = async () => {
    if (!selectedTeamId || leavingTeam) return;
    if (!window.confirm("이 팀에서 탈퇴할까요? 다른 팀에 참여하려면 탈퇴 후 팀 목록에서 참여할 수 있습니다.")) {
      return;
    }

    setLeavingTeam(true);
    try {
      await api.teams.leave(selectedTeamId);
      navigate(courseId ? `/app/courses/${courseId}/teams` : "/app/teams");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "팀 탈퇴에 실패했습니다.");
    } finally {
      setLeavingTeam(false);
    }
  };

  const [progressInsight, setProgressInsight] = useState<{
    summary: string;
    strengths: string[];
    gaps: string[];
    next_steps: string[];
    architecture_risks: string[];
    improvements: string[];
    model: string;
    used_memory?: boolean;
    new_deliverables_analyzed?: number;
    source_samples_count?: number;
  } | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const latestDeployLink = useMemo(() => {
    const withDeploy = deliverables
      .map((d) => ({ d, url: deliverableDeployUrl(d) }))
      .filter((x): x is { d: TeamDeliverable; url: string } => Boolean(x.url));
    if (withDeploy.length === 0) return null;
    const latest = [...withDeploy].sort(
      (a, b) => new Date(b.d.createdAt).getTime() - new Date(a.d.createdAt).getTime()
    )[0];
    return { deliverable: latest.d, url: latest.url };
  }, [deliverables]);

  useEffect(() => {
    if (!selectedTeamId) return;

    let cancelled = false;

    const run = async () => {
      setInsightLoading(true);
      setProgressInsight(null);

      try {
        const edge = await fetchTeamProgressInsightFromEdge(selectedTeamId, "ko");
        if (cancelled) return;

        const fallback = normalizeProgressInsightForDisplay(
          buildTeamProgressInsight(deliverables, troubleshootingLogs)
        );

        const hasArchiveDeliverable = deliverables.some(
          (d) => d.kind !== "link" && isDeliverableArchiveFile(d.fileName, d.mimeType)
        );

        const preferEdge = shouldPreferEdgeProgressInsight(edge, hasArchiveDeliverable);
        const fallbackIsGeneric = isClientMetadataFallbackInsight(fallback);

        if (preferEdge && edge) {
          setProgressInsight(edge);
        } else if (edge && fallbackIsGeneric && !isShallowProgressInsight(edge)) {
          setProgressInsight(edge);
        } else {
          setProgressInsight(fallback);
        }
      } catch (error) {
        console.warn("팀 진행 인사이트 로드 실패:", error);
        if (!cancelled) {
          setProgressInsight(
            normalizeProgressInsightForDisplay(
              buildTeamProgressInsight(deliverables, troubleshootingLogs)
            )
          );
        }
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedTeamId, deliverables, troubleshootingLogs]);

  const projectEvalAutoHints = useMemo(() => {
    const fileList =
      deliverables.length > 0
        ? deliverables
            .map((item) => {
              const sub = item.subtitle?.trim();
              const desc = item.description?.trim();
              const extra = [sub, desc].filter(Boolean).join(" — ");
              return extra ? `${item.fileName} (${extra})` : item.fileName;
            })
            .join("\n")
        : "업로드된 산출물 없음";
    const inProgress =
      troubleshootingLogs
        .filter((log) => log.status === "in-progress")
        .map((log) => log.problem)
        .filter(Boolean)
        .join(" / ") || "";
    const solvedList =
      troubleshootingLogs
        .filter((log) => log.status === "resolved")
        .map((log) => log.problem)
        .filter(Boolean)
        .join(" / ") || "";
    const solved = solvedList || inProgress || "기록된 트러블슈팅 없음";
    const resolvedCount = troubleshootingLogs.filter((log) => log.status === "resolved").length;
    const inProgressCount = troubleshootingLogs.filter((log) => log.status === "in-progress").length;
    const narrative = [
      `팀 DB 기준 요약 (AI 생성 아님): 산출물 ${deliverables.length}건`,
      resolvedCount > 0 || inProgressCount > 0
        ? `트러블슈팅 해결 ${resolvedCount}건 · 진행 중 ${inProgressCount}건`
        : "트러블슈팅 기록 없음",
      deliverables.length > 0 ? `최근 산출물: ${deliverables[0]?.fileName ?? ""}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return { files: fileList, solved, narrative };
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

  const openCreateDeliverableModal = () => {
    setEditingDeliverable(null);
    setShowDeliverableModal(true);
  };

  const openEditDeliverableModal = (item: TeamDeliverable) => {
    setEditingDeliverable(item);
    setShowDeliverableModal(true);
  };

  const closeDeliverableModal = () => {
    setShowDeliverableModal(false);
    setEditingDeliverable(null);
  };

  const openDeliverableDetail = (item: TeamDeliverable) => {
    setDetailDeliverable(item);
  };

  const closeDeliverableDetail = () => {
    setDetailDeliverable(null);
  };

  const handleSubmitDeliverableModal = async (payload: TeamDeliverableFormPayload) => {
    if (!selectedTeamId) return;

    setUploadingDeliverable(true);
    try {
      if (editingDeliverable) {
        const updated = await api.teamDetail.updateDeliverable(editingDeliverable.id, {
          title: payload.title || undefined,
          subtitle: payload.subtitle || undefined,
          description: payload.description,
          url: payload.linkUrl || undefined,
          file: editingDeliverable.kind === "file" ? payload.files[0] : undefined,
        });
        setDeliverables((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        closeDeliverableModal();
        return;
      }

      const linkUrl = payload.linkUrl.trim();
      const hasLink = Boolean(linkUrl);
      const hasFiles = payload.files.length > 0;
      const metaBase = {
        title: payload.title || undefined,
        subtitle: payload.subtitle || undefined,
        description: payload.description || undefined,
        linkUrl: hasLink && hasFiles ? linkUrl : undefined,
      };

      const created: TeamDeliverable[] = [];

      if (hasLink && !hasFiles) {
        created.push(
          await api.teamDetail.addDeliverableLink(selectedTeamId, {
            url: linkUrl,
            title: payload.title || undefined,
            subtitle: payload.subtitle || undefined,
            description: payload.description || undefined,
          })
        );
      } else {
        for (let i = 0; i < payload.files.length; i++) {
          const file = payload.files[i];
          const fileMeta =
            payload.files.length === 1
              ? { ...metaBase, linkUrl: hasLink ? linkUrl : undefined }
              : {
                  title: payload.title ? `${payload.title} · ${file.name}` : file.name,
                  subtitle: payload.subtitle || undefined,
                  description: payload.description || undefined,
                  linkUrl: hasLink && i === 0 ? linkUrl : undefined,
                };
          created.push(await api.teamDetail.uploadDeliverable(selectedTeamId, file, fileMeta));
        }
      }

      if (created.length > 0) {
        setDeliverables((prev) => [...created, ...prev]);
      }
      closeDeliverableModal();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : editingDeliverable
            ? "산출물 수정에 실패했습니다."
            : "산출물 등록에 실패했습니다."
      );
    } finally {
      setUploadingDeliverable(false);
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

  const handleUpdateTroubleshootingLog = async (payload: {
    problem: string;
    plan: string;
    solution: string;
  }) => {
    if (!editingTroubleshootingLog) return;
    setSubmittingLog(true);
    try {
      const updated = await api.teamDetail.updateTroubleshootingLog(editingTroubleshootingLog.id, {
        problem: payload.problem,
        plan: payload.plan,
        solution: payload.solution,
      });
      setTroubleshootingLogs((prev) =>
        prev.map((log) => (log.id === editingTroubleshootingLog.id ? updated : log))
      );
      setEditingTroubleshootingLog(null);
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
      if (editingTroubleshootingLog?.id === logId) setEditingTroubleshootingLog(null);
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

  const [retrospectiveSubmitted, setRetrospectiveSubmitted] = useState(false);

  const refreshRetrospectiveStatus = async () => {
    if (!selectedTeamId) return;
    try {
      const draft = await api.teamDetail.getRetrospectiveDraft(selectedTeamId);
      setRetrospectiveSubmitted(draft.submitted);
    } catch (error) {
      console.warn("회고록 상태 갱신 실패:", error);
    }
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
      const counts = await api.teamDetail.getFeedbackCounts(selectedTeamId);
      setFeedbackCounts(counts);
      setSelectedFeedbacks([]);
      setCustomFeedbackText("");
      setFeedbackSubmitted(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "피드백 저장에 실패했습니다.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    if (!selectedTeamId || !isStudent) {
      setIsMyTeamFromApi(false);
      return;
    }

    let isCancelled = false;
    void api.teams.isStudentMember(selectedTeamId).then((isMember) => {
      if (!isCancelled) setIsMyTeamFromApi(isMember);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedTeamId, isStudent, user?.id]);

  useEffect(() => {
    if (!selectedTeamId) return;
    let isCancelled = false;

    const loadTeamDetailData = async () => {
      const [
        feedbackOptionsResult,
        myFeedbackResult,
        chatMessagesResult,
        reviewStudentsResult,
        troubleshootingLogsResult,
        deliverablesResult,
        retrospectiveDraftResult,
        teammatesResult,
        feedbackCountsResult,
      ] = await Promise.allSettled([
        api.teamDetail.getFeedbackOptions(selectedTeamId),
        api.teamDetail.getMyFeedback(selectedTeamId),
        api.teamDetail.getChatMessages(selectedTeamId),
        api.teamDetail.getPeerReviewStudents(selectedTeamId),
        api.teamDetail.getTroubleshootingLogs(selectedTeamId),
        api.teamDetail.getDeliverables(selectedTeamId),
        api.teamDetail.getRetrospectiveDraft(selectedTeamId),
        api.teamDetail.getTeammates(selectedTeamId),
        api.teamDetail.getFeedbackCounts(selectedTeamId),
      ]);

      if (isCancelled) return;

      const defaultFeedbackOptions = [
        "실용적이에요",
        "신선해요",
        "아이디어가 좋아요",
        "UI/UX가 좋아요",
      ];

      if (feedbackOptionsResult.status === "fulfilled") {
        const feedbackData =
          feedbackOptionsResult.value.length > 0
            ? feedbackOptionsResult.value
            : defaultFeedbackOptions;
        setFeedbackOptions(feedbackData);

        if (myFeedbackResult.status === "fulfilled" && myFeedbackResult.value) {
          setSelectedFeedbacks(myFeedbackResult.value.selectedOptions);
          setCustomFeedbackText(myFeedbackResult.value.customText ?? "");
        } else {
          setSelectedFeedbacks([]);
          setCustomFeedbackText("");
        }
        setFeedbackSubmitted(false);
      } else {
        console.warn("피드백 옵션 로드 실패:", feedbackOptionsResult.reason);
        setFeedbackOptions(defaultFeedbackOptions);
        setSelectedFeedbacks(defaultFeedbackOptions.slice(0, 2));
      }

      if (chatMessagesResult.status === "fulfilled") {
        setChatMessages(chatMessagesResult.value);
      } else {
        console.warn("채팅 기록 로드 실패:", chatMessagesResult.reason);
      }

      if (reviewStudentsResult.status === "fulfilled") {
        const reviewStudents = reviewStudentsResult.value;
        setAllStudents(reviewStudents);
        setStudentEvalInputs((prev) => {
          const next = { ...prev };
          for (const student of reviewStudents) {
            if (!(student.id in next)) next[student.id] = "";
          }
          return next;
        });
      } else {
        console.warn("평가 대상 학생 로드 실패:", reviewStudentsResult.reason);
      }

      if (troubleshootingLogsResult.status === "fulfilled") {
        setTroubleshootingLogs(troubleshootingLogsResult.value);
      } else {
        console.warn("트러블슈팅 로그 로드 실패:", troubleshootingLogsResult.reason);
      }

      if (deliverablesResult.status === "fulfilled") {
        setDeliverables(deliverablesResult.value);
      } else {
        console.warn("산출물 로드 실패:", deliverablesResult.reason);
      }

      if (teammatesResult.status === "fulfilled") {
        setTeammates(teammatesResult.value);
      } else {
        console.warn("팀원 목록 로드 실패:", teammatesResult.reason);
      }

      if (feedbackCountsResult.status === "fulfilled") {
        setFeedbackCounts(feedbackCountsResult.value);
      } else {
        console.warn("피드백 집계 로드 실패:", feedbackCountsResult.reason);
      }

      if (retrospectiveDraftResult.status === "fulfilled") {
        setRetrospectiveSubmitted(retrospectiveDraftResult.value.submitted);
      } else {
        console.warn("회고록 초안 로드 실패:", retrospectiveDraftResult.reason);
        setRetrospectiveSubmitted(false);
      }
    };

    void loadTeamDetailData();

    return () => {
      isCancelled = true;
    };
  }, [selectedTeamId, user?.name]);

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamHeader(null);
      return;
    }

    let isCancelled = false;
    void api.teams.getWorkspaceHeader(selectedTeamId).then((header) => {
      if (!isCancelled) setTeamHeader(header);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const refreshHeader = () => {
      void api.teams.getWorkspaceHeader(selectedTeamId).then((header) => {
        if (header) setTeamHeader(header);
      });
    };
    window.addEventListener("focus", refreshHeader);
    return () => window.removeEventListener("focus", refreshHeader);
  }, [selectedTeamId]);

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
    ])
      .then(([studentEvals, savedProjectEval]) => {
        setStudentEvalInputs((prev) => ({ ...prev, ...studentEvals }));
        setProjectEval(savedProjectEval);
      })
      .catch((error) => {
        console.warn("교수 평가 초안 로드 실패:", error);
      });
  }, [selectedTeamId, isProfessor, isAdmin]);

  const [aiRecommendation, setAiRecommendation] = useState<{
    problem: string;
    plan: string;
    rationale?: string;
    model: string;
  } | null>(null);
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false);
  const [aiRecommendationError, setAiRecommendationError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTeamId) {
      setAiRecommendation(null);
      setAiRecommendationError(null);
      return;
    }

    let cancelled = false;
    setAiRecommendationLoading(true);
    setAiRecommendationError(null);

    void api.teamDetail
      .recommendTroubleshootingAi({ teamId: selectedTeamId, locale: "ko" })
      .then((result) => {
        if (!cancelled) {
          setAiRecommendation({
            problem: result.problem,
            plan: result.plan,
            rationale: result.rationale,
            model: result.model,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAiRecommendation(null);
          setAiRecommendationError(
            error instanceof Error ? error.message : "AI 추천을 불러오지 못했습니다."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAiRecommendationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTeamId, troubleshootingLogs.length, deliverables.length]);

  const totalFeedbackCount = useMemo(
    () => Object.values(feedbackCounts).reduce((sum, count) => sum + count, 0),
    [feedbackCounts]
  );

  const workspaceHeaderActions =
    isProfessor && isEvaluationOpen ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <M3Button variant="outlined" type="button" onClick={() => setShowStudentEvalModal(true)}>
          학생 평가
        </M3Button>
        <M3Button variant="filled" type="button" onClick={() => setShowEvalModal(true)}>
          프로젝트 평가
        </M3Button>
        {courseId ? (
          <M3Button
            variant="tonal"
            to={`/app/courses/${courseId}/peer-reviews`}
            data-testid="course-peer-reviews-overview-link"
          >
            동료평가 전체
          </M3Button>
        ) : null}
      </div>
    ) : isProfessor ? (
      <span className="m3-body-medium cc-badge-warning inline-flex items-center rounded-[var(--m3-shape-medium)] px-4 py-2 font-medium">
        수업 종료 후 평가 가능
      </span>
    ) : isStudent && isEvaluationOpen ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <M3Button
          variant="outlined"
          type="button"
          onClick={() => setShowPeerReviewModal(true)}
          data-testid="team-peer-review-modal-open"
        >
          조원평가
        </M3Button>
        <M3Button
          variant="filled"
          type="button"
          onClick={() => setShowRetrospectiveModal(true)}
          data-testid="team-retrospective-modal-open"
        >
          {retrospectiveSubmitted ? "회고록 수정" : "회고록 작성"}
        </M3Button>
      </div>
    ) : null;

  return (
    <div className="cc-page-main w-full">
        <PageHeader
          backTo={courseId ? `/app/courses/${courseId}/teams` : "/app/teams"}
          title={teamHeader?.name ?? "팀 워크스페이스"}
          subtitle={teamHeader?.projectTitle}
          subtitleTestId="team-workspace-project-title"
          badge={teamHeader?.badge}
          titleTestId="team-workspace-title"
          actions={workspaceHeaderActions}
        />

        {teammates.length > 0 && (
          <div
            className="m3-surface-card mb-6 p-5"
            data-testid="team-workspace-members"
          >
            <h3 className="m3-title-medium mb-3 text-[var(--cc-on-surface)]">👥 팀원</h3>
            <div className="flex flex-wrap gap-3">
              {teammates.map((member) => {
                const isLeader = member.role === "leader";
                return (
                  <button
                    key={member.id}
                    type="button"
                    data-testid={`team-workspace-member-${member.id}`}
                    onClick={() => void openMemberProfile(member.id)}
                    disabled={member.id === user?.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-colors disabled:cursor-default disabled:opacity-80 ${
                      isLeader
                        ? "border-[#155dfc] bg-[#eff6ff] hover:border-[#155dfc] hover:bg-[#dbeafe]"
                        : "border-gray-200 bg-[#f8fafc] hover:border-[#155dfc] hover:bg-[#eff6ff]"
                    }`}
                  >
                    <UserAvatar
                      name={member.name ?? "팀원"}
                      imageUrl={member.imageUrl}
                      size="xs"
                      className={!member.imageUrl ? (isLeader ? "!bg-[#155dfc]" : "!bg-gray-400") : ""}
                    />
                    <div className="text-left">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900">{member.name}</p>
                        {isLeader && (
                          <span
                            className="rounded-full bg-[#155dfc] px-2 py-0.5 text-[10px] font-bold text-white"
                            data-testid={`team-workspace-leader-badge-${member.id}`}
                          >
                            팀장
                          </span>
                        )}
                        {member.id === user?.id && (
                          <span className="text-[10px] text-[#64748b]">(나)</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {isLeader ? "팀 리더" : "팀원"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI 통합 진행상황 요약 */}
        <GeminiShimmerPanel
          active={insightLoading}
          className="cc-ai-insight-panel"
          data-testid="team-progress-insight-panel"
        >
          <h3
            className={`cc-ai-insight-panel__title ${
              insightLoading ? "cc-gemini-shimmer-text" : ""
            }`}
          >
            ✨ AI 통합 진행상황 요약
          </h3>
          {!insightLoading &&
          progressInsight &&
          (progressInsight.used_memory ||
            (progressInsight.new_deliverables_analyzed ?? 0) > 0 ||
            (progressInsight.source_samples_count ?? 0) > 0) ? (
            <p className="cc-ai-insight-panel__meta" data-testid="team-progress-insight-meta">
              {progressInsight.used_memory ? "이전 분석 기억 반영" : "첫 분석"}
              {(progressInsight.source_samples_count ?? 0) > 0
                ? ` · 소스 ${progressInsight.source_samples_count}개 분석`
                : (progressInsight.new_deliverables_analyzed ?? 0) > 0
                  ? ` · 신규 산출물 ${progressInsight.new_deliverables_analyzed}건 문서·소스 읽음`
                  : progressInsight.used_memory
                    ? " · 신규 파일 없음(로그·채팅만 갱신)"
                    : ""}
            </p>
          ) : null}
          {insightLoading && !progressInsight?.summary ? (
            <GeminiShimmerLines active lines={3} className="mb-2" />
          ) : (
            <>
              <p className="cc-ai-insight-panel__summary">
                {progressInsight?.summary ?? "팀 활동 데이터를 분석 중입니다."}
              </p>
              {progressInsight?.project_content && (
                <div className="cc-ai-insight-subblock cc-ai-insight-subblock--project mt-2">
                  <p className="cc-ai-insight-subblock__label">AI가 파악한 프로젝트</p>
                  <p className="text-[12px] text-[var(--cc-on-surface-variant)] leading-relaxed">
                    {progressInsight.project_content}
                    {progressInsight.project_value && (
                      <span className="block mt-0.5 text-[11px] opacity-80">{progressInsight.project_value}</span>
                    )}
                  </p>
                </div>
              )}
              {(progressInsight?.gaps?.length ?? 0) > 0 && (
                <ul className="cc-ai-insight-list cc-ai-insight-list--gap space-y-1">
                  {progressInsight!.gaps.slice(0, 2).map((item) => (
                    <li key={item}>△ {item}</li>
                  ))}
                </ul>
              )}
              {(progressInsight?.next_steps?.length ?? 0) > 0 && (
                <div className="cc-ai-insight-subblock cc-ai-insight-subblock--next">
                  <p className="cc-ai-insight-subblock__label">다음에 할 일</p>
                  <ul className="cc-ai-insight-subblock__list space-y-1">
                    {progressInsight!.next_steps.slice(0, 2).map((item) => (
                      <li key={item}>→ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(progressInsight?.architecture_risks?.length ?? 0) > 0 && (
                <div className="cc-ai-insight-subblock cc-ai-insight-subblock--risk">
                  <p className="cc-ai-insight-subblock__label">아키텍처·구조 주의</p>
                  <ul className="cc-ai-insight-subblock__list space-y-1">
                    {progressInsight!.architecture_risks.slice(0, 1).map((item) => (
                      <li key={item}>⚠ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(progressInsight?.improvements?.length ?? 0) > 0 && (
                <div className="cc-ai-insight-subblock cc-ai-insight-subblock--improve">
                  <p className="cc-ai-insight-subblock__label">개선 방향</p>
                  <ul className="cc-ai-insight-subblock__list space-y-1">
                    {progressInsight!.improvements.slice(0, 1).map((item) => (
                      <li key={item}>✦ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </GeminiShimmerPanel>

        {/* 2열 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 왼쪽: 프로젝트 산출물 & 공간 */}
          <div className="bg-white rounded-[14px] shadow-md border border-[rgba(0,0,0,0.1)] p-5">
            <h2 className="text-lg font-bold text-[#1e2939] mb-3">
              📁 프로젝트 산출물 & 공간
            </h2>

            {latestDeployLink && (
              <a
                href={latestDeployLink.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="team-deliverable-latest-link-banner"
                className="mb-4 block rounded-[10px] border border-[#93c5fd] bg-[#eff6ff] px-4 py-2.5 text-sm font-medium text-[#155dfc] truncate transition-colors hover:bg-[#dbeafe] hover:underline"
                onClick={(e) => e.stopPropagation()}
                title={latestDeployLink.url}
              >
                {deliverableDeployLinkLabel(latestDeployLink.deliverable)}
              </a>
            )}

            {/* 팀 산출물 게시판 */}
            <div className="space-y-3">
              {deliverables.length === 0 ? (
                <p className="rounded-[10px] border border-dashed border-gray-300 bg-[#f9fafb] px-3 py-4 text-center text-sm text-[#6a7282]">
                  업로드된 산출물이 없습니다.
                </p>
              ) : (
                deliverables.map((item) => {
                  const isLinkItem = item.kind === "link";
                  const canModifyDeliverable =
                    !isArchived &&
                    ((isAdmin &&
                      Boolean(user?.id) &&
                      String(user.id) === String(item.uploaderId)) ||
                      (canUploadDeliverable &&
                        Boolean(user?.id) &&
                        String(user.id) === String(item.uploaderId)));

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDeliverableDetail(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDeliverableDetail(item);
                        }
                      }}
                      data-testid={`team-deliverable-item-${item.id}`}
                      data-deliverable-kind={isLinkItem ? "link" : "file"}
                      className="cursor-pointer rounded-[10px] border border-[var(--cc-outline-variant)] bg-[var(--cc-surface-container-low)] p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-[var(--cc-primary-border)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0">{item.kind === "link" ? "🔗" : "📄"}</span>
                          <span className="text-sm font-medium text-[var(--cc-on-surface)] truncate">{item.fileName}</span>
                        </div>
                        {item.subtitle && (
                          <p className="mt-0.5 text-xs text-[var(--cc-on-surface-variant)] line-clamp-1">
                            {item.subtitle}
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-1 text-xs text-[#4a5565] line-clamp-2">{item.description}</p>
                        )}
                        <p className="mt-1 text-xs text-[#6a7282]">
                          {item.uploaderName} · {item.kind === "link" ? "링크" : formatFileSize(item.fileSize)} ·{" "}
                          {new Date(item.createdAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={
                            isLinkItem
                              ? externalDeliverableHref(item.publicUrl)
                              : item.publicUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          download={isLinkItem ? undefined : item.fileName}
                          className="m3-btn m3-btn--tonal px-3 py-2 text-xs"
                        >
                          {isLinkItem ? "열기" : "다운로드"}
                        </a>
                        {canModifyDeliverable && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditDeliverableModal(item)}
                              disabled={uploadingDeliverable}
                              data-testid={`team-deliverable-edit-${item.id}`}
                              className="rounded border border-[#93c5fd] bg-white px-3 py-2 text-xs font-bold text-[#155dfc] hover:bg-[#eff6ff] disabled:opacity-60"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeliverable(item)}
                              disabled={uploadingDeliverable}
                              data-testid={`team-deliverable-delete-${item.id}`}
                              className="rounded border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {canUploadDeliverable && (
                <button
                  type="button"
                  onClick={openCreateDeliverableModal}
                  disabled={uploadingDeliverable}
                  data-testid="team-deliverable-upload-button"
                  className="w-full rounded-[10px] border border-dashed border-[#93c5fd] bg-[#eff6ff] py-3 text-sm font-bold text-[#155dfc] transition-colors hover:bg-[#dbeafe] disabled:opacity-60"
                >
                  {uploadingDeliverable ? "등록 중..." : "+ 산출물 등록 (링크 · 파일 · 폴더)"}
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽: 트러블슈팅 로그 */}
          <div className="m3-surface-card flex flex-col rounded-[14px] p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-[var(--cc-on-surface)]">🛠️ 트러블슈팅 로그</h2>
              <span className="text-xs text-[var(--cc-on-surface-variant)]">문제 해결 과정 및 피드백</span>
            </div>

            <div className="max-h-[480px] overflow-y-auto rounded-[10px] border border-[var(--cc-outline-variant)] bg-[var(--cc-surface-container-low)] p-4">
              <div className="space-y-4">
                <div
                  data-testid="team-trouble-ai-recommendation"
                  className={`rounded-[10px] border-2 border-dashed border-[#93c5fd] bg-gradient-to-br from-[#eff6ff] to-white p-4 shadow-sm ${
                    aiRecommendationLoading ? "cc-gemini-ai-box-loading" : ""
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#155dfc] px-2 py-0.5 text-[10px] font-bold text-white">
                      AI 추천
                    </span>
                    <span className="text-xs font-bold text-[#1e2939]">Gemini</span>
                    {aiRecommendation?.model &&
                      !aiRecommendationLoading &&
                      aiRecommendation.model !== "draft-db-only" && (
                      <span
                        className="text-[10px] text-[#6a7282]"
                        data-testid="team-trouble-ai-model"
                      >
                        ({aiRecommendation.model})
                      </span>
                    )}
                  </div>
                  {aiRecommendationLoading && (
                    <>
                      <AiGeneratingIndicator
                        size="sm"
                        message="팀 활동을 분석해 추천을 생성하는 중…"
                        testId="team-trouble-ai-loading"
                      />
                      <GeminiShimmerLines active lines={3} />
                    </>
                  )}
                  {!aiRecommendationLoading && aiRecommendationError && (
                    <p className="text-xs text-[#dc2626]" data-testid="team-trouble-ai-error">
                      {aiRecommendationError}
                    </p>
                  )}
                  {!aiRecommendationLoading && !aiRecommendationError && aiRecommendation && (
                    <>
                      <p className="text-xs">
                        <span className="font-bold text-[#fb2c36]">🚨 AI 진단:</span>{" "}
                        {aiRecommendation.problem}
                      </p>
                      {aiRecommendation.plan?.trim() ? (
                        <p className="mt-1 text-xs text-[#6a7282]">
                          <span className="font-bold">참고:</span> {aiRecommendation.plan}
                        </p>
                      ) : null}
                      {aiRecommendation.rationale &&
                        !aiRecommendation.rationale.startsWith("DB 초안") && (
                        <p className="mt-2 text-[10px] text-[#6a7282]">{aiRecommendation.rationale}</p>
                      )}
                    </>
                  )}
                </div>

                {troubleshootingLogs.map((log) => (
                  <div
                    key={log.id}
                    data-testid={`team-trouble-item-${log.id}`}
                    className={`m3-surface-card rounded-[10px] p-4 ${
                      log.status === "in-progress"
                        ? "border-[var(--cc-primary-border)] bg-[var(--cc-primary-container)]"
                        : "border-[var(--cc-outline-variant)]"
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
                        {canEditLog(log) && !isArchived && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTroubleshootingLog(log)}
                              className="text-[10px] text-[var(--cc-primary)] hover:underline"
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

                    <div className="mt-3 flex flex-col gap-2 border-t border-[var(--cc-outline-variant)] pt-3 sm:flex-row sm:items-center sm:flex-wrap">
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
                ))}
              </div>
            </div>

            {isStudent && !isArchived && !isMyTeamMember && (
              <p
                className="mt-4 rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600"
                data-testid="team-trouble-readonly-notice"
              >
                다른 팀 워크스페이스는 조회만 가능합니다. 트러블슈팅은 내 팀에서만 작성할 수 있습니다.
              </p>
            )}

            {canWriteTroubleshooting && (
              <button
                type="button"
                onClick={() => setShowTroubleshootingModal(true)}
                disabled={submittingLog}
                data-testid="team-trouble-register-open"
                className="mt-4 w-full rounded-[10px] border border-dashed border-[#93c5fd] bg-[#eff6ff] py-3 text-sm font-bold text-[#155dfc] transition-colors hover:bg-[#dbeafe] disabled:opacity-60"
              >
                + 기록등록
              </button>
            )}
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
                    } inline-flex min-w-[9.5rem] items-center justify-between gap-3 px-5 py-2 rounded-[14px] border font-medium hover:opacity-90 transition-all`}
                    onClick={() => toggleFeedback(option)}
                  >
                    <span>{option}</span>
                    {(feedbackCounts[option] ?? 0) > 0 && (
                      <span className="shrink-0 tabular-nums text-xs font-bold opacity-90">
                        {feedbackCounts[option]}
                      </span>
                    )}
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
                  <span>{customFeedbackText ? `"${customFeedbackText}"` : "| 기타 입력"}</span>
                  {(feedbackCounts["기타"] ?? 0) > 0 && (
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">
                      {feedbackCounts["기타"]}
                    </span>
                  )}
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

      <AppModal
        open={showChatModal}
        onClose={() => setShowChatModal(false)}
        testId="team-chat-modal-overlay"
        ariaLabel="채팅방"
        panelClassName="!p-0 flex max-w-[680px] w-full flex-col overflow-hidden rounded-[14px] shadow-2xl !max-h-[min(720px,90vh)]"
      >
            {/* 헤더 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 rounded-t-[14px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <h2 className="text-base font-bold text-black">
                  채팅방
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="cc-touch-target flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="채팅 닫기"
              >
                <span aria-hidden="true">✕</span>
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
                    <label htmlFor="team-chat-message-input" className="sr-only">
                      채팅 메시지
                    </label>
                    <input
                      id="team-chat-message-input"
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
      </AppModal>

      <AppModal
        open={Boolean(isProfessor && isEvaluationOpen && showEvalModal)}
        onClose={() => setShowEvalModal(false)}
        testId="professor-project-eval-modal-overlay"
        ariaLabel="학생 및 프로젝트 평가"
        panelClassName="!p-0 relative max-w-[1191px] w-full overflow-y-auto rounded-[10px] shadow-2xl"
      >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b border-gray-200 rounded-t-[10px] z-10">
              <h2 className="text-xl font-bold text-black sm:text-2xl">
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

            <div className="space-y-8 px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
              <p className="rounded-lg border border-blue-100 bg-[#eff6ff] px-4 py-3 text-center text-sm text-[#364153]">
                {projectEvalAutoHints.narrative}
              </p>
              {/* 1. 작업 완성도 */}
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-black sm:text-xl">
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
                <h3 className="text-center text-lg font-medium text-black sm:text-xl">
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
                <h3 className="text-center text-lg font-medium text-black sm:text-xl">
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
      </AppModal>

      <AppModal
        open={Boolean(isProfessor && isEvaluationOpen && showStudentEvalModal)}
        onClose={() => setShowStudentEvalModal(false)}
        testId="professor-student-eval-modal-overlay"
        ariaLabel="학생 평가"
        panelClassName="!p-0 max-w-[780px] w-full overflow-y-auto rounded-[10px] shadow-2xl"
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
              {allStudents.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                  이 팀에 등록된 팀원이 없습니다. 팀 멤버가 배정된 뒤 학생 평가를 작성할 수 있습니다.
                </p>
              )}
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
      </AppModal>

      <AppModal
        open={!isArchived && showFeedbackCustomModal}
        onClose={() => setShowFeedbackCustomModal(false)}
        testId="team-feedback-custom-modal-overlay"
        ariaLabel="피드백 작성"
        panelClassName="!p-0 max-w-[500px] w-full overflow-y-auto rounded-[10px] shadow-2xl"
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
      </AppModal>

      <AppModal
        open={showPeerReviewModal}
        onClose={() => setShowPeerReviewModal(false)}
        testId="team-peer-review-modal"
        ariaLabel="동료 평가"
        panelClassName="max-h-[92vh] max-w-4xl overflow-y-auto rounded-xl p-4 shadow-xl"
      >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPeerReviewModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-bold"
              >
                닫기
              </button>
            </div>
            <TeamPeerReviewPage />
      </AppModal>

      <AppModal
        open={showRetrospectiveModal}
        onClose={() => {
          setShowRetrospectiveModal(false);
          void refreshRetrospectiveStatus();
        }}
        testId="team-retrospective-modal"
        ariaLabel="회고"
        panelClassName="max-h-[92vh] max-w-4xl overflow-y-auto rounded-xl p-4 shadow-xl"
      >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRetrospectiveModal(false);
                  void refreshRetrospectiveStatus();
                }}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-bold"
              >
                닫기
              </button>
            </div>
            <TeamRetrospectivePage />
      </AppModal>

      <StudentQuickProfileModal
        profile={selectedMemberProfile}
        loading={memberProfileLoading}
        errorMessage={memberProfileError}
        onClose={closeMemberProfile}
      />

      <TeamDeliverableDetailModal
        open={detailDeliverable != null}
        item={detailDeliverable}
        canEdit={
          detailDeliverable != null &&
          !isArchived &&
          (isProfessor ||
            isAdmin ||
            (canUploadDeliverable &&
              Boolean(user?.id) &&
              String(user.id) === String(detailDeliverable.uploaderId)))
        }
        onClose={closeDeliverableDetail}
        onEdit={() => {
          if (!detailDeliverable) return;
          const item = detailDeliverable;
          closeDeliverableDetail();
          openEditDeliverableModal(item);
        }}
      />

      <TeamDeliverableSubmitModal
        open={showDeliverableModal && (canUploadDeliverable || editingDeliverable != null)}
        uploading={uploadingDeliverable}
        mode={editingDeliverable ? "edit" : "create"}
        editing={editingDeliverable}
        onClose={closeDeliverableModal}
        onSubmit={handleSubmitDeliverableModal}
      />

      <TeamTroubleshootingEditModal
        open={editingTroubleshootingLog != null}
        log={editingTroubleshootingLog}
        submitting={submittingLog}
        onClose={() => setEditingTroubleshootingLog(null)}
        onSubmit={handleUpdateTroubleshootingLog}
      />

      <TeamTroubleshootingSubmitModal
        open={showTroubleshootingModal && canWriteTroubleshooting}
        submitting={submittingLog}
        onClose={() => setShowTroubleshootingModal(false)}
        onSubmit={handleCreateTroubleshootingLog}
      />
    </div>
  );
}