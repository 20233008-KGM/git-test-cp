import React, { useState, useRef, useEffect } from "react";
import { Search, BookOpen, Clock, MapPin, FlaskConical, User, Pencil, Shuffle } from "lucide-react";
import { api } from "../api/mock-data";
import { useAuth } from "../contexts/AuthContext";
import type { ProfessorProfile } from "../types";

interface Student {
  id: string;
  name: string;
  isSelf?: boolean;
  year?: string;
  major: string;
  bio: string;
  tags: string[];
  avatar?: string;
  image?: string;
}

interface StudentExtra {
  temperature: number;
  teamProjectCount: number;
  portfolioFile: string;
  detailedBio: string;
  keywords: { text: string; count: number }[];
}

const fallbackStudentExtras: Record<string, StudentExtra> = {
  "1": {
    temperature: 38.2,
    teamProjectCount: 7,
    portfolioFile: "류지원_포트폴리오_2026.pdf",
    detailedBio: "기획·디자인을 겸비한 개발자를 목표로 하고 있습니다. Figma와 React를 함께 사용한 프로젝트 경험이 있으며, 팀 프로젝트에서 소통을 중요하게 생각합니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 6 },
      { text: "시간 약속을 잘 지켜요", count: 5 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 7 },
    ],
  },
  "2": {
    temperature: 37.5,
    teamProjectCount: 10,
    portfolioFile: "김철수_포트폴리오_2026.pdf",
    detailedBio: "UI/UX 디자이너 겸 프론트 퍼블리셔입니다. 피그마 활용과 CSS 애니메이션 구현에 자신 있습니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 5 },
      { text: "시간 약속을 잘 지켜요", count: 8 },
      { text: "디자인을 잘 해요", count: 3 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 6 },
    ],
  },
  "3": {
    temperature: 36.9,
    teamProjectCount: 6,
    portfolioFile: "이영희_포트폴리오_2026.pdf",
    detailedBio: "백엔드 개발에 강점이 있으며 Node.js와 MongoDB 기반 REST API 서버 개발 경험이 풍부합니다. 문서화와 코드 품질을 중요하게 여깁니다.",
    keywords: [
      { text: "시간 약속을 잘 지켜요", count: 9 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 8 },
    ],
  },
  "4": {
    temperature: 37.1,
    teamProjectCount: 8,
    portfolioFile: "박지성_포트폴리오_2026.pdf",
    detailedBio: "전체 프로젝트 일정 조율과 QA를 담당하는 PM 역할을 선호합니다. 애자일 방법론 기반으로 팀을 이끈 경험이 여러 번 있습니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 7 },
      { text: "시간 약속을 잘 지켜요", count: 10 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 9 },
    ],
  },
  "5": {
    temperature: 36.8,
    teamProjectCount: 5,
    portfolioFile: "최수민_포트폴리오_2026.pdf",
    detailedBio: "React와 TypeScript를 주력으로 사용하는 프론트엔드 개발자입니다. 인터랙션 구현과 상태 관리에 관심이 많으며 음악 프로덕션도 즐깁니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 4 },
      { text: "디자인을 잘 해요", count: 5 },
    ],
  },
  "6": {
    temperature: 37.8,
    teamProjectCount: 9,
    portfolioFile: "정다은_포트폴리오_2026.pdf",
    detailedBio: "데이터베이스 설계와 SQL 최적화를 주로 맡습니다. PostgreSQL과 파이썬을 조합한 데이터 분석 프로젝트를 다수 진행했습니다.",
    keywords: [
      { text: "시간 약속을 잘 지켜요", count: 6 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 7 },
    ],
  },
  "7": {
    temperature: 38.0,
    teamProjectCount: 12,
    portfolioFile: "강동원_포트폴리오_2026.pdf",
    detailedBio: "비즈니스 모델 검증과 피칭 경험이 풍부합니다. 창업 동아리 활동을 통해 다양한 팀 프로젝트를 리드한 경험이 있습니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 8 },
      { text: "시간 약속을 잘 지켜요", count: 7 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 10 },
    ],
  },
  "8": {
    temperature: 36.5,
    teamProjectCount: 4,
    portfolioFile: "오현주_포트폴리오_2026.pdf",
    detailedBio: "Flutter를 활용한 iOS/Android 크로스 플랫폼 앱 개발 경험이 있습니다. UX 리서치와 디자인 시스템 구축에도 관심이 많습니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 3 },
      { text: "디자인을 잘 해요", count: 4 },
    ],
  },
  "9": {
    temperature: 37.3,
    teamProjectCount: 7,
    portfolioFile: "나준혁_포트폴리오_2026.pdf",
    detailedBio: "Docker와 Kubernetes 기반 클라우드 인프라 구축을 전문으로 합니다. CI/CD 파이프라인 자동화 경험이 있으며 AWS 자격증을 보유하고 있습니다.",
    keywords: [
      { text: "시간 약속을 잘 지켜요", count: 5 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 6 },
    ],
  },
  "10": {
    temperature: 37.6,
    teamProjectCount: 6,
    portfolioFile: "한소영_포트폴리오_2026.pdf",
    detailedBio: "D3.js와 BI 툴을 활용한 데이터 시각화 대시보드를 설계합니다. 복잡한 데이터를 직관적으로 표현하는 것에 강점이 있습니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 5 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 4 },
    ],
  },
  "11": {
    temperature: 37.0,
    teamProjectCount: 8,
    portfolioFile: "윤재민_포트폴리오_2026.pdf",
    detailedBio: "비즈니스 요구사항 분석부터 UML 산출물 작성까지 담당합니다. 스크럼 마스터 역할로 팀 프로세스를 관리한 경험이 있습니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 6 },
      { text: "시간 약속을 잘 지켜요", count: 8 },
    ],
  },
  "12": {
    temperature: 38.1,
    teamProjectCount: 9,
    portfolioFile: "임채연_포트폴리오_2026.pdf",
    detailedBio: "브랜드 아이덴티티 구축과 UI 컴포넌트 디자인을 전문으로 합니다. 일러스트레이터·포토샵으로 프로젝트에서 시각적 완성도를 높입니다.",
    keywords: [
      { text: "다시 팀하고 싶어요", count: 7 },
      { text: "디자인을 잘 해요", count: 9 },
      { text: "끝까지 책임감을 가지고 완성해요", count: 6 },
    ],
  },
};

const fallbackStudents: Student[] = [
  {
    id: "1",
    name: "류지원",
    isSelf: true,
    year: "4학년",
    major: "벤처중소기업학 / 글로벌미디어 복수전공",
    bio: "이번 프로젝트에서 개발 역할을 하고 싶습니다!",
    tags: ["#기획/디자인", "#기아타이거즈", "#TFT"],
    avatar: "류",
  },
  {
    id: "2",
    name: "김철수",
    major: "시각디자인과",
    bio: "UI/UX 중심의 프론트엔드 개발을 맡고 싶습니다!",
    tags: ["#UI/UX", "#피그마", "#퍼블리싱", "#HTML/CSS", "#JavaScript", "#일러스트레이팅 좋아합니다", "#프로토타이핑"],
    image: "https://images.unsplash.com/photo-1544168190-79c17527004f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLb3JlYW4lMjB5b3VuZyUyMG1hbiUyMHN0dWRlbnQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzgyMzk1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "3",
    name: "이영희",
    major: "소프트웨어학",
    bio: "안정적인 백엔드 API 서버 구축을 담당하겠습니다!",
    tags: ["#백엔드", "#Node.js", "#서버배포", "#Express", "#MongoDB", "#REST API", "#AWS"],
    avatar: "이",
  },
  {
    id: "4",
    name: "박지성",
    major: "경영학과",
    bio: "프로젝트 전체 일정 관리와 QA를 책임지겠습니다!",
    tags: ["#PM", "#기획", "#QA", "#애자일", "#축구 보는거 좋아해요", "#문서화", "#일정관리"],
    avatar: "박",
  },
  {
    id: "5",
    name: "최수민",
    major: "글로벌미디어",
    bio: "React로 사용자 경험이 좋은 UI를 만들고 싶어요!",
    tags: ["#React", "#프론트엔드", "#인터랙션", "#TypeScript", "#음원작업 합니다", "#상태관리", "#Redux"],
    image: "https://images.unsplash.com/photo-1738085825887-507c05c58674?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLb3JlYW4lMjB5b3VuZyUyMHdvbWFuJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3ODIzOTU0Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "6",
    name: "정다은",
    major: "통계학과",
    bio: "효율적인 데이터베이스 설계와 최적화를 맡겠습니다!",
    tags: ["#데이터베이스", "#SQL", "#파이썬", "#PostgreSQL", "#사진촬영 좋아합니다", "#ERD설계"],
    avatar: "정",
  },
  {
    id: "7",
    name: "강동원",
    major: "벤처중소기업학",
    bio: "서비스의 비즈니스 모델 검증과 발표를 담당하겠습니다!",
    tags: ["#창업", "#비즈니스모델", "#발표", "#마케팅", "#데이터분석 취미입니다", "#두자루지"],
    avatar: "강",
  },
  {
    id: "8",
    name: "오현주",
    major: "정보통신공학과",
    bio: "모바일 앱 개발과 사용자 경험 개선을 맡겠습니다!",
    tags: ["#모바일", "#Flutter", "#iOS", "#Android", "#UX리서치", "#디자인시스템"],
    avatar: "오",
  },
  {
    id: "9",
    name: "나준혁",
    major: "컴퓨터공학과",
    bio: "클라우드 인프라와 DevOps 환경 구축을 담당하겠습니다!",
    tags: ["#Docker", "#Kubernetes", "#CI/CD", "#AWS", "#클라우드", "#인프라"],
    avatar: "나",
  },
  {
    id: "10",
    name: "한소영",
    major: "디지털미디어학과",
    bio: "데이터 시각화와 대시보드 설계를 담당하겠습니다!",
    tags: ["#D3.js", "#데이터시각화", "#차트", "#분석", "#BI툴", "#인포그래픽"],
    avatar: "한",
  },
  {
    id: "11",
    name: "윤재민",
    major: "경영정보학과",
    bio: "비즈니스 요구사항 분석 및 문서화를 담당합니다!",
    tags: ["#요구사항분석", "#UML", "#ERD", "#기술문서", "#비즈니스분석", "#스크럼마스터"],
    avatar: "윤",
  },
  {
    id: "12",
    name: "임채연",
    major: "산업디자인학과",
    bio: "브랜드 아이덴티티와 UI 컴포넌트 디자인을 맡겠습니다!",
    tags: ["#브랜딩", "#UI디자인", "#일러스트레이터", "#포토샵", "#컴포넌트", "#디자인토큰"],
    avatar: "임",
  },
];

/* ─────────── 공통 컴포넌트 ─────────── */

function StudentAvatar({ student, size = "md" }: { student: Student; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-10 h-10" : "w-16 h-16";
  const textClass = size === "sm" ? "text-base" : "text-2xl";
  if (student.image) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0`}>
        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0`}>
      <span className={`text-[#2b7fff] ${textClass} font-bold`}>{student.avatar}</span>
    </div>
  );
}

function TemperatureBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, ((value - 36) / 3) * 100));
  const emoji = value >= 38 ? "😄" : value >= 37 ? "😊" : "😐";
  return (
    <div className="bg-[#eff6ff] rounded-[14px] shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-bold text-black">매너온도</p>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="text-[#155dfc] text-3xl font-black mb-3">{value}°C</p>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#b0bfde] via-[#63bfed] to-[#155dfc]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────── 학생 프로필 모달 ─────────── */

function StudentProfileModal({
  student,
  studentExtras,
  onClose,
  onEditClick,
}: {
  student: Student;
  studentExtras: Record<string, StudentExtra>;
  onClose: () => void;
  onEditClick?: () => void;
}) {
  const extra = studentExtras[student.id];
  if (!extra) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(45,45,45,0.76)] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-[14px] px-6 pt-5 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <StudentAvatar student={student} size="md" />
              <div>
                <p className="text-lg font-bold text-[#101828]">
                  {student.name}
                  {student.isSelf && <span className="text-[#6a7282] font-normal text-base"> (나)</span>}
                </p>
                <p className="text-sm text-[#6a7282]">{student.major}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <p className="text-sm font-bold text-black">
                팀 프로젝트 경험 :{" "}
                <span className="text-[#1e68fa]">{extra.teamProjectCount}회</span>
              </p>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 text-lg font-bold"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <TemperatureBar value={extra.temperature} />

          <div className="flex flex-wrap gap-2">
            {extra.keywords.map((kw) => (
              <div
                key={kw.text}
                className="bg-white border border-gray-200 rounded-[10px] shadow-sm px-3 py-2 flex items-center gap-1.5"
              >
                <span className="text-sm text-black">{kw.text}</span>
                <User className="w-3.5 h-3.5 text-[#1D1B20]" />
                <span className="text-sm font-medium text-black">{kw.count}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[rgba(218,218,218,0.55)]" />

          <div>
            <p className="text-base font-bold text-black mb-2">자기소개</p>
            <div className="border border-gray-200 rounded-[10px] px-4 py-3">
              <p className="text-sm text-[#364153] leading-relaxed">{extra.detailedBio}</p>
            </div>
          </div>

          <div>
            <p className="text-base font-bold text-black mb-2">포트폴리오 & 첨부파일</p>
            <div className="border border-gray-200 rounded-[10px] px-4 py-2.5 flex items-center gap-2">
              <span className="text-gray-400 text-sm">📎</span>
              <span className="text-[#155dfc] text-sm underline cursor-pointer hover:text-blue-700">
                {extra.portfolioFile}
              </span>
            </div>
          </div>

          {student.isSelf ? (
            <button
              onClick={() => { onClose(); onEditClick?.(); }}
              className="w-full bg-[#155dfc] text-white py-3 rounded-[10px] font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              내 정보 수정
            </button>
          ) : (
            <button className="w-full bg-[#101828] text-white py-3 rounded-[10px] font-bold text-sm hover:bg-gray-900 transition-colors">
              1:1 채팅하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── 내 정보 수정 모달 ─────────── */

interface EditForm {
  major: string;
  mbti: string;
  careerInterest: string;
  hobbies: string;
  bio: string;
  portfolioFileName: string;
}

function MyInfoEditModal({
  initialForm,
  onClose,
  onSave,
}: {
  initialForm: EditForm;
  onClose: () => void;
  onSave: (form: EditForm) => void;
}) {
  const [form, setForm] = useState<EditForm>(initialForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const update = (key: keyof EditForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      className="fixed inset-0 bg-[rgba(79,79,79,0.72)] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-[14px] flex justify-between items-center px-7 py-5 border-b border-gray-100 z-10">
          <h2 className="text-lg font-bold text-[#1e2939]">내 정보 수정</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 font-bold text-lg" aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1e2939]">전공</label>
              <input type="text" value={form.major} onChange={(e) => update("major", e.target.value)} className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm text-[#1e2939] outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc] transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1e2939]">mbti 및 성격</label>
              <input type="text" value={form.mbti} onChange={(e) => update("mbti", e.target.value)} className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm text-[#1e2939] outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc] transition" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]">진로 관심분야 <span className="text-xs text-[#6a7282] font-normal">(쉼표로 구분)</span></label>
            <input type="text" value={form.careerInterest} onChange={(e) => update("careerInterest", e.target.value)} className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm text-[#1e2939] outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc] transition" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]">취미 및 관심사 <span className="text-xs text-[#6a7282] font-normal">(쉼표로 구분)</span></label>
            <input type="text" value={form.hobbies} onChange={(e) => update("hobbies", e.target.value)} className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm text-[#1e2939] outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc] transition" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]">간단한 자기소개</label>
            <input type="text" value={form.bio} onChange={(e) => update("bio", e.target.value)} className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm text-[#1e2939] outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc] transition" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]">포트폴리오 파일 업로드</label>
            <div
              className="border border-dashed border-gray-300 rounded-[10px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.portfolioFileName ? (
                <>
                  <span className="text-2xl">📎</span>
                  <p className="text-sm font-medium text-[#155dfc]">{form.portfolioFileName}</p>
                  <p className="text-xs text-[#6a7282]">클릭하여 변경</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#1e2939]">클릭하여 파일 선택</p>
                  <p className="text-xs text-[#6a7282]">PDF, ZIP, PPT (최대 50MB)</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.zip,.ppt,.pptx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) update("portfolioFileName", file.name); }} />
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={onClose} className="px-8 py-2.5 rounded-[8px] border border-gray-300 text-sm font-medium text-[#364153] hover:bg-gray-50 transition-colors">
              취소
            </button>
            <button onClick={() => { onSave(form); onClose(); }} className="px-8 py-2.5 rounded-[8px] bg-[#155dfc] text-white text-sm font-bold hover:bg-blue-700 transition-colors">
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── 랜덤 팀 생성 ─────────── */

const TEAM_KEYWORDS = [
  { id: "size4", label: "4명", group: "size" },
  { id: "size3", label: "3명", group: "size" },
  { id: "even", label: "비 작성자 균등 배분", group: "rule" },
  { id: "career", label: "상반된 진로 분야", group: "rule" },
  { id: "mbti", label: "상반된 성격", group: "rule" },
];

function MiniStudentCard({ student }: { student: Student }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#e5e7eb] p-3 flex flex-col items-center gap-1.5 min-w-0">
      <StudentAvatar student={student} size="sm" />
      <p className="text-xs font-bold text-[#101828] text-center truncate w-full">{student.name}</p>
      <p className="text-[10px] text-[#6a7282] text-center leading-tight">{student.major}</p>
      <div className="flex flex-wrap gap-0.5 justify-center">
        {student.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="bg-[#f3f4f6] text-[#4a5565] text-[9px] px-1.5 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function TeamBox({ teamNumber, members }: { teamNumber: number; members: Student[] }) {
  return (
    <div className="bg-[#f8faff] rounded-[14px] border border-[#dbeafe] p-4">
      <p className="text-center font-bold text-[#1e2939] mb-3">{teamNumber}팀</p>
      <div className="grid grid-cols-2 gap-2">
        {members.map((member) => (
          <MiniStudentCard key={member.id} student={member} />
        ))}
      </div>
    </div>
  );
}

function RandomTeamModal({ allStudents, onClose }: { allStudents: Student[]; onClose: () => void }) {
  const [activeKeywords, setActiveKeywords] = useState<string[]>(["size4", "even", "career", "mbti"]);
  const [teams, setTeams] = useState<Student[][]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const generate = (kws: string[]) => {
    const size = kws.includes("size3") ? 3 : 4;
    let pool = [...allStudents];

    if (kws.includes("career")) {
      const buckets: Student[][] = [[], [], [], []];
      pool.forEach((s, i) => buckets[i % 4].push(s));
      pool = buckets.flat();
    } else {
      pool = pool.sort(() => Math.random() - 0.5);
    }

    if (kws.includes("mbti")) {
      pool = pool.sort(() => Math.random() - 0.5);
    }

    const result: Student[][] = [];
    for (let i = 0; i < pool.length; i += size) {
      result.push(pool.slice(i, i + size));
    }
    setTeams(result);
  };

  useEffect(() => {
    generate(activeKeywords);
  }, []);

  const toggleKeyword = (id: string, group: string) => {
    setActiveKeywords((prev) => {
      if (group === "size") {
        const already = prev.includes(id);
        const withoutSize = prev.filter((k) => !["size4", "size3"].includes(k));
        return already ? withoutSize : [...withoutSize, id];
      }
      return prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id];
    });
  };

  const addCustomKeyword = () => {
    const kw = customInput.trim();
    if (kw && !customKeywords.includes(kw)) {
      setCustomKeywords((prev) => [...prev, kw]);
    }
    setCustomInput("");
    setShowCustomInput(false);
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(45,45,45,0.76)] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white rounded-t-[14px] px-7 pt-6 pb-4 border-b border-gray-100 z-10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1e2939]">키워드 선택</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 font-bold text-lg"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* 키워드 칩 */}
          <div className="flex flex-wrap gap-2 items-center">
            {TEAM_KEYWORDS.map((kw) => (
              <button
                key={kw.id}
                onClick={() => toggleKeyword(kw.id, kw.group)}
                className={`px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all ${activeKeywords.includes(kw.id)
                  ? "bg-[#155dfc] text-white"
                  : "bg-[#f3f4f6] text-[#4a5565] hover:bg-gray-200"
                  }`}
              >
                {kw.label}
              </button>
            ))}

            {customKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => setCustomKeywords((prev) => prev.filter((k) => k !== kw))}
                className="bg-[#155dfc] text-white px-4 py-1.5 rounded-[8px] text-sm font-medium flex items-center gap-1"
              >
                {kw}
                <span className="text-white/70 text-xs ml-1">✕</span>
              </button>
            ))}

            {showCustomInput ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomKeyword();
                    if (e.key === "Escape") setShowCustomInput(false);
                  }}
                  placeholder="키워드 입력..."
                  className="border border-[#155dfc] rounded-[8px] px-3 py-1.5 text-sm outline-none w-28"
                />
                <button onClick={addCustomKeyword} className="bg-[#155dfc] text-white px-2.5 py-1.5 rounded-[8px] text-sm font-bold">
                  확인
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-8 h-8 bg-[#f3f4f6] text-[#4a5565] rounded-[8px] flex items-center justify-center hover:bg-gray-200 transition-colors font-bold text-base"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* 팀 그리드 */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {teams.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[#6a7282] text-sm">
              팀을 생성해주세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {teams.map((members, i) => (
                <TeamBox key={i} teamNumber={i + 1} members={members} />
              ))}
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <div className="flex-shrink-0 px-7 py-5 border-t border-gray-100 flex justify-center">
          <button
            onClick={() => generate(activeKeywords)}
            className="bg-[#155dfc] text-white px-20 py-3 rounded-[10px] font-bold text-base hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Shuffle className="w-4 h-4" />
            생성
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── 학생 카드 ─────────── */

function StudentCard({ student, onClick }: { student: Student; onClick?: () => void }) {
  const isSelf = student.isSelf;
  return (
    <button
      onClick={onClick}
      className={`rounded-[14px] border-2 p-6 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer text-left w-full ${isSelf
        ? "bg-white border-[#2b7fff] hover:border-[#155dfc]"
        : "bg-white border-[#e5e7eb] hover:border-[#bedbff]"
        }`}
    >
      <div className="flex justify-center">
        <StudentAvatar student={student} />
      </div>
      <div className="text-center">
        <p className="text-[#101828] font-bold text-lg">
          {student.name}
          {isSelf && <span className="text-[#6a7282] font-normal text-base"> (나)</span>}
        </p>
        <p className="text-[#6a7282] text-xs mt-0.5">{student.major}</p>
      </div>
      <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[10px] px-4 py-3">
        <p className="text-[#1c398e] text-xs text-center leading-[1.6]">{student.bio}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {student.tags.map((tag) => (
          <span key={tag} className="bg-[#f3f4f6] text-[#4a5565] text-[10px] px-3 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

/* ─────────── 푸터 ─────────── */

function Footer() {
  return (
    <footer className="bg-[#111827] text-white mt-16">
      <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="text-xl font-bold mb-2">CampusConnect</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            학생들의 팀 프로젝트 협업을 위한<br />올인원 플랫폼
          </p>
        </div>
        <div>
          <p className="font-semibold mb-3">연락처</p>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>✉ support@campusconnect.com</li>
            <li>📞 02-1234-5678</li>
            <li>📍 서울특별시 광진구 능동로 209</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">바로가기</p>
          <ul className="text-gray-400 text-sm space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
            <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            <li><a href="#" className="hover:text-white transition-colors">공지사항</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-6 text-center text-gray-500 text-xs space-y-1">
        <p>© 2026 CampusConnect. All rights reserved.</p>
        <p>본 서비스는 교육 목적으로 제작된 프로젝트입니다.</p>
      </div>
    </footer>
  );
}

/* ─────────── 페이지 ─────────── */

export default function StudentsNetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRandomTeamModal, setShowRandomTeamModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentExtras, setStudentExtras] = useState<Record<string, StudentExtra>>({});
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<EditForm>({
    major: "벤처중소기업학 / 글로벌미디어 복수전공",
    mbti: "intp, 꼼꼼함, 완벽주의자",
    careerInterest: "기획/디자인",
    hobbies: "기아타이거즈, TFT",
    bio: "안녕하세요. 저는 벤처중소기업학과 22학번 류지원입니다. 서비스 기획에 관심이 있고 연락 잘 됩니다.",
    portfolioFileName: "류지원_포트폴리오_2026.pdf",
  });

  const { isProfessor, isStudent, user } = useAuth();
  const professor = isProfessor ? (user as ProfessorProfile) : null;
  const selfStudent = students.find((s) => s.isSelf) ?? students[0];
  const otherStudents = students.filter((s) => !s.isSelf);

  useEffect(() => {
    Promise.all([
      api.studentNetwork.getStudents(),
      api.studentNetwork.getExtras(),
      api.studentNetwork.getEditForm(),
    ])
      .then(([studentData, extraData, formData]) => {
        setStudents(studentData.length > 0 ? studentData : fallbackStudents);
        setStudentExtras(Object.keys(extraData).length > 0 ? extraData : fallbackStudentExtras);
        setEditForm({
          major: formData.major,
          mbti: formData.mbti,
          careerInterest: formData.careerInterest,
          hobbies: formData.hobbies,
          bio: formData.bio,
          portfolioFileName: formData.portfolioFileName,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <p className="text-[#4a5565] font-medium">수강자 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!selfStudent) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <p className="text-[#4a5565] font-medium">이 수업에 등록된 학생이 없습니다.</p>
      </div>
    );
  }

  const filteredOthers = otherStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.major.toLowerCase().includes(q) ||
      s.bio.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const allDisplayStudents = isStudent ? [selfStudent, ...filteredOthers] : filteredOthers;

  return (
    // 전체 페이지 컨테이너
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
        <h2 className="text-[#155dfc] text-2xl font-bold mb-6">수강자들 네트워크</h2>

        {/* 교수 프로필 배너 */}
        {isProfessor && professor && (
          <div className="bg-[#f0f5ff] border border-[#c7d9f8] rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#dbe8fb] flex items-center justify-center flex-shrink-0 ring-2 ring-[#b8d0f5]">
                  <span className="text-xl font-bold text-[#2b5db5]">{professor.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[#1e3a6e]">{professor.name}</span>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">교수</span>
                  </div>
                  <p className="text-[#4a6fa5] text-sm">{professor.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#4a6fa5]">
                {professor.office && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7a9fd4] flex-shrink-0" />
                    <span>{professor.office}</span>
                  </div>
                )}
                {professor.officeHours && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#7a9fd4] flex-shrink-0" />
                    <span>오피스아워: {professor.officeHours}</span>
                  </div>
                )}
                {professor.researchAreas && professor.researchAreas.length > 0 && (
                  <div className="flex items-start gap-1.5 col-span-2">
                    <FlaskConical className="w-3.5 h-3.5 text-[#7a9fd4] flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {professor.researchAreas.map((area) => (
                        <span key={area} className="bg-[#dce9fb] text-[#2b5db5] text-xs px-2.5 py-0.5 rounded-full">{area}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#c7d9f8] flex items-center gap-2 text-[#4a6fa5] text-sm">
              <BookOpen className="w-4 h-4 text-[#7a9fd4]" />
              <span>현재 수강자 <span className="text-[#1e3a6e] font-bold">{students.length}명</span>이 등록되어 있습니다.</span>
            </div>
          </div>
        )}

        {/* 학생 본인 프로필 배너 */}
        {isStudent && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[#101828] text-xl font-bold">류지원 (나)</span>
                  <span className="text-[#6a7282] text-sm">4학년</span>
                </div>
                <p className="text-[#6a7282] text-sm">{editForm.major}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selfStudent.tags.map((tag) => (
                    <span key={tag} className="bg-[#f3f4f6] text-[#4a5565] text-xs px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0 flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                내 정보 수정
              </button>
            </div>
          </div>
        )}

        {/* 검색 + 랜덤 팀 생성 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowRandomTeamModal(true)}
            className="bg-[#155dfc] text-white px-5 py-2 rounded-[8px] font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Shuffle className="w-4 h-4" />
            랜덤 팀 생성 +
          </button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="키워드를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 학생 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {allDisplayStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={
                student.isSelf
                  ? () => setShowMyProfileModal(true)
                  : () => setSelectedStudent(student)
              }
            />
          ))}
        </div>

        {filteredOthers.length === 0 && searchQuery.trim() && (
          <div className="text-center py-16 text-gray-500">
            <p>"{searchQuery}"에 해당하는 수강자를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>

      <Footer />

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          studentExtras={studentExtras}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {showMyProfileModal && (
        <StudentProfileModal
          student={selfStudent}
          studentExtras={studentExtras}
          onClose={() => setShowMyProfileModal(false)}
          onEditClick={() => setShowEditModal(true)}
        />
      )}

      {showEditModal && (
        <MyInfoEditModal
          initialForm={editForm}
          onClose={() => setShowEditModal(false)}
          onSave={(form) => setEditForm(form)}
        />
      )}

      {showRandomTeamModal && (
        <RandomTeamModal
          allStudents={students}
          onClose={() => setShowRandomTeamModal(false)}
        />
      )}
    </div>
  );
}
