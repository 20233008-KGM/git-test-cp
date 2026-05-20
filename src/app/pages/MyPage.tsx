import React, { useEffect, useState } from "react";
import svgPaths from "../../imports/Group43/svg-bqpgzlg1zb";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/supabase-api";
import AiReportPrintView from "../components/AiReportPrintView";
import type { AiReportContext, AiReportGenerateResponse } from "../types/ai-report";

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
  const [reportPreview, setReportPreview] = useState<{
    context: AiReportContext;
    report: AiReportGenerateResponse;
  } | null>(null);
  const { user } = useAuth();

  async function openDbReportPreview() {
    if (!user?.id) {
      setAiReportMessage("로그인 후 이용할 수 있습니다.");
      return;
    }
    setAiReportLoading(true);
    setAiReportMessage(null);
    try {
      const context = await api.aiReport.gatherContext(user.id);
      const report = api.aiReport.buildDraftFromContext(context);
      setReportActivitySummary(
        `집계: 트러블슈팅 ${context.totalTroubleshootingLogs}건 · 산출물 ${context.totalDeliverables}건 · 피드백 ${context.totalFeedbacksSubmitted} · 회고 ${context.totalRetrospectivesSubmitted} · 동료평가 ${context.totalPeerReviewsSubmitted} · 교수평가 ${context.totalProfessorStudentEvalsReceived}/${context.totalProfessorProjectEvalsReceived}팀`
      );
      setReportPreview({ context, report });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "리포트 데이터를 불러오지 못했습니다.";
      setAiReportMessage(msg);
    } finally {
      setAiReportLoading(false);
    }
  }

  async function handleGenerateAiReport() {
    if (!user?.id) {
      setAiReportMessage("로그인 후 이용할 수 있습니다.");
      return;
    }
    setAiReportLoading(true);
    setAiReportMessage(null);
    try {
      const result = await api.aiReport.generateReport({ userId: user.id, locale: "ko" });
      setAiReportMessage("AI 리포트가 생성되었습니다.");
      const context = await api.aiReport.gatherContext(user.id);
      setReportPreview({ context, report: result });
    } catch (err) {
      if (err instanceof Error && err.name === "AiReportNotReady") {
        setAiReportMessage(
          `${err.message} Edge·OpenAI 설정(H-002) 전까지 DB 미리보기를 엽니다.`
        );
        await openDbReportPreview();
        return;
      }
      const msg =
        err instanceof Error ? err.message : "AI 리포트 생성에 실패했습니다.";
      setAiReportMessage(msg);
    } finally {
      setAiReportLoading(false);
    }
  }

  function handlePrintReport() {
    window.print();
  }

  const DEMO_PROJECTS: Project[] = [
    {
      title: "헬리버리 서비스",
      subtitle: "10-20대의 건강한 식사 분석 서비스",
      tags: ["기획 및 디자인", "기업가 정신", "고객 인터뷰 경험", "교수님의 호평"],
      period: "2019.03 - 2019.06 | 1조",
      role: "기획 및 디자인",
      completionRate: 100,
      contributions: [
        "서비스 기획 및 사용자 여정 맵 설계",
        "Figma를 활용한 UI/UX 프로토타입 제작",
        "고객 인터뷰 10건 수행 및 인사이트 도출",
      ],
      problemCase: {
        problem: "초기 사용자 조사에서 타겟 연령층 식습관 데이터 부족",
        solution: "오프라인 인터뷰와 설문지를 병행하여 50명 데이터 수집",
        result: "서비스 핵심 기능 3가지 도출, 교수님 A+ 평가 획득",
      },
      techStack: ["Figma", "Notion", "Google Forms", "Miro"],
      insights:
        "💡 이 프로젝트를 통해 얻은 경험 (Experience Insights)\n\n[기획 역량: 사용자 중심 설계]\n\n• 실제 사용자 인터뷰를 통해 가설을 검증하고, 데이터 기반으로 서비스 방향성을 결정하는 경험을 쌓았습니다.\n• 팀원들과의 협업을 통해 아이디어를 구체화하고 피그마로 시각화하는 과정에서 기획자의 역할을 수행하였습니다.\n\n[성과 정리]\n\n• 교수님으로부터 고객 중심적 접근 방식에 대한 높은 평가를 받아 A+ 성적을 획득하였습니다.",
      peerReviews: [
        { text: "다시 팀하고 싶어요", count: 3 },
        { text: "시간 약속을 잘 지켜요", count: 2 },
        { text: "아이디어가 창의적이에요", count: 2 },
        { text: "커뮤니케이션이 원활해요", count: 3 },
      ],
      professorReview:
        "헬리버리 서비스 기획에서 고객 중심적 사고와 철저한 시장 조사가 돋보였습니다. 인터뷰 결과를 바탕으로 한 피봇 결정이 매우 적절하였으며, 팀을 이끄는 리더십과 문서화 능력이 우수합니다.",
    },
    {
      title: "캠퍼스 카풀 웹서비스",
      subtitle: "대학생 캠퍼스 카풀 웹 서비스",
      tags: ["기획 및 디자인", "웹프로그래밍", "고객 인터뷰 경험", "동료들의 호평"],
      period: "2026.03 - 2026.06 | 1조",
      role: "프론트엔드 개발",
      completionRate: 95,
      contributions: [
        "React + TypeScript 기반 프론트엔드 아키텍처 설계 및 구현",
        "실시간 카풀 매칭 UI/UX 구현 (사용자 만족도 4.5/5.0)",
        "Vercel 배포 및 성능 최적화 (Lighthouse 점수 92점)",
      ],
      problemCase: {
        problem: "모바일 환경에서 레이아웃 깨짐 현상 발생",
        solution: "CSS 클래스명 충돌 발견 → 명확한 네이밍 컨벤션 적용으로 해결",
        result: "반응형 레이아웃 완성, 모든 디바이스에서 정상 작동",
      },
      techStack: ["React", "TypeScript", "Tailwind CSS", "REST API", "Vercel"],
      insights:
        "💡 이 프로젝트를 통해 얻은 경험 (Experience Insights)\n\n[기술 역량: 아키텍처 설계 및 타입 안정성 확보]\n\n• React와 TypeScript를 결합한 프론트엔드 기반 구조를 초기 단계부터 직접 설계하고 구축하는 경험을 획득함.\n• 동적 타이핑 언어의 한계를 보완하기 위해 정적 타입 검사를 적용하여 런타임 에러 발생률을 낮추고, 코드의 가독성과 전반적인 유지보수성을 높이는 실무적 감각을 체득함.\n\n[문제 해결: 디버깅 및 프로세스 개선]\n\n• 모바일 디바이스 환경에서 발생하는 레이아웃 깨짐 현상의 원인을 단순 UI 오류가 아닌 'CSS 클래스명 충돌'이라는 구조적 문제로 파악하고 디버깅하는 역량을 기름.\n• 일회성 코드 수정에 그치지 않고, 명확한 네이밍 컨벤션 규칙을 수립하고 도입하여 반응형 웹 구현을 달성함.\n\n[성능 최적화 및 배포 파이프라인 경험]\n\n• Vercel 플랫폼을 활용하여 로컬 환경에서 개발된 프로젝트를 실제 프로덕션 환경으로 배포하는 전체 사이클을 경험함.\n• 초기 로딩 속도와 렌더링 성능을 개선하는 최적화 작업을 수행하고, 그 결과를 구글 Lighthouse 92점이라는 객관적인 정량 지표로 증명함.",
      peerReviews: [
        { text: "다시 팀하고 싶어요", count: 2 },
        { text: "시간 약속을 잘 지켜요", count: 3 },
        { text: "디자인을 잘 해요", count: 1 },
        { text: "끝까지 책임감을 가지고 완성해요", count: 2 },
      ],
      professorReview:
        "스스로 문제를 발굴하고 해결하는 능력이 좋습니다. DB문제를 스스로 해결하고 곧바로 다른 문제를 발굴하여 해결하고자 노력하는 모습이 보였습니다. 프로젝트에 대해 꾸준히 고객 인터뷰를 하고 피봇을 진행하는 등 고객의 의견을 곧바로 반영하였습니다.",
    },
    {
      title: "길잡이 서비스",
      subtitle: "노인들을 위한 지도 서비스",
      tags: ["기획 및 디자인", "창업아이템개발", "고객 인터뷰 경험", "피그마를 통한 앱 디자인"],
      period: "2020.09 - 2020.12 | 2조",
      role: "UX/UI 디자인",
      completionRate: 88,
      contributions: [
        "노인 사용자 대상 UX 리서치 및 페르소나 정의",
        "접근성을 고려한 대형 UI 컴포넌트 설계",
        "Figma 앱 프로토타입 제작 및 사용성 테스트",
      ],
      problemCase: {
        problem: "노인 사용자의 작은 버튼 터치 오류율 38% 발생",
        solution: "최소 터치 영역을 48px로 확대하고 대비 비율 4.5:1 이상 유지",
        result: "오류율 12%로 감소, 사용성 테스트 만족도 4.2/5.0 달성",
      },
      techStack: ["Figma", "Notion", "Zeplin", "Adobe XD"],
      insights:
        "💡 이 프로젝트를 통해 얻은 경험 (Experience Insights)\n\n[접근성 설계 역량]\n\n• 디지털 소외 계층을 위한 UI 설계 원칙(WCAG 2.1)을 실무에 적용하는 경험을 쌓았습니다.\n• 단순히 시각적으로 예쁜 디자인이 아닌, 실제 사용자 맥락에 맞는 디자인의 중요성을 체득하였습니다.\n\n[사용자 리서치]\n\n• 노인 사용자 15명을 직접 인터뷰하고 사용성 테스트를 진행하며 정성적 데이터를 수집하는 역량을 향상시켰습니다.",
      peerReviews: [
        { text: "꼼꼼하게 일해요", count: 3 },
        { text: "사용자 관점으로 생각해요", count: 2 },
        { text: "다시 팀하고 싶어요", count: 2 },
        { text: "적극적으로 참여해요", count: 1 },
      ],
      professorReview:
        "노인 사용자를 위한 접근성 중심 설계가 매우 인상적이었습니다. 단순히 이론적 지식에 그치지 않고 실제 사용자 테스트를 통해 검증하는 과정이 체계적이었으며, 팀 내에서 사용자 중심 사고를 전파하는 역할을 훌륭히 수행하였습니다.",
    },
    {
      title: "야구를 위한 공간",
      subtitle: "야구 팬들을 위한 오프라인 공간",
      tags: ["기획 및 디자인", "디지털콘텐츠", "고객 인터뷰 경험", "학생 및 교수님의 호평"],
      period: "2021.03 - 2021.06 | 3조",
      role: "디지털 콘텐츠 제작",
      completionRate: 92,
      contributions: [
        "야구 팬 커뮤니티 공간 브랜딩 및 콘텐츠 전략 수립",
        "SNS 채널 운영 기획 및 콘텐츠 캘린더 작성",
        "인스타그램 릴스 5편 기획/촬영/편집",
      ],
      problemCase: {
        problem: "초기 SNS 팔로워 수 미달 및 낮은 참여율",
        solution: "타겟 해시태그 분석 및 인플루언서 콜라보 기획",
        result: "4주 내 팔로워 500명 달성, 평균 좋아요 120개",
      },
      techStack: ["Premiere Pro", "Photoshop", "Canva", "Instagram", "Notion"],
      insights:
        "💡 이 프로젝트를 통해 얻은 경험 (Experience Insights)\n\n[디지털 마케팅 역량]\n\n• 오프라인 공간의 매력을 온라인 콘텐츠로 효과적으로 전달하는 크리에이티브 역량을 향상하였습니다.\n• 데이터 기반 콘텐츠 전략 수립 및 A/B 테스트를 통한 최적화 방법을 체득하였습니다.\n\n[협업 및 실행력]\n\n• 촉박한 일정 속에서 촬영, 편집, 배포 파이프라인을 팀원들과 함께 구축하며 실행 역량을 강화하였습니다.",
      peerReviews: [
        { text: "창의적인 아이디어를 내요", count: 3 },
        { text: "다시 팀하고 싶어요", count: 2 },
        { text: "실행력이 뛰어나요", count: 3 },
        { text: "긍정적인 에너지가 넘쳐요", count: 2 },
      ],
      professorReview:
        "디지털 콘텐츠 제작 전 과정을 직접 기획하고 실행한 점이 돋보입니다. 이론에 그치지 않고 실제 SNS 채널을 운영하며 정량적 성과를 달성한 것이 인상적이었습니다. 창의성과 실행력 모두 높은 평가를 드립니다.",
    },
  ];

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [reportContext, setReportContext] = useState<AiReportContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await api.myPage.getProjectsForUser();
        if (!cancelled) {
          setProjects(loaded.length > 0 ? loaded : DEMO_PROJECTS);
        }
      } catch {
        if (!cancelled) setProjects(DEMO_PROJECTS);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    api.aiReport
      .gatherContext(user.id)
      .then((ctx) => {
        if (!cancelled) setReportContext(ctx);
      })
      .catch(() => {
        if (!cancelled) setReportContext(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const sideNavItems = ["요약 리포트", "상세 리포트", "내 정보 조회", "내 정보 수정"];
  const reportPageTitles = ["역량 및 활동 요약", "주요 팀플 상세", "문제해결 경험"];
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
  const summaryCards = activitySummary
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

  const summaryParagraph = activitySummary
    ? activitySummary.teamCount > 0
      ? `${profileName} 학생은 ${activitySummary.teamCount}개 팀 프로젝트에 참여했으며, 트러블슈팅 ${activitySummary.troubleshootingCount}건·산출물 ${activitySummary.deliverableCount}건이 기록되어 있습니다. 평균 진행률은 ${activitySummary.avgProgress}%입니다.`
      : `${profileName} 학생의 팀 활동 기록이 아직 없습니다. 수업에 등록하고 팀에 배정되면 여기에 집계됩니다.`
    : `${profileName} 학생의 활동 데이터를 불러오는 중이거나, 아래 데모 프로젝트 카드를 참고하세요.`;

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
    reportContext && reportContext.troubleshootingCases.length > 0
      ? reportContext.troubleshootingCases
      : DEMO_TROUBLESHOOTING_CASES;

  const page3UsesDb = Boolean(
    reportContext && reportContext.troubleshootingCases.length > 0
  );

  const page3Intro = page3UsesDb
    ? `${profileName} 학생의 트러블슈팅 ${reportContext!.troubleshootingCases.length}건이 Supabase 팀 워크스페이스에 기록되어 있습니다. 아래는 실제 problem · plan · solution 필드입니다.`
    : `${profileName} 학생의 문제해결 경험은 단순 오류 수정이 아니라, 원인 파악, 구조 재정리, 재발 방지까지 이어지는 방식으로 기록되어 있습니다. (DB 로그가 없어 예시 사례를 표시합니다.)`;

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 lg:flex-row lg:items-start lg:px-8">
        {/* 사이드 네비게이션 바 */}
        <aside className="w-full rounded-[14px] bg-white p-5 shadow-md lg:sticky lg:top-8 lg:w-[240px] lg:shrink-0">
          <p className="mb-4 text-[18px] font-bold text-black">마이페이지 메뉴</p>
          <nav className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sideNavItems.map((item) => (
              <button
                key={item}
                type="button"
                className="whitespace-nowrap rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-5 py-3 text-left text-[15px] font-bold text-[#155dfc] transition-colors hover:bg-[#dbeafe] lg:w-full"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
        {/* 페이지 헤더 */}
        <h1 className="text-[30px] font-bold text-black mb-10">마이페이지</h1>

        {/* 프로필 섹션 */}
        <div className="mb-8 flex min-h-[400px] flex-col items-center gap-8 rounded-[14px] bg-[rgba(255,255,255,0.9)] p-8 shadow-md md:flex-row">
          {/* 프로필 아바타 */}
          <div className="flex shrink-0 flex-col items-center gap-3 md:w-[240px]">
            <div className="flex h-[171px] w-[170px] items-center justify-center rounded-full bg-[#1862ff] text-[35px] font-bold text-white">
              {profileInitial}
            </div>
              <button className="flex h-[33px] w-[33px] items-center justify-center rounded-[6px] border border-black bg-black">
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
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-3 rounded-2xl border border-[#dbe7ff] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[12px] font-black text-[#155dfc]">리포트 페이지 넘기기</p>
            <p className="mt-1 text-[14px] font-bold text-[#334155]">
              {reportPage} / 3 · {reportPageTitles[reportPage - 1]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportPage((page) => Math.max(1, page - 1))}
              disabled={reportPage === 1}
              className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-[13px] font-bold text-[#334155] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전 페이지
            </button>
            <button
              onClick={() => setReportPage((page) => Math.min(3, page + 1))}
              disabled={reportPage === 3}
              className="rounded-full bg-[#155dfc] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#0f4bd8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음 페이지
            </button>
          </div>
        </div>

        {/* 포트폴리오 리포트 */}
        <section className="mx-auto min-h-[1123px] w-full max-w-[794px] overflow-visible rounded-[10px] border border-[#d9e2f2] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {summaryCards.map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#dbe7ff] bg-[#f8fbff] p-4">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#476582]">{item.label}</p>
                      <p className="mt-1.5 text-[22px] font-black text-[#0f3ea8]">{item.value}</p>
                      <p className="mt-1.5 text-[10px] leading-4 text-[#60748a]">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border-l-4 border-[#155dfc] bg-[#f7faff] p-4">
                  <p className="text-[10px] font-black text-[#155dfc]">PAGE 01 SUMMARY</p>
                  <h3 className="mt-1.5 text-[18px] font-black text-[#101828]">역량 및 주요 팀플 활동 요약</h3>
                  <p className="mt-2 text-[11px] leading-5 text-[#334155]">{summaryParagraph}</p>
                </div>

                <div className="rounded-xl border border-[#dbe7ff] bg-white p-4">
                  <p className="text-[10px] font-black text-[#155dfc]">CORE TECHNICAL SKILLS</p>
                  <h3 className="mt-1.5 text-[17px] font-black text-[#101828]">보유 핵심 기술 역량</h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {[
                      {
                        title: "프론트엔드 UI 구현",
                        body: "React, TypeScript, Tailwind CSS 기반으로 사용자 화면을 컴포넌트 단위로 구현하고, 반응형 레이아웃과 상태 기반 UI를 구성한 경험이 있습니다.",
                        chips: ["React", "TypeScript", "Tailwind CSS", "Responsive UI"],
                      },
                      {
                        title: "서비스 기획 및 UX 설계",
                        body: "사용자 인터뷰와 페르소나 정리를 통해 서비스 요구사항을 도출하고, Figma 프로토타입과 사용자 여정 맵으로 구체화한 경험이 있습니다.",
                        chips: ["Figma", "User Journey", "UX Research", "Prototype"],
                      },
                      {
                        title: "데이터 연동 이해",
                        body: "REST API, Supabase, Firebase Auth처럼 프론트엔드와 데이터 계층을 연결하는 흐름을 이해하고 화면 요구사항에 맞춰 데이터를 사용하는 경험이 있습니다.",
                        chips: ["REST API", "Supabase", "Firebase Auth", "PostgreSQL"],
                      },
                      {
                        title: "협업 문서화",
                        body: "트러블슈팅 로그, 역할 분담, 발표 자료, 프로젝트 회고를 문서화하여 팀 내 진행 상황을 공유하고 의사결정 근거를 남기는 역량이 확인됩니다.",
                        chips: ["Troubleshooting", "Notion", "GitHub", "Review"],
                      },
                    ].map((skill) => (
                      <div key={skill.title} className="rounded-lg border border-gray-200 bg-[#fbfdff] p-3">
                        <h4 className="text-[13px] font-black text-[#0f172a]">{skill.title}</h4>
                        <p className="mt-1.5 text-[10px] leading-4 text-[#475569]">{skill.body}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {skill.chips.map((chip) => (
                            <span key={chip} className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[9px] font-bold text-[#155dfc]">
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-[15px] font-black text-[#101828]">핵심 역량 진단</h3>
                    <div className="mt-3 space-y-3">
                      {[
                        { label: "프로젝트 실행력", value: 92, desc: "기한 내 산출물 제출과 발표 준비가 안정적입니다." },
                        { label: "협업 신뢰도", value: 90, desc: "동료평가에서 책임감과 시간 약속 관련 긍정 키워드가 반복됩니다." },
                        { label: "프론트엔드 구현", value: 86, desc: "React 기반 UI 구현과 반응형 문제 해결 경험이 확인됩니다." },
                        { label: "문제 해결/회고", value: 82, desc: "트러블슈팅 로그를 남기고 원인-계획-해결을 정리하는 습관이 있습니다." },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-bold text-[#1e293b]">{item.label}</p>
                              <p className="text-[10px] text-[#64748b]">{item.desc}</p>
                            </div>
                            <span className="text-[11px] font-black text-[#155dfc]">{item.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#e8eef8]">
                            <div className="h-full rounded-full bg-[#155dfc]" style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-[#fbfcff] p-4">
                    <h3 className="text-[15px] font-black text-[#101828]">간략 활동 요약</h3>
                    <div className="mt-3 space-y-2.5">
                      {[
                        ["기획", "사용자 인터뷰와 페르소나를 바탕으로 서비스 방향을 정리했습니다."],
                        ["구현", "React 기반 화면 구현, 반응형 레이아웃, 데이터 연동 흐름을 담당했습니다."],
                        ["협업", "역할 분담, 발표 자료, 트러블슈팅 기록을 문서화하며 팀 진행을 안정화했습니다."],
                      ].map(([title, body]) => (
                        <div key={title} className="rounded-lg bg-white p-2.5 shadow-sm">
                          <p className="text-[10px] font-black text-[#155dfc]">{title}</p>
                          <p className="mt-1.5 text-[10.5px] leading-5 text-[#475569]">{body}</p>
                        </div>
                      ))}
                    </div>
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
                    {reportContext && reportContext.teams.length > 0
                      ? "Supabase 팀 멤버십 기준 카드입니다."
                      : projectsLoading
                        ? "프로젝트 불러오는 중…"
                        : "각 카드를 클릭하면 상세 리포트를 확인할 수 있습니다."}
                  </p>
                </div>
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {reportContext && reportContext.teams.length > 0
                    ? reportContext.teams.map((team, index) => (
                        <div
                          key={team.teamId}
                          className="rounded-xl border border-[#dbe7ff] bg-white p-4 text-left shadow-sm"
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
                            {team.sampleProblems.length > 0 && (
                              <p>주요 이슈: {team.sampleProblems.join(" / ")}</p>
                            )}
                          </div>
                        </div>
                      ))
                    : projects.map((project, index) => (
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
                      ))}
                </div>
              </div>
            )}

            {reportPage === 3 && (
              <div className="space-y-5">
                <div className="rounded-xl border-l-4 border-[#155dfc] bg-[#f7faff] p-5">
                  <p className="text-[10px] font-black text-[#155dfc]">PAGE 03 PROBLEM SOLVING</p>
                  <h3 className="mt-1.5 text-[18px] font-black text-[#101828]">가장 주목해야 할 문제해결 경험</h3>
                  <p className="mt-3 text-[12px] leading-6 text-[#334155]">{page3Intro}</p>
                </div>

                <div className="space-y-4">
                  {troubleshootingCases.map((caseItem, index) => (
                    <div
                      key={"logId" in caseItem ? caseItem.logId : `${caseItem.title}-${index}`}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
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
                      <div className="mt-3 grid grid-cols-1 gap-3 text-[10.5px] leading-5 text-[#475569] md:grid-cols-2">
                        <p>
                          <span className="font-bold text-[#0f172a]">문제:</span> {caseItem.problem}
                        </p>
                        <p>
                          <span className="font-bold text-[#0f172a]">조치:</span> {caseItem.action}
                        </p>
                        <p>
                          <span className="font-bold text-[#0f172a]">결과:</span> {caseItem.result}
                        </p>
                        <p>
                          <span className="font-bold text-[#0f172a]">의미:</span> {caseItem.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 text-center space-y-3">
              <p className="text-[9px] font-bold leading-4 text-[#64748b]">
                1·2·3페이지 요약은 Supabase 집계(트러블슈팅·산출물·피드백·회고·동료평가·교수평가)를 반영합니다.
                AI 문단은 Edge 배포(H-002) 후 생성됩니다.
              </p>
              {reportActivitySummary && (
                <p className="text-[9px] text-[#155dfc]" data-testid="report-activity-summary">
                  {reportActivitySummary}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openDbReportPreview}
                  disabled={aiReportLoading}
                  className="rounded-lg border border-[#155dfc] bg-white px-4 py-2 text-[11px] font-bold text-[#155dfc] disabled:opacity-50"
                >
                  {aiReportLoading ? "불러오는 중…" : "DB 활동 미리보기 (A4)"}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiReport}
                  disabled={aiReportLoading}
                  className="rounded-lg bg-[#155dfc] px-4 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                >
                  {aiReportLoading ? "생성 중…" : "AI 리포트 생성 (베타)"}
                </button>
              </div>
              {aiReportMessage && (
                <p className="text-[10px] font-medium text-[#475569]">{aiReportMessage}</p>
              )}
            </div>
          </div>
        </section>
        </main>
      </div>

      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <div
          className="mx-auto my-6 flex w-full items-center justify-center rounded-2xl p-4"
          style={{ backgroundColor: "rgba(82,82,82,0.67)" }}
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

      {reportPreview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 print:p-0 print:bg-white"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReportPreview(null);
          }}
        >
          <div className="my-4 w-full max-w-[220mm] print:my-0 print:max-w-none">
            <div className="mb-3 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrintReport}
                className="rounded-lg bg-[#155dfc] px-4 py-2 text-[11px] font-bold text-white"
              >
                인쇄 / PDF 저장
              </button>
              <button
                type="button"
                onClick={() => setReportPreview(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[11px] font-bold"
              >
                닫기
              </button>
            </div>
            <AiReportPrintView
              context={reportPreview.context}
              report={reportPreview.report}
            />
          </div>
        </div>
      )}
    </div>
  );
}
