import React, { useState } from "react";
import svgPaths from "../../imports/Group43/svg-bqpgzlg1zb";

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projects: Project[] = [
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

  const totalSlides = Math.ceil(projects.length / 2);
  const sideNavItems = ["요약 리포트", "상세 리포트", "내 정보 조회", "내 정보 수정"];

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
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
        <div className="items-center flex flex-col md:flex-row bg-[rgba(255,255,255,0.9)] rounded-[14px] p-8 mb-8 shadow-md relative min-h-[400px]">
          {/* 프로필 아바타 */}
          <div className="md:absolute md:left-[95px] md:top-[40px]">
            <div className="bg-[#1862ff] rounded-full w-[170px] h-[171px] flex items-center justify-center text-[35px] font-bold text-white relative">
              류
              <button className="absolute bottom-0 right-0 bg-black border border-black rounded-[6px] w-[33px] h-[33px] flex items-center justify-center">
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
          </div>

          {/* 프로필 정보 */}
          <div className="w-full md:ml-[318px] space-y-6 pt-2">
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
                  <p className="text-[20px] font-bold text-black">류지원</p>
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
                  <p className="text-[20px] font-bold text-black">rujione@naver.com</p>
                </div>
              </div>
            </div>

            {/* 학교 및 학과 */}
            <div>
              <p className="text-[20px] font-bold text-black mb-2">학교 및 학과</p>
              <div className="bg-[rgba(255,255,255,0.9)] rounded-[10px] md:h-[48px] px-5 flex items-center border border-[#e5e7eb]">
                <p className="text-[18px] font-bold text-black">
                  숭실대학교 벤처중소기업학과/ 복수전공: 글로벌미디어학부
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 포트폴리오 리포트 */}
        <div className="bg-[rgba(255,255,255,0.95)] border-2 border-[#f0f0f0] rounded-[14px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] p-8 max-w-[980px] mx-auto">
          {/* 리포트 헤더 */}
          <div className="border-b-4 border-[#1862ff] pb-8 mb-8">
            <h2 className="text-[30px] font-black text-[#101828] mb-2">
              📊 팀 프로젝트 경력 요약 리포트
            </h2>
            <p className="text-[14px] text-[#4a5565] mb-1">
              학교 팀 프로젝트 경험을 체계적으로 정리한 취업 포트폴리오 자료
            </p>
            <p className="text-[12px] text-[#99a1af]">생성일: 2026년 4월 23일</p>
          </div>

          {/* 프로젝트 참여 현황 */}
          <div
            className="border-l-4 border-[#0046d9] rounded-[10px] p-8 mb-8"
            style={{
              backgroundImage:
                "linear-gradient(172.304deg, rgb(239, 246, 255) 0%, rgb(238, 242, 255) 100%)",
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[20px] font-bold text-[#1c398e]">🎯</span>
              <h3 className="text-[20px] font-bold text-black">프로젝트 참여 현황</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-[10px] shadow-[2px_2px_4px_1px_rgba(0,0,0,0.47)] p-6 text-center">
                <p className="text-[30px] font-black text-[#1862ff] mb-2">30</p>
                <p className="text-[12px] font-medium text-[#4a5565]">참여 프로젝트</p>
              </div>
              <div className="bg-white rounded-[10px] shadow-[2px_2px_4px_1px_rgba(0,0,0,0.47)] p-6 text-center">
                <p className="text-[30px] font-black text-[#00277b] mb-2">50</p>
                <p className="text-[12px] font-medium text-[#4a5565]">해결한 문제</p>
              </div>
              <div className="bg-white rounded-[10px] shadow-[2px_2px_4px_1px_rgba(0,0,0,0.47)] p-6 text-center">
                <p className="text-[30px] font-black text-[#4b99ff] mb-2">개발</p>
                <p className="text-[12px] font-medium text-[#4a5565]">가장 많이 담당한 역할</p>
              </div>
            </div>
          </div>

          {/* 프로젝트별 상세 경력 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[20px] font-bold text-[#101828]">📁</span>
              <h3 className="text-[20px] font-bold text-[#101828]">프로젝트별 상세 경력</h3>
            </div>

            <div className="relative">
              {/* 좌측 화살표 */}
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] flex items-center justify-center disabled:opacity-30 transition-opacity"
                disabled={currentSlide === 0}
              >
                <div className="-rotate-90">
                  <svg width="38" height="33" fill="none" viewBox="0 0 38.1051 33">
                    <path d={svgPaths.p198f7770} fill={currentSlide === 0 ? "#ccc" : "#1862FF"} />
                  </svg>
                </div>
              </button>

              {/* 프로젝트 카드 그리드 */}
              <div className="grid grid-cols-2 gap-8 px-8">
                {projects.slice(currentSlide * 2, currentSlide * 2 + 2).map((project, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedProject(project)}
                    className="bg-[#eff6ff] rounded-[10px] shadow-[2px_4px_4px_4px_rgba(0,0,0,0.25)] p-10 text-left hover:shadow-[4px_6px_8px_4px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] transition-all cursor-pointer"
                  >
                    <h4 className="text-[30px] font-bold text-black mb-1">{project.title}</h4>
                    <p className="text-[22px] font-bold text-black mb-6">: {project.subtitle}</p>
                    <div className="flex flex-wrap gap-3">
                      {project.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="bg-white rounded-[20px] px-5 py-2 text-[18px] font-bold text-[#155dfc]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* 우측 화살표 */}
              <button
                onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
                className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] flex items-center justify-center disabled:opacity-30 transition-opacity"
                disabled={currentSlide >= totalSlides - 1}
              >
                <div className="-rotate-90 -scale-y-100">
                  <svg width="38" height="33" fill="none" viewBox="0 0 38.1051 33">
                    <path
                      d={svgPaths.p198f7770}
                      fill={currentSlide >= totalSlides - 1 ? "#ccc" : "#1862FF"}
                    />
                  </svg>
                </div>
              </button>
            </div>

            {/* 페이지네이션 점 */}
            <div className="flex justify-center gap-3 mt-6">
              {Array.from({ length: totalSlides }).map((_, dot) => (
                <button
                  key={dot}
                  onClick={() => setCurrentSlide(dot)}
                  className={`rounded-full transition-all ${dot === currentSlide
                    ? "w-[15px] h-[15px] bg-[#004AE6]"
                    : "w-[12px] h-[12px] bg-[#9FC1FF]"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* 핵심 역량 및 성과 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[20px] font-bold text-[#101828]">💪</span>
              <h3 className="text-[20px] font-bold text-[#101828]">핵심 역량 및 성과</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 기술 역량 */}
              <div className="bg-white border-2 border-[#e5e7eb] rounded-[10px] p-6 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
                <h4 className="text-[16px] font-bold text-[#0052ff] mb-4">기술 역량</h4>
                <ul className="space-y-2">
                  {[
                    "프론트엔드: React, TypeScript, Tailwind",
                    "백엔드: Node.js, Express, REST API",
                    "데이터베이스: PostgreSQL, MongoDB",
                    "배포/인프라: Vercel, AWS EC2, Git",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[14px] text-[#364153]">
                      <span className="text-[#0f54e6]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 협업 및 리더십 */}
              <div className="bg-white border-2 border-[#e5e7eb] rounded-[10px] p-6 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
                <h4 className="text-[16px] font-bold text-[#0052ff] mb-4">협업 및 리더십</h4>
                <ul className="space-y-2">
                  {[
                    "3개 프로젝트 팀 리드 경험",
                    "Git/GitHub 협업 워크플로우 구축",
                    "코드 리뷰 및 품질 관리 담당",
                    "트러블슈팅 문서화 및 지식 공유",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[14px] text-[#364153]">
                      <span className="text-[#0f54e6]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 성장 그래프 */}
          <div className="bg-white border-2 border-[#e5e7eb] rounded-[14px] p-6 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)] mb-8 max-w-[422px] ml-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[16px]">📈</span>
              <h4 className="text-[16px] font-bold text-[#101828]">성장 그래프</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: "기술 역량", value: 85, color: "#2d3fff" },
                { label: "협업 능력", value: 92, color: "#96c4f9" },
                { label: "문제 해결", value: 78, color: "#bf00ff" },
                { label: "리더십", value: 99, color: "#00e5ff" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[12px] font-medium text-[#364153]">{item.label}</span>
                    <span className="text-[12px] font-bold" style={{ color: item.color }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="bg-[#f3f4f6] rounded-full h-[8px] overflow-hidden">
                    <div
                      className="rounded-full h-full"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 향후 학습 및 성장 목표 */}
          <div className="bg-white border-2 border-[rgba(229,231,235,0.95)] rounded-[10px] p-6 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)] mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[20px]">🎯</span>
              <h3 className="text-[20px] font-bold text-[#1862ff]">향후 학습 및 성장 목표</h3>
            </div>
            <ul className="space-y-2">
              {[
                "풀스택 개발자로서 프론트엔드-백엔드 통합 역량 강화",
                "클라우드 인프라 (AWS, Docker, Kubernetes) 실무 경험 확보",
                "오픈소스 프로젝트 기여 및 개발자 커뮤니티 활동",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-[#364153]">
                  <span className="text-[#1862ff] mt-1">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 리포트 푸터 */}
          <div className="border-t-2 border-[#c3c3c5] pt-6 text-center">
            <p className="text-[12px] text-[#99a1af] mb-1">
              본 리포트는 CampusConnect 시스템에서 자동으로 생성되었습니다.
            </p>
            <p className="text-[12px] text-[#99a1af]">
              팀 프로젝트 경험을 체계적으로 정리하여 취업 포트폴리오로 활용하세요.
            </p>
          </div>
        </div>
        </main>
      </div>

      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(82,82,82,0.67)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProject(null);
          }}
        >
          <div className="bg-white rounded-[10px] w-[min(1302px,95vw)] max-h-[90vh] overflow-y-auto relative">
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
