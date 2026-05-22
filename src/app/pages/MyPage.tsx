import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import svgPaths from "../../imports/Group43/svg-bqpgzlg1zb";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/supabase-api";
import AiReportPrintView from "../components/AiReportPrintView";
import StudentReportA4Sheet, {
  reportTextToBullets,
  ReportCallout,
  ReportLabeledGrid,
  ReportSectionTitle,
} from "../components/StudentReportA4Sheet";
import EvalSchemaNotice from "../components/EvalSchemaNotice";
import type { AiReportContext, AiReportGenerateResponse } from "../types/ai-report";

const REPORT_PAGES = [
  { id: 1, title: "역량 및 활동 요약", prevLabel: null, nextLabel: "주요 팀플 상세" },
  { id: 2, title: "주요 팀플 상세", prevLabel: "역량 및 활동 요약", nextLabel: "문제해결 경험" },
  { id: 3, title: "문제해결 경험", prevLabel: "주요 팀플 상세", nextLabel: null },
] as const;

interface PeerReview {
  text: string;
  count: number;
}

interface ProblemCase {
  problem: string;
  solution: string;
  result: string;
}

interface Project {
  title: string;
  subtitle: string;
  tags: string[];
  period: string;
  role: string;
  completionRate: number;
  contributions: string[];
  problemCase: ProblemCase;
  techStack: string[];
  insights: string;
  peerReviews: PeerReview[];
  professorReview: string;
}

export default function MyPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reportPage, setReportPage] = useState(1);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReportMessage, setAiReportMessage] = useState<string | null>(null);
  const [reportActivitySummary, setReportActivitySummary] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AiReportGenerateResponse | null>(null);
  const { user, isProfessor, refreshProfile } = useAuth();
  const canViewStudentReport = user?.role === "student";
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({
    name: "",
    major: "",
    bio: "",
    skills: [] as string[],
  });
  const [profileEditSkillDraft, setProfileEditSkillDraft] = useState("");
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [missingEvalTables, setMissingEvalTables] = useState<string[]>([]);
  const [legacyPeerDisplayTable, setLegacyPeerDisplayTable] = useState(false);

  const loadAiReport = useCallback(
    async (context: AiReportContext) => {
      if (!user?.id || !canViewStudentReport) return;
      setAiReportLoading(true);
      setAiReportMessage(null);
      try {
        const result = await api.aiReport.generateReport({
          userId: user.id,
          locale: "ko",
        });
        setAiReport(result);
        setReportActivitySummary(api.aiReport.formatActivitySummary(context));
        if (result.model === "draft-db-only") {
          setAiReportMessage(
            "활동 집계 초안으로 채웠습니다. Supabase Secret GEMINI_API_KEY가 있으면 AI 문단으로 갱신됩니다."
          );
        } else {
          setAiReportMessage(`리포트 문단을 AI로 채웠습니다. (${result.model ?? "LLM"})`);
        }
      } catch (err) {
        const fallback = api.aiReport.buildDraftFromContext(context);
        setAiReport(fallback);
        if (err instanceof Error && err.name === "AiReportNotReady") {
          setAiReportMessage(
            `${err.message} DB 집계 초안으로 표시합니다.`
          );
        } else {
          setAiReportMessage(
            err instanceof Error ? err.message : "AI 리포트를 불러오지 못해 DB 초안을 표시합니다."
          );
        }
      } finally {
        setAiReportLoading(false);
      }
    },
    [user?.id, canViewStudentReport]
  );

  function handlePrintReport() {
    window.print();
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [reportContext, setReportContext] = useState<AiReportContext | null>(null);
  const [reportContextReady, setReportContextReady] = useState(false);
  const [reportLoadError, setReportLoadError] = useState<string | null>(null);
  const reportHasArchivedTeams = (reportContext?.teams.length ?? 0) > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.myPage.getProjectsForUser();
      } catch {
        // reportContext effect에서 프로젝트 카드 설정
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== "student") return;
    const student = user;
    setProfileEditForm({
      name: student.name ?? "",
      major: student.major ?? "",
      bio: student.bio ?? "",
      skills: [...(student.skills ?? [])],
    });
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setReportContext(null);
      setReportLoadError(null);
      setReportContextReady(true);
      return;
    }
    let cancelled = false;
    setReportContextReady(false);
    setReportLoadError(null);
    api.aiReport
      .gatherContext(user.id)
      .then((ctx) => {
        if (!cancelled) {
          setReportContext(ctx);
          setReportLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReportContext(null);
          setReportLoadError(
            err instanceof Error ? err.message : "리포트 집계를 불러오지 못했습니다."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setReportContextReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!canViewStudentReport || !reportContext || !reportContextReady) return;
    void loadAiReport(reportContext);
  }, [canViewStudentReport, reportContext, reportContextReady, loadAiReport]);

  const reportView = useMemo(() => {
    if (!reportContext) return null;
    return api.aiReport.buildMyPageReportView(reportContext, aiReport);
  }, [reportContext, aiReport]);

  useEffect(() => {
    if (!user?.id) {
      setProfileImageUrl(null);
      return;
    }
    let cancelled = false;
    void api.myPage
      .getProfile()
      .then((profile) => {
        if (!cancelled) setProfileImageUrl(profile.imageUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfileImageUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.role !== "student") {
      setMissingEvalTables([]);
      setLegacyPeerDisplayTable(false);
      return;
    }
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
  }, [user?.role]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMessage("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    setAvatarUploading(true);
    setAvatarMessage(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
        reader.readAsDataURL(file);
      });
      const saved = await api.myPage.updateAvatar(dataUrl);
      setProfileImageUrl(saved);
      setAvatarMessage("프로필 이미지가 저장되었습니다.");
    } catch (err) {
      setAvatarMessage(err instanceof Error ? err.message : "이미지 저장에 실패했습니다.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!reportContextReady || projectsLoading) return;

    if (reportContext) {
      setProjects(
        reportContext.teams.length > 0
          ? api.aiReport.mapToMyPageProjects(reportContext)
          : []
      );
      return;
    }
  }, [reportContext, reportContextReady, projectsLoading]);

  async function handleSaveStudentProfile() {
    if (user?.role !== "student") return;
    setProfileSaving(true);
    setProfileSaveMessage(null);
    try {
      const saved = await api.myPage.saveStudentProfile(profileEditForm);
      setProfileEditForm(saved);
      await refreshProfile();
      setProfileSaveMessage("프로필이 저장되었습니다.");
      setShowProfileEdit(false);
    } catch (err) {
      setProfileSaveMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  }

  const sideNavItems = ["요약 리포트", "상세 리포트", "내 정보 조회", "내 정보 수정"];
  const currentReportPage = REPORT_PAGES[reportPage - 1] ?? REPORT_PAGES[0];
  const profileName = user?.name ?? "로그인 사용자";
  const profileEmail = user?.email ?? "-";
  const profileInitial = profileName.slice(0, 1);
  const profileSchoolAndMajor =
    user?.role === "student"
      ? `숭실대학교 ${user.major || "전공 미입력"}`
      : user?.role === "professor"
        ? `숭실대학교 ${user.department || "소속 미입력"} 교수`
        : "로그인 사용자";

  const activitySummary = reportContext
    ? {
        teamCount: reportContext.teams.length,
        troubleshootingCount: reportContext.totalTroubleshootingLogs,
        deliverableCount: reportContext.totalDeliverables,
        avgProgress:
          reportContext.teams.length > 0
            ? Math.round(
                reportContext.teams.reduce((sum, team) => sum + team.progress, 0) /
                  reportContext.teams.length
              )
            : 0,
      }
    : null;

  const analysisDateLabel = new Date().toLocaleDateString("ko-KR");
  const projectCountLabel = activitySummary?.teamCount ?? projects.length;
  const summaryCards = reportView
    ? reportView.summaryCards
    : reportContext
    ? api.aiReport.buildSummaryCards(reportContext)
    : activitySummary
    ? [
        {
          label: "참여 팀 프로젝트",
          value: `${activitySummary.teamCount}건`,
          note: "Supabase 팀 멤버십 기준",
        },
        {
          label: "평균 진행률",
          value: `${activitySummary.avgProgress}%`,
          note: "팀 progress 평균",
        },
        {
          label: "트러블슈팅",
          value: `${activitySummary.troubleshootingCount}건`,
          note: `산출물 ${activitySummary.deliverableCount}건`,
        },
      ]
    : [
        {
          label: "참여 프로젝트",
          value: `${projects.length}건`,
          note: "표시 중인 카드 수 (데모 포함 가능)",
        },
        { label: "평균 완성도", value: "—", note: "팀 데이터 로드 후 표시" },
        { label: "활동 로그", value: "—", note: "DB 집계 대기" },
      ];

  const summaryParagraph = reportView
    ? reportView.summaryParagraph
    : reportContext
      ? api.aiReport.buildSummaryParagraph(reportContext)
      : activitySummary
        ? activitySummary.teamCount > 0
          ? `${profileName} 학생은 ${activitySummary.teamCount}개 팀 프로젝트에 참여했으며, 트러블슈팅 ${activitySummary.troubleshootingCount}건·산출물 ${activitySummary.deliverableCount}건이 기록되어 있습니다. 평균 진행률은 ${activitySummary.avgProgress}%입니다.`
          : `${profileName} 학생의 팀 활동 기록이 아직 없습니다. 수업에 등록하고 팀에 배정되면 여기에 집계됩니다.`
        : aiReportLoading
          ? "AI가 리포트 문단을 작성하는 중입니다…"
          : `${profileName} 학생의 활동 데이터를 불러오는 중입니다.`;

  const dbTechnologyChips = reportView
    ? reportView.technologyChips
    : reportContext
      ? api.aiReport.buildTechnologies(reportContext)
      : [];
  const showDbSkills =
    reportView !== null ||
    (reportContext &&
      (reportContext.skills.length > 0 ||
        reportContext.totalDeliverables > 0 ||
        dbTechnologyChips.some((chip) => !chip.startsWith("("))));

  const DEMO_COMPETENCY_ITEMS = [
    { label: "프로젝트 실행력", value: 92, desc: "기한 내 산출물 제출과 발표 준비가 안정적입니다." },
    { label: "협업 신뢰도", value: 90, desc: "동료평가에서 책임감과 시간 약속 관련 긍정 키워드가 반복됩니다." },
    { label: "프론트엔드 구현", value: 86, desc: "React 기반 UI 구현과 반응형 문제 해결 경험이 확인됩니다." },
    { label: "문제 해결/회고", value: 82, desc: "트러블슈팅 로그를 남기고 원인-계획-해결을 정리하는 습관이 있습니다." },
  ];

  const competencyItems =
    reportView && reportHasArchivedTeams
      ? reportView.competencyItems
      : reportContext && reportHasArchivedTeams
        ? api.aiReport.buildCompetencyItems(reportContext)
        : reportContextReady
          ? []
          : DEMO_COMPETENCY_ITEMS;

  const activityBullets =
    reportView && reportHasArchivedTeams
      ? reportView.activityBullets
      : reportContext && reportHasArchivedTeams
        ? api.aiReport.buildActivityBullets(reportContext)
        : reportContextReady
          ? [
              {
                title: "활동 기록",
                body: "종료된 팀플 참여 기록이 없습니다. doc/for_human/38_archived_kim_student_setup.md 시드 적용 후 페이지를 새로고침하세요.",
              },
            ]
          : [
              { title: "기획", body: "사용자 인터뷰와 페르소나를 바탕으로 서비스 방향을 정리했습니다." },
              { title: "구현", body: "React 기반 화면 구현, 반응형 레이아웃, 데이터 연동 흐름을 담당했습니다." },
              {
                title: "협업",
                body: "역할 분담, 발표 자료, 트러블슈팅 기록을 문서화하며 팀 진행을 안정화했습니다.",
              },
            ];

  const DEMO_TROUBLESHOOTING_CASES = [
    {
      title: "모바일 레이아웃 깨짐 원인 분석",
      problem:
        "모바일 화면에서 카드와 폼 영역이 겹치고 일부 요소가 화면 밖으로 밀리는 현상이 발생했습니다.",
      action:
        "CSS 클래스 충돌과 고정 폭 사용을 원인으로 파악하고, grid/flex 기준의 반응형 레이아웃으로 재구성했습니다.",
      result: "모든 주요 화면에서 모바일, 태블릿, 데스크톱 순서로 자연스럽게 콘텐츠가 재배치되도록 개선했습니다.",
      impact: "사용자 기기 크기와 관계없이 동일한 기능 접근성을 확보했습니다.",
      courseName: "",
      projectTitle: "",
    },
    {
      title: "Firebase 로그인과 Supabase 유저 프로필 연결",
      problem:
        "로그인 계정과 서비스 내부 유저 정보가 분리되어 수업/팀 데이터 조회 기준이 불명확했습니다.",
      action:
        "Firebase uid를 `ai_users`의 단일 사용자 기준으로 연결하고, 수업 소속과 팀원 데이터를 user_id 기반으로 재정리했습니다.",
      result:
        "로그인 학생 계정 기준으로 수업, 수강자, 팀, 팀 워크스페이스 데이터를 일관되게 로드할 수 있게 되었습니다.",
      impact: "인증과 서비스 데이터의 기준을 통합해 향후 권한 관리와 개인화 조회의 기반을 마련했습니다.",
      courseName: "",
      projectTitle: "",
    },
  ];

  const troubleshootingCases =
    reportView && reportView.troubleshootingCases.length > 0
      ? reportView.troubleshootingCases
      : reportContext && reportContext.troubleshootingCases.length > 0
        ? reportContext.troubleshootingCases
        : reportContextReady
          ? []
          : DEMO_TROUBLESHOOTING_CASES;

  const page3UsesDb = Boolean(
    reportView?.troubleshootingCases.length ||
      (reportContext && reportContext.troubleshootingCases.length > 0)
  );

  const page3Intro = reportView
    ? reportView.page3Intro
    : reportContext
      ? api.aiReport.buildPage3Intro(reportContext)
      : `${profileName} 학생의 문제해결 경험은 단순 오류 수정이 아니라, 원인 파악, 구조 재정리, 재발 방지까지 이어지는 방식으로 기록되어 있습니다. (DB 로그가 없어 예시 사례를 표시합니다.)`;

  const teamDetailBodies = reportView?.teamDetailBodies ?? {};

  const summaryBullets = useMemo(
    () => reportTextToBullets(summaryParagraph, 4),
    [summaryParagraph]
  );
  const page3Bullets = useMemo(() => reportTextToBullets(page3Intro, 3), [page3Intro]);

  const printReportPayload = useMemo(() => {
    if (!reportContext) return null;
    return aiReport ?? api.aiReport.buildDraftFromContext(reportContext);
  }, [reportContext, aiReport]);

  return (
    <div className="min-h-screen bg-[#f0f0f0]" data-testid="mypage-page">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 lg:flex-row lg:items-start lg:px-8">
        {/* 사이드 네비게이션 바 */}
        <aside className="w-full rounded-[14px] bg-white p-5 shadow-md lg:sticky lg:top-8 lg:w-[240px] lg:shrink-0">
          <p className="mb-4 text-[18px] font-bold text-black">마이페이지 메뉴</p>
          <nav className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sideNavItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === "내 정보 수정" && user?.role === "student") {
                    setShowProfileEdit(true);
                    document.getElementById("mypage-profile-section")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }
                }}
                className={`whitespace-nowrap rounded-[10px] border px-5 py-3 text-left text-[15px] font-bold transition-colors lg:w-full ${
                  item === "내 정보 수정" && showProfileEdit
                    ? "border-[#155dfc] bg-[#155dfc] text-white"
                    : "border-[#dbeafe] bg-[#eff6ff] text-[#155dfc] hover:bg-[#dbeafe]"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          {canViewStudentReport && (
            <div className="mt-6 border-t border-[#e5e7eb] pt-4">
              <Link
                to="/app/mypage/archived-courses"
                className="block w-full rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-5 py-3 text-center text-[15px] font-bold text-[#155dfc] hover:bg-[#dbeafe] lg:text-left"
                data-testid="mypage-archived-courses-nav"
              >
                과거 수업
              </Link>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">
        {/* 페이지 헤더 */}
        <h1 className="text-[30px] font-bold text-black mb-10">마이페이지</h1>

        {/* 프로필 섹션 */}
        <div
          id="mypage-profile-section"
          className="mb-8 flex min-h-[400px] flex-col items-center gap-8 rounded-[14px] bg-[rgba(255,255,255,0.9)] p-8 shadow-md md:flex-row"
        >
          {/* 프로필 아바타 */}
          <div className="flex shrink-0 flex-col items-center gap-3 md:w-[240px]">
            <div className="flex h-[171px] w-[170px] items-center justify-center overflow-hidden rounded-full bg-[#1862ff] text-[35px] font-bold text-white">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                profileInitial
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
                className="flex h-[33px] w-[33px] items-center justify-center rounded-[6px] border border-black bg-black disabled:opacity-50"
                title="프로필 이미지 변경"
              >
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24.1667 22.9233">
                  <path
                    d={svgPaths.p38455680}
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            {avatarMessage && (
              <p className="max-w-[170px] text-center text-[10px] font-medium text-[#475569]">
                {avatarMessage}
              </p>
            )}
          </div>

          {/* 프로필 정보 */}
          <div className="w-full space-y-6 pt-2">
            {/* 이름과 이메일 행 */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* 이름 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[20px] font-bold text-black">이름</p>
                  <button className="w-[24px] h-[24px] opacity-70 hover:opacity-100 transition-opacity">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 17.6 17.1032">
                      <path
                        d={svgPaths.p18804b80}
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>
                <div className="bg-[rgba(255,255,255,0.9)] rounded-[10px] h-[48px] px-5 flex items-center border border-[#e5e7eb]">
                  <p className="text-[20px] font-bold text-black">{profileName}</p>
                </div>
              </div>

              {/* 이메일 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[20px] font-bold text-black">이메일</p>
                  <button className="w-[24px] h-[24px] opacity-70 hover:opacity-100 transition-opacity">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 17.6 17.1032">
                      <path
                        d={svgPaths.p18804b80}
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>
                <div className="bg-[rgba(255,255,255,0.9)] rounded-[10px] h-[48px] px-5 flex items-center border border-[#e5e7eb]">
                  <p className="text-[20px] font-bold text-black">{profileEmail}</p>
                </div>
              </div>
            </div>

            {/* 학교 및 학과 */}
            <div>
              <p className="text-[20px] font-bold text-black mb-2">학교 및 학과</p>
              <div className="bg-[rgba(255,255,255,0.9)] rounded-[10px] md:h-[48px] px-5 flex items-center border border-[#e5e7eb]">
                <p className="text-[18px] font-bold text-black">
                  {profileSchoolAndMajor}
                </p>
              </div>
            </div>

            {user?.role === "student" && showProfileEdit && (
              <div
                className="rounded-[10px] border border-[#dbeafe] bg-[#f8fbff] p-5"
                data-testid="mypage-profile-edit-form"
              >
                <p className="mb-3 text-[16px] font-bold text-[#155dfc]">내 정보 수정</p>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    이름
                    <input
                      type="text"
                      value={profileEditForm.name}
                      onChange={(e) =>
                        setProfileEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    전공
                    <input
                      type="text"
                      value={profileEditForm.major}
                      onChange={(e) =>
                        setProfileEditForm((f) => ({ ...f, major: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    자기소개
                    <textarea
                      value={profileEditForm.bio}
                      onChange={(e) =>
                        setProfileEditForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <div>
                    <p className="text-sm font-medium text-gray-700">기술 태그</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profileEditForm.skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            setProfileEditForm((f) => ({
                              ...f,
                              skills: f.skills.filter((s) => s !== skill),
                            }))
                          }
                          className="rounded-full bg-[#155dfc] px-3 py-1 text-xs font-bold text-white"
                        >
                          {skill} ×
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={profileEditSkillDraft}
                        onChange={(e) => setProfileEditSkillDraft(e.target.value)}
                        placeholder="태그 추가"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const t = profileEditSkillDraft.trim();
                          if (!t || profileEditForm.skills.includes(t)) return;
                          if (profileEditForm.skills.length >= 12) return;
                          setProfileEditForm((f) => ({
                            ...f,
                            skills: [...f.skills, t],
                          }));
                          setProfileEditSkillDraft("");
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={() => void handleSaveStudentProfile()}
                      className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {profileSaving ? "저장 중…" : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProfileEdit(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700"
                    >
                      취소
                    </button>
                  </div>
                  {profileSaveMessage && (
                    <p className="text-xs font-medium text-[#475569]">{profileSaveMessage}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {canViewStudentReport ? (
          <>
            <EvalSchemaNotice
              missingTables={missingEvalTables}
              legacyPeerDisplayTable={legacyPeerDisplayTable}
            />
            {reportLoadError && (
              <div
                className="mx-auto mb-4 w-full max-w-[794px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                data-testid="mypage-report-load-error"
              >
                <p className="font-bold">리포트 데이터를 불러오지 못했습니다.</p>
                <p className="mt-1">{reportLoadError}</p>
                <p className="mt-2 text-xs text-red-800">
                  Supabase 연결·RLS·번들 v2(`20260520102000_team_detail_writes_bundle_v2.sql`) 적용 여부를
                  확인하세요. 시드: `npm run verify:archived-kim`
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800"
                  onClick={() => {
                    if (!user?.id) return;
                    setReportContextReady(false);
                    setReportLoadError(null);
                    void api.aiReport
                      .gatherContext(user.id)
                      .then((ctx) => {
                        setReportContext(ctx);
                        setReportLoadError(null);
                      })
                      .catch((err) => {
                        setReportContext(null);
                        setReportLoadError(
                          err instanceof Error ? err.message : "리포트 집계를 불러오지 못했습니다."
                        );
                      })
                      .finally(() => setReportContextReady(true));
                  }}
                >
                  다시 시도
                </button>
              </div>
            )}
            <div
              id="mypage-report-print-root"
              className="mx-auto w-full max-w-[210mm] print:absolute print:left-0 print:top-0 print:z-[9999] print:max-w-none"
            >
            <div
              className="mb-3 flex flex-col gap-3 rounded-xl border border-[#dbe7ff] bg-[#f8fafc] px-4 py-3 print:hidden"
              data-testid="mypage-report-toolbar"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12px] font-black text-[#155dfc]">리포트</p>
                  <p className="mt-0.5 text-[14px] font-bold text-[#334155]">
                    {reportPage} / 3 · {currentReportPage.title}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="mypage-report-prev"
                    onClick={() => setReportPage((page) => Math.max(1, page - 1))}
                    disabled={reportPage === 1}
                    className="inline-flex items-center gap-1 rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-[13px] font-bold text-[#334155] hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {currentReportPage.prevLabel ?? "이전"}
                  </button>
                  <button
                    type="button"
                    data-testid="mypage-report-next"
                    onClick={() => setReportPage((page) => Math.min(3, page + 1))}
                    disabled={reportPage === 3}
                    className="inline-flex items-center gap-1 rounded-full bg-[#155dfc] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
                  >
                    {currentReportPage.nextLabel ?? "다음"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    disabled={aiReportLoading || !reportContext}
                    data-testid="mypage-a4-print-button"
                    className="rounded-lg bg-[#155dfc] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
                  >
                    A4 인쇄 / PDF
                  </button>
                </div>
              </div>
              {reportActivitySummary && (
                <p
                  className="text-[10px] font-medium text-[#155dfc]"
                  data-testid="report-activity-summary"
                >
                  {reportActivitySummary}
                </p>
              )}
              {aiReportLoading && (
                <p className="text-[10px] font-medium text-[#155dfc]" data-testid="ai-report-loading">
                  AI가 리포트 문단을 작성하는 중입니다…
                </p>
              )}
              {!aiReportLoading && aiReportMessage && (
                <p className="text-[10px] text-[#64748b]" data-testid="ai-report-message">
                  {aiReportMessage}
                </p>
              )}
            </div>

            <StudentReportA4Sheet>
          <div className="bg-[#0f172a] px-7 py-5 text-white sm:px-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wide text-blue-100">
                  CampusConnect Student Performance Report
                </p>
                <h2 className="text-[24px] font-black leading-tight sm:text-[28px]">
                  팀 프로젝트 종합 역량 리포트
                </h2>
                <p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-300">
                  수강 이력, 팀 배정, 프로젝트 산출물, 트러블슈팅 로그, 동료평가, 교수 피드백을 종합하여
                  학생의 수행 역량과 성장 가능성을 정리한 요약 보고서입니다.
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-3 text-[10px] leading-5 text-slate-200">
                <p>대상 학생: <span className="font-bold text-white">{profileName}</span></p>
                <p>분석 기준일: <span className="font-bold text-white">{analysisDateLabel}</span></p>
                <p>
                  분석 범위:{" "}
                  <span className="font-bold text-white">팀 프로젝트 {projectCountLabel}건</span>
                  {activitySummary ? " (DB)" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-7 py-5 text-[11px] leading-relaxed text-[#334155] sm:px-9">
            {reportPage === 1 && (
              <div className="space-y-4">
                <div
                  className={`grid grid-cols-1 gap-3 ${reportContext ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}
                  data-testid={reportContext ? "mypage-summary-cards" : undefined}
                >
                  {summaryCards.map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#dbe7ff] bg-[#f8fbff] p-4">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#476582]">{item.label}</p>
                      <p className="mt-1.5 text-[22px] font-black text-[#0f3ea8]">{item.value}</p>
                      <p className="mt-1.5 text-[10px] leading-4 text-[#60748a]">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <ReportSectionTitle kicker="Page 01" title="역량 및 주요 팀플 활동 요약" />
                  {summaryBullets.length > 1 ? (
                    <ul
                      className="list-disc space-y-1.5 pl-4 text-[11px] leading-[1.65] text-[#334155]"
                      data-testid={reportContext ? "mypage-summary-paragraph" : undefined}
                    >
                      {summaryBullets.map((line) => (
                        <li key={line.slice(0, 48)}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <ReportCallout>
                      <p
                        className="text-[11px] leading-[1.65] text-[#334155]"
                        data-testid={reportContext ? "mypage-summary-paragraph" : undefined}
                      >
                        {summaryParagraph}
                      </p>
                    </ReportCallout>
                  )}
                </div>

                <div className="rounded-xl border border-[#dbe7ff] bg-white p-4">
                  <p className="text-[10px] font-black text-[#155dfc]">CORE TECHNICAL SKILLS</p>
                  <h3 className="mt-1.5 text-[17px] font-black text-[#101828]">보유 핵심 기술 역량</h3>
                  {showDbSkills ? (
                    <div className="mt-3" data-testid="mypage-db-skills">
                      <p className="mb-2 text-[10px] text-[#64748b]">Supabase 프로필·산출물 기준</p>
                      <div className="flex flex-wrap gap-2">
                        {dbTechnologyChips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full bg-[#eff6ff] px-3 py-1 text-[10px] font-bold text-[#155dfc]"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#64748b]">
                      종료 팀플·프로필 데이터가 쌓이면 기술 태그가 여기에 표시됩니다.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div
                    className="rounded-xl border border-gray-200 p-4"
                    data-testid={reportContext ? "mypage-competency-db" : undefined}
                  >
                    <h3 className="text-[15px] font-black text-[#101828]">
                      핵심 역량 진단{reportContext ? " (DB)" : ""}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {competencyItems.length === 0 ? (
                        <p className="text-[11px] text-[#64748b]">
                          종료 팀플 데이터가 없어 역량 점수를 계산할 수 없습니다.
                        </p>
                      ) : (
                        competencyItems.map((item) => (
                          <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-bold text-[#1e293b]">{item.label}</p>
                                <p className="text-[10px] text-[#64748b]">{item.desc}</p>
                              </div>
                              <span className="text-[11px] font-black text-[#155dfc]">{item.value}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#e8eef8]">
                              <div
                                className="h-full rounded-full bg-[#155dfc]"
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-xl border border-gray-200 bg-[#fbfcff] p-4"
                    data-testid={reportContext ? "mypage-activity-bullets" : undefined}
                  >
                    <h3 className="text-[15px] font-black text-[#101828]">간략 활동 요약</h3>
                    <ul className="mt-3 space-y-2">
                      {activityBullets.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2"
                        >
                          <p className="text-[10px] font-black text-[#155dfc]">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-[#475569]">
                            {item.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {reportPage === 2 && (
              <div>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[#155dfc]">PAGE 02 PROJECT DETAIL</p>
                    <h3 className="text-[17px] font-black text-[#101828]">주요 팀플 상세 조회</h3>
                  </div>
                  <p className="text-[10px] text-[#64748b]">
                    {reportHasArchivedTeams
                      ? "종료(archived) 수업 팀플만 집계합니다."
                      : reportContextReady
                        ? "종료된 팀플 기록이 없습니다."
                        : "프로젝트 불러오는 중…"}
                  </p>
                </div>

                {reportContextReady && !reportHasArchivedTeams && (
                  <div
                    className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-900"
                    data-testid="mypage-report-empty-archived"
                  >
                    <p className="font-bold">종료된 팀플이 리포트에 없습니다.</p>
                    <p className="mt-1">
                      Supabase에 아카이브 수업·팀 멤버십이 있어야 합니다. 인간용 가이드:{" "}
                      <code className="rounded bg-white px-1">doc/for_human/38_archived_kim_student_setup.md</code>
                      — 시드 SQL 적용 후 페이지를 새로고침하세요.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {reportContext && reportContext.teams.length > 0
                    ? reportContext.teams.map((team, index) => (
                        <div
                          key={team.teamId}
                          className="rounded-xl border border-[#dbe7ff] bg-white p-4 text-left shadow-sm"
                          data-testid={index === 0 ? "mypage-team-card-db" : undefined}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[9px] font-bold text-[#64748b]">
                                TEAM {String(index + 1).padStart(2, "0")} · DB
                              </p>
                              <h4 className="mt-1 text-[15px] font-black text-[#101828]">
                                {team.projectTitle}
                              </h4>
                              <p className="mt-1 text-[10px] text-[#64748b]">
                                {team.courseName} · {team.memberRole}
                              </p>
                            </div>
                            <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[10px] font-black text-[#155dfc]">
                              {team.progress}%
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[10.5px] leading-5 text-[#475569]">
                            <p>
                              팀명: <span className="font-bold text-[#1e293b]">{team.teamName}</span>
                            </p>
                            <p>
                              트러블슈팅{" "}
                              <span className="font-bold text-[#1e293b]">
                                {team.troubleshootingCount}건
                              </span>
                              {" · "}
                              산출물{" "}
                              <span className="font-bold text-[#1e293b]">
                                {team.deliverableCount}건
                              </span>
                            </p>
                            {team.deliverableFileNames.length > 0 && (
                              <p>
                                산출물:{" "}
                                <span className="font-bold text-[#1e293b]">
                                  {team.deliverableFileNames.join(", ")}
                                </span>
                              </p>
                            )}
                            {team.sampleProblems.length > 0 && (
                              <p>주요 이슈: {team.sampleProblems.join(" / ")}</p>
                            )}
                            <p className="flex flex-wrap gap-1.5 pt-1">
                              {team.feedbackSubmitted && (
                                <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[9px] font-bold text-[#047857]">
                                  피드백 ✓
                                </span>
                              )}
                              {team.retrospectiveSubmitted && (
                                <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[9px] font-bold text-[#155dfc]">
                                  회고 ✓
                                </span>
                              )}
                              {team.peerReviewsSubmitted > 0 && (
                                <span className="rounded-full bg-[#f5f3ff] px-2 py-0.5 text-[9px] font-bold text-[#6d28d9]">
                                  동료평가 {team.peerReviewsSubmitted}
                                </span>
                              )}
                              {(team.professorStudentEvalReceived ||
                                team.professorProjectEvalReceived) && (
                                <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[9px] font-bold text-[#c2410c]">
                                  교수평가 ✓
                                </span>
                              )}
                            </p>
                            {teamDetailBodies[team.teamId] && (
                              <p
                                className="mt-2 line-clamp-3 rounded-lg border border-[#e8eef8] bg-[#f8fbff] px-2.5 py-2 text-[10px] leading-snug text-[#334155]"
                                data-testid={index === 0 ? "mypage-team-ai-body" : undefined}
                              >
                                {teamDetailBodies[team.teamId]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    : projects.length > 0
                      ? projects.map((project, index) => (
                        <button
                          key={`${project.title}-${index}`}
                          onClick={() => setSelectedProject(project)}
                          className="rounded-xl border border-[#dbe7ff] bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#155dfc] hover:shadow-md"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[9px] font-bold text-[#64748b]">
                                CASE {String(index + 1).padStart(2, "0")}
                              </p>
                              <h4 className="mt-1 text-[15px] font-black text-[#101828]">
                                {project.title}
                              </h4>
                              <p className="mt-1 text-[10px] text-[#64748b]">{project.subtitle}</p>
                            </div>
                            <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[10px] font-black text-[#155dfc]">
                              {project.completionRate}%
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[10.5px] leading-5 text-[#475569]">
                            <p>
                              기간/팀:{" "}
                              <span className="font-bold text-[#1e293b]">{project.period}</span>
                            </p>
                            <p>
                              담당 역할:{" "}
                              <span className="font-bold text-[#1e293b]">{project.role}</span>
                            </p>
                            <p>핵심 성과: {project.problemCase.result}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {project.techStack.slice(0, 5).map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[9px] font-bold text-[#155dfc]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))
                      : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500 lg:col-span-2">
                          실제 참여한 종료 팀플 기록이 아직 없습니다.
                        </div>
                      )}
                </div>
              </div>
            )}

            {reportPage === 3 && (
              <div className="space-y-5">
                <div>
                  <ReportSectionTitle kicker="Page 03" title="가장 주목해야 할 문제해결 경험" />
                  {page3Bullets.length > 1 ? (
                    <ul
                      className="list-disc space-y-1.5 pl-4 text-[11px] leading-[1.65] text-[#334155]"
                      data-testid={page3UsesDb ? "mypage-page3-intro" : undefined}
                    >
                      {page3Bullets.map((line) => (
                        <li key={line.slice(0, 40)}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <ReportCallout>
                      <p
                        className="text-[11px] leading-[1.65]"
                        data-testid={page3UsesDb ? "mypage-page3-intro" : undefined}
                      >
                        {page3Intro}
                      </p>
                    </ReportCallout>
                  )}
                </div>

                <div className="space-y-4" data-testid="mypage-troubleshooting-list">
                  {troubleshootingCases.length === 0 && reportContextReady && (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                      등록된 트러블슈팅 로그가 없습니다.
                    </p>
                  )}
                  {troubleshootingCases.map((caseItem, index) => (
                    <div
                      key={"logId" in caseItem ? caseItem.logId : `${caseItem.title}-${index}`}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                      data-testid={index === 0 && page3UsesDb ? "mypage-troubleshooting-case" : undefined}
                    >
                      <p className="text-[9px] font-black text-[#64748b]">
                        PROBLEM SOLVING CASE {index + 1}
                        {page3UsesDb ? " · DB" : ""}
                      </p>
                      <h4 className="mt-1.5 text-[15px] font-black text-[#155dfc]">{caseItem.title}</h4>
                      {"courseName" in caseItem && caseItem.courseName ? (
                        <p className="mt-1 text-[10px] text-[#64748b]">
                          {caseItem.courseName}
                          {caseItem.projectTitle ? ` · ${caseItem.projectTitle}` : ""}
                        </p>
                      ) : null}
                      <ReportLabeledGrid
                        items={[
                          { label: "문제", value: caseItem.problem },
                          { label: "조치", value: caseItem.action },
                          { label: "결과", value: caseItem.result },
                          { label: "의미", value: caseItem.impact },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
            </StudentReportA4Sheet>

            {printReportPayload && reportContext && (
              <div className="hidden print:block">
                <AiReportPrintView context={reportContext} report={printReportPayload} inline />
              </div>
            )}
            </div>
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #mypage-report-print-root,
                #mypage-report-print-root * { visibility: visible; }
                #mypage-report-print-root {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
              }
            `}</style>
          </>
        ) : isProfessor && user?.role === "professor" ? (
          <section
            className="mx-auto w-full max-w-[794px] rounded-[10px] border border-[#d9e2f2] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
            data-testid="mypage-professor-dashboard"
          >
            <p className="text-[11px] font-black text-[#155dfc]">PROFESSOR DASHBOARD</p>
            <h2 className="mt-2 text-[22px] font-black text-[#0f172a]">교수 마이페이지</h2>
            <p className="mt-3 text-[13px] leading-6 text-[#475569]">
              학생용 팀플 리포트는 학생 계정에서만 열람할 수 있습니다. 아래에서 소속·연구 정보를 확인하고 수업·평가
              메뉴로 이동하세요.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <dt className="text-[10px] font-bold uppercase text-[#64748b]">소속</dt>
                <dd className="mt-1 text-[15px] font-bold text-[#0f172a]">
                  {user.department || "미입력"}
                </dd>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <dt className="text-[10px] font-bold uppercase text-[#64748b]">연구실</dt>
                <dd className="mt-1 text-[15px] font-bold text-[#0f172a]">{user.office || "미입력"}</dd>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <dt className="text-[10px] font-bold uppercase text-[#64748b]">상담 시간</dt>
                <dd className="mt-1 text-[15px] font-bold text-[#0f172a]">
                  {user.officeHours || "미입력"}
                </dd>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase text-[#64748b]">연구 분야</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {(user.researchAreas?.length ?? 0) > 0 ? (
                    user.researchAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-bold text-[#155dfc]"
                      >
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#64748b]">등록된 연구 분야가 없습니다.</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/app/profile/professor"
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f4bd8]"
              >
                프로필 수정
              </Link>
              <Link
                to="/app/courses"
                className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]"
              >
                내 수업 목록
              </Link>
            </div>
          </section>
        ) : (
          <section
            className="mx-auto w-full max-w-[794px] rounded-[10px] border border-[#d9e2f2] bg-white p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
            data-testid="mypage-professor-report-block"
          >
            <p className="text-[11px] font-black text-[#155dfc]">REPORT ACCESS</p>
            <h2 className="mt-2 text-[22px] font-black text-[#0f172a]">학생용 팀플 리포트</h2>
            <p className="mt-3 text-[13px] leading-6 text-[#475569]">
              이 리포트는 학생 계정 전용입니다.
            </p>
          </section>
        )}
        </main>
      </div>

      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="mypage-project-detail-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProject(null);
          }}
        >
          <div className="bg-white rounded-[10px] w-[min(1302px,95vw)] max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-start justify-between px-8 pt-7 pb-4 border-b border-[#e5e7eb]">
              <h2 className="text-[20px] font-bold text-[#101828]">프로젝트 상세 경력</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-[25px] font-bold text-[#979797] hover:text-[#555] transition-colors leading-none ml-8 mt-[-2px]"
              >
                X
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* 프로젝트 메인 카드 */}
              <div className="border-2 border-[#e5e7eb] rounded-[14px] overflow-hidden">
                {/* 카드 헤더 */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4">
                  <div>
                    <h3 className="text-[18px] font-black text-[#101828] mb-1">
                      {selectedProject.title}
                    </h3>
                    <p className="text-[14px] text-[#4a5565]">
                      {selectedProject.period} |{" "}
                      <span className="font-bold text-[#1862ff]">{selectedProject.role}</span>
                    </p>
                  </div>
                  <span className="bg-[#2e71ff] text-white text-[12px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    완료 {selectedProject.completionRate}%
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4">
                  {/* 주요 역할 및 기여 */}
                  <div>
                    <p className="text-[12px] font-bold text-[#6a7282] mb-3">주요 역할 및 기여</p>
                    <ul className="space-y-1">
                      {selectedProject.contributions.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 h-6">
                          <span className="text-[#0045d9] text-[14px] mt-[2px] shrink-0">•</span>
                          <span className="text-[14px] text-[#364153]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 핵심 문제해결 사례 */}
                  <div className="bg-white border-2 border-[rgba(211,211,211,0.64)] rounded-[10px] p-4 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
                    <p className="text-[12px] font-bold text-[#10006e] mb-2">🔧 핵심 문제해결 사례</p>
                    <p className="text-[12px] text-[#10006e]">
                      <span className="font-bold">문제:</span>{" "}
                      {selectedProject.problemCase.problem}
                    </p>
                    <p className="text-[12px] text-[#10006e]">
                      <span className="font-bold">해결:</span>{" "}
                      {selectedProject.problemCase.solution}
                    </p>
                    <p className="text-[12px] text-[#10006e]">
                      <span className="font-bold">성과:</span>{" "}
                      {selectedProject.problemCase.result}
                    </p>
                  </div>

                  {/* 사용 기술 스택 */}
                  <div className="bg-[#f9fafb] rounded-[10px] p-3">
                    <p className="text-[12px] font-bold text-[#364153] mb-2">사용 기술 스택</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.techStack.map((tech, i) => (
                        <span
                          key={i}
                          className="bg-[#2e71ff] text-white text-[12px] font-medium px-2 py-1 rounded-[4px]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 경험 인사이트 */}
              <div className="bg-white border-2 border-[rgba(189,189,189,0.44)] rounded-[10px] shadow-[2px_4px_4px_1px_rgba(0,0,0,0.25)] p-6">
                <p className="text-[12px] font-bold text-[#11006e] whitespace-pre-line leading-[30px]">
                  {selectedProject.insights}
                </p>
              </div>

              {/* 동료평가 */}
              <div className="bg-[#eff6ff] rounded-[10px] p-6">
                <h4 className="text-[20px] font-bold text-[#101828] mb-4">동료평가</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedProject.peerReviews.map((review, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-[10px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] px-4 py-2 flex items-center gap-2"
                    >
                      <span className="text-[17px] font-medium text-black">{review.text}</span>
                      <svg
                        className="w-[21px] h-[21px]"
                        fill="none"
                        viewBox="0 0 14 14"
                      >
                        <path d={svgPaths.p9a4f600} fill="#1D1B20" />
                      </svg>
                      <span className="text-[17px] font-medium text-black">{review.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 교수평가 */}
              <div className="bg-[#eff6ff] rounded-[10px] p-6">
                <h4 className="text-[20px] font-bold text-[#101828] mb-4">교수평가</h4>
                <div className="bg-white rounded-[10px] shadow-[2px_4px_4px_2px_rgba(0,0,0,0.15)] px-6 py-4">
                  <p className="text-[17px] font-medium text-black leading-relaxed">
                    {selectedProject.professorReview}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
