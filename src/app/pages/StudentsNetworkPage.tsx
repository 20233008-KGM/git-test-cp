import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Search, BookOpen, Clock, MapPin, FlaskConical, User, Pencil, Shuffle } from "lucide-react";
import { api } from "../api/supabase-api";
import AppModal from "../components/layout/AppModal";
import PageLoading from "../components/layout/PageLoading";
import { useAuth } from "../contexts/AuthContext";
import type { Course, ProfessorProfile } from "../types";
import DirectChatModal from "../components/DirectChatModal";
import {
  NETWORK_BIO_PLACEHOLDER,
  NETWORK_BIO_PLACEHOLDER_OTHER,
  NETWORK_MAJOR_PLACEHOLDER,
  NETWORK_TAGS_EMPTY_LABEL,
  buildMinimalStudentExtra,
  displayBio,
  displayMajor,
  nameToAvatarInitial,
  normalizeStudentTags,
  resolveStudentExtra,
  tagsFromEditHints,
  type ResolvedStudentExtra,
} from "../utils/studentNetworkDisplay";

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

function enrichStudentForDisplay(student: Student, editForm?: EditForm): Student {
  const avatar = student.avatar?.trim() || nameToAvatarInitial(student.name);
  const major = student.major?.trim() || (student.isSelf ? editForm?.major?.trim() : "") || "";
  const bio = student.bio?.trim() || (student.isSelf ? editForm?.bio?.trim() : "") || "";
  const tags =
    student.tags.length > 0
      ? student.tags
      : student.isSelf
        ? tagsFromEditHints(editForm)
        : [];

  return { ...student, avatar, major, bio, tags: normalizeStudentTags(tags) };
}

function enrichStudentExtras(
  studentList: Student[],
  extras: Record<string, StudentExtra>,
): Record<string, StudentExtra> {
  const merged = { ...extras };
  for (const student of studentList) {
    if (!merged[student.id]) {
      merged[student.id] = buildMinimalStudentExtra(student.bio);
    }
  }
  return merged;
}

function StudentAvatar({ student, size = "md" }: { student: Student; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const textClass = size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-2xl";
  const initial = student.avatar?.trim() || nameToAvatarInitial(student.name);
  if (student.image) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0`}>
        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0`}>
      <span className={`text-[#2b7fff] ${textClass} font-bold`}>{initial}</span>
    </div>
  );
}

function TemperatureBar({ extra }: { extra: ResolvedStudentExtra }) {
  if (!extra.hasLearningProfile) {
    return (
      <div className="rounded-[14px] border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm font-medium text-[#6a7282]">매너온도</p>
        <p className="mt-1 text-xs text-[#9ca3af]">팀 활동 후 동료 평가가 쌓이면 표시됩니다.</p>
      </div>
    );
  }

  const value = extra.temperature;
  const pct = Math.min(100, Math.max(0, ((value - 36) / 3) * 100));
  const emoji = value >= 38 ? "😄" : value >= 37 ? "😊" : "😐";
  return (
    <div className="bg-[#eff6ff] rounded-[14px] shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-bold text-black">매너온도</p>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="text-[#155dfc] text-3xl font-black mb-3">{value}°C</p>
      <div className="h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#b0bfde] via-[#63bfed] to-[#155dfc]"
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
  editForm,
  courseId,
  onClose,
  onEditClick,
}: {
  student: Student;
  studentExtras: Record<string, StudentExtra>;
  editForm?: EditForm;
  courseId?: string;
  onClose: () => void;
  onEditClick?: () => void;
}) {
  const [showDirectChat, setShowDirectChat] = useState(false);
  const displayStudent = enrichStudentForDisplay(student, editForm);
  const extra = resolveStudentExtra(displayStudent, studentExtras, editForm);
  const majorLabel = displayMajor(displayStudent.major);
  const bioIsPlaceholder =
    extra.detailedBio === NETWORK_BIO_PLACEHOLDER ||
    extra.detailedBio === NETWORK_BIO_PLACEHOLDER_OTHER;

  return (
    <AppModal
      open
      onClose={onClose}
      testId="student-profile-modal-overlay"
      ariaLabel="수강생 프로필"
      panelClassName="!p-0 w-full max-w-[520px] overflow-y-auto rounded-[14px] shadow-2xl"
    >
      <div data-testid="student-profile-modal">
        <div className="sticky top-0 bg-white rounded-t-[14px] px-6 pt-5 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <StudentAvatar student={displayStudent} size="md" />
              <div>
                <p className="text-lg font-bold text-[#101828]">
                  {displayStudent.name}
                  {displayStudent.isSelf && <span className="text-[#6a7282] font-normal text-base"> (나)</span>}
                </p>
                <p className={`text-sm ${majorLabel === NETWORK_MAJOR_PLACEHOLDER ? "text-[#9ca3af] italic" : "text-[#6a7282]"}`}>
                  {majorLabel}
                </p>
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
          <TemperatureBar extra={extra} />

          <div>
            <p className="text-base font-bold text-black mb-2">동료 키워드</p>
            {extra.keywords.length > 0 ? (
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
            ) : (
              <p className="text-sm text-[#9ca3af] rounded-[10px] border border-dashed border-gray-200 px-4 py-3">
                아직 받은 키워드가 없습니다.
              </p>
            )}
          </div>

          <div className="border-t border-[rgba(218,218,218,0.55)]" />

          <div>
            <p className="text-base font-bold text-black mb-2">자기소개</p>
            <div className={`border rounded-[10px] px-4 py-3 ${bioIsPlaceholder ? "border-dashed border-gray-200 bg-gray-50" : "border-gray-200"}`}>
              <p
                className={`text-sm leading-relaxed ${bioIsPlaceholder ? "text-[#9ca3af] italic" : "text-[#364153]"}`}
                data-testid="student-profile-modal-detailed-bio"
              >
                {extra.detailedBio}
              </p>
            </div>
          </div>

          <div>
            <p className="text-base font-bold text-black mb-2">포트폴리오 & 첨부파일</p>
            <div className="border border-gray-200 rounded-[10px] px-4 py-2.5 flex items-center gap-2">
              <span className="text-gray-400 text-sm">📎</span>
              {extra.portfolioFile ? (
                <span className="text-[#155dfc] text-sm underline cursor-pointer hover:text-blue-700">
                  {extra.portfolioFile}
                </span>
              ) : (
                <span className="text-sm text-[#9ca3af]">등록된 파일 없음</span>
              )}
            </div>
          </div>

          {displayStudent.isSelf ? (
            onEditClick ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditClick();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#155dfc] py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                <Pencil className="h-4 w-4" />
                내 정보 수정
              </button>
            ) : (
              <Link
                to="/app/mypage/profile"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#155dfc] py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                data-testid="student-profile-edit-link"
              >
                <Pencil className="h-4 w-4" />
                내 정보 수정
              </Link>
            )
          ) : (
            <button
              type="button"
              disabled={!courseId}
              onClick={() => courseId && setShowDirectChat(true)}
              data-testid="student-profile-direct-chat-open"
              className="w-full rounded-[10px] bg-[#101828] py-3 text-sm font-bold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              1:1 채팅하기
            </button>
          )}
        </div>
      </div>
      {courseId && !displayStudent.isSelf && (
        <DirectChatModal
          open={showDirectChat}
          courseId={courseId}
          peerUserId={displayStudent.id}
          peerName={displayStudent.name}
          onClose={() => setShowDirectChat(false)}
        />
      )}
    </AppModal>
  );
}

interface EditForm {
  major: string;
  mbti: string;
  careerInterest: string;
  hobbies: string;
  bio: string;
  portfolioFileName: string;
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

function RandomTeamModal({
  courseId,
  allStudents,
  assignedStudentIds,
  canSave,
  onClose,
}: {
  courseId: string;
  allStudents: Student[];
  assignedStudentIds: string[];
  canSave: boolean;
  onClose: () => void;
}) {
  const [activeKeywords, setActiveKeywords] = useState<string[]>(["size4", "even", "career", "mbti"]);
  const [teamSize, setTeamSize] = useState(4);
  const [teams, setTeams] = useState<Student[][]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const unassignedStudents = allStudents.filter((s) => !assignedStudentIds.includes(s.id));

  const generate = (kws: string[], sizeOverride?: number) => {
    const sizeFromKeyword = kws.includes("size3") ? 3 : 4;
    const size = Math.min(8, Math.max(2, sizeOverride ?? teamSize ?? sizeFromKeyword));
    let pool = [...unassignedStudents];

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
    generate(activeKeywords, teamSize);
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
    <AppModal
      open
      onClose={onClose}
      testId="random-team-modal-overlay"
      ariaLabel="키워드 선택"
      panelClassName="!p-0 flex max-w-[900px] w-full flex-col overflow-hidden rounded-[14px] shadow-2xl !max-h-[90vh]"
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

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-bold text-[#364153]" htmlFor="random-team-size">
              팀당 인원
            </label>
            <input
              id="random-team-size"
              type="number"
              min={2}
              max={8}
              value={teamSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setTeamSize(Math.min(8, Math.max(2, next)));
              }}
              data-testid="random-team-size-input"
              className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <span className="text-xs text-[#6a7282]">2~8명</span>
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

        {/* 생성·저장 */}
        <div className="flex-shrink-0 px-7 py-5 border-t border-gray-100 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => generate(activeKeywords, teamSize)}
            className="bg-[#155dfc] text-white px-12 py-3 rounded-[10px] font-bold text-base hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Shuffle className="w-4 h-4" />
            다시 생성
          </button>
          {canSave && (
            <button
              type="button"
              disabled={saving || teams.length === 0}
              onClick={async () => {
                if (!courseId || teams.length === 0) return;
                setSaving(true);
                try {
                  const result = await api.teams.saveRandomAssignment(
                    courseId,
                    teams.map((group) => group.map((student) => student.id))
                  );
                  alert(`${result.teamCount}개 팀, ${result.memberCount}명 배정을 저장했습니다.`);
                  onClose();
                } catch (error) {
                  console.error(error);
                  alert(error instanceof Error ? error.message : "팀 배정 저장에 실패했습니다.");
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-[10px] border border-[#155dfc] bg-white px-12 py-3 text-base font-bold text-[#155dfc] transition-colors hover:bg-blue-50 disabled:opacity-60"
            >
              {saving ? "생성 중..." : "팀 생성하기"}
            </button>
          )}
        </div>
    </AppModal>
  );
}

/* ─────────── 학생 카드 ─────────── */

function StudentCard({
  student,
  studentExtras,
  editForm,
  onClick,
}: {
  student: Student;
  studentExtras: Record<string, StudentExtra>;
  editForm?: EditForm;
  onClick?: () => void;
}) {
  const displayStudent = enrichStudentForDisplay(student, editForm);
  const extra = resolveStudentExtra(displayStudent, studentExtras, editForm);
  const majorLabel = displayMajor(displayStudent.major);
  const bioLabel = displayBio(displayStudent.bio, extra.detailedBio, undefined, {
    isSelf: displayStudent.isSelf,
  });
  const bioIsPlaceholder =
    bioLabel === NETWORK_BIO_PLACEHOLDER || bioLabel === NETWORK_BIO_PLACEHOLDER_OTHER;
  const isSelf = displayStudent.isSelf;

  return (
    <button
      onClick={onClick}
      data-testid={`student-network-card-${student.id}`}
      className={`rounded-[14px] border-2 p-6 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer text-left w-full ${isSelf
        ? "bg-white border-[#2b7fff] hover:border-[#155dfc]"
        : "bg-white border-[#e5e7eb] hover:border-[#bedbff]"
        }`}
    >
      <div className="flex justify-center">
        <StudentAvatar student={displayStudent} />
      </div>
      <div className="text-center">
        <p className="text-[#101828] font-bold text-lg">
          {displayStudent.name}
          {isSelf && <span className="text-[#6a7282] font-normal text-base"> (나)</span>}
        </p>
        <p className={`text-xs mt-0.5 ${majorLabel === NETWORK_MAJOR_PLACEHOLDER ? "text-[#9ca3af] italic" : "text-[#6a7282]"}`}>
          {majorLabel}
        </p>
      </div>
      <div
        className={`rounded-[10px] px-4 py-3 border ${
          bioIsPlaceholder
            ? "bg-gray-50 border-dashed border-gray-200"
            : "bg-[#eff6ff] border-[#bedbff]"
        }`}
      >
        <p
          className={`text-xs text-center leading-[1.6] ${
            bioIsPlaceholder ? "text-[#9ca3af] italic" : "text-[#1c398e]"
          }`}
        >
          {bioLabel}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center min-h-[1.5rem]">
        {displayStudent.tags.length > 0 ? (
          displayStudent.tags.map((tag) => (
            <span key={tag} className="bg-[#f3f4f6] text-[#4a5565] text-[10px] px-3 py-1 rounded-full">
              {tag}
            </span>
          ))
        ) : (
          <span className="bg-[#f9fafb] text-[#9ca3af] text-[10px] px-3 py-1 rounded-full italic">
            {NETWORK_TAGS_EMPTY_LABEL}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─────────── 페이지 ─────────── */

export default function StudentsNetworkPage() {
  const { courseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showRandomTeamModal, setShowRandomTeamModal] = useState(false);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentExtras, setStudentExtras] = useState<Record<string, StudentExtra>>({});
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const emptyEditForm: EditForm = {
    major: "",
    mbti: "",
    careerInterest: "",
    hobbies: "",
    bio: "",
    portfolioFileName: "",
  };
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);

  const { isProfessor, isStudent, isAdmin, user } = useAuth();
  const professor = isProfessor ? (user as ProfessorProfile) : null;

  const selfStudent = useMemo(() => {
    const fromList = students.find((s) => s.isSelf);
    const base: Student | null =
      fromList ??
      (isStudent && user?.role === "student"
        ? {
            id: user.id,
            name: user.name,
            isSelf: true,
            major: user.major ?? "",
            bio: user.bio ?? "",
            tags: normalizeStudentTags([], user.skills),
            avatar: nameToAvatarInitial(user.name),
          }
        : null);
    if (!base) return null;
    if (user?.imageUrl) return { ...base, image: user.imageUrl };
    return base;
  }, [students, isStudent, user, user?.imageUrl]);

  const displaySelfStudent = useMemo(
    () => (selfStudent ? enrichStudentForDisplay(selfStudent, editForm) : null),
    [selfStudent, editForm],
  );

  const currentStudentId =
    isStudent && user?.role === "student" ? user.id : selfStudent?.id;
  const otherStudents = students.filter(
    (s) => !s.isSelf && s.id !== currentStudentId,
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.studentNetwork.getStudents(courseId),
      api.studentNetwork.getExtras(),
      api.studentNetwork.getEditForm(),
      courseId ? api.courses.getById(courseId) : Promise.resolve(undefined),
    ])
      .then(([studentData, extraData, formData, courseData]) => {
        // vision 추가요청 #13: /courses/:courseId/students 에서는 DB가 비어 있어도 데모 목록으로 대체하지 않음
        const useCourseScope = Boolean(courseId);
        const list =
          useCourseScope || studentData.length > 0 ? studentData : fallbackStudents;
        setStudents(list);
        const baseExtras =
          useCourseScope || Object.keys(extraData).length > 0
            ? extraData
            : fallbackStudentExtras;
        setStudentExtras(enrichStudentExtras(list, baseExtras));
        setCourse(courseData ?? null);
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
  }, [courseId]);

  useEffect(() => {
    if (!courseId || !(isProfessor || isAdmin)) {
      setAssignedStudentIds([]);
      return;
    }
    void api.teams.getAssignedStudentIds(courseId).then(setAssignedStudentIds);
  }, [courseId, isProfessor, isAdmin]);

  if (loading) {
    return <PageLoading message="수강자 정보를 불러오는 중…" testId="students-network-loading" />;
  }

  if (!selfStudent && isStudent) {
    return (
      <div className="cc-page-main flex min-h-[12rem] w-full items-center justify-center px-4 py-8">
        <p className="text-center font-medium text-[var(--cc-text-secondary)]">
          이 수업 수강자 목록에 본인이 아직 없습니다. 수업 코드로 등록했는지 확인해 주세요.
        </p>
      </div>
    );
  }

  if (!isStudent && students.length === 0) {
    return (
      <div className="cc-page-main flex min-h-[12rem] w-full items-center justify-center py-8">
        <p className="font-medium text-[var(--cc-text-secondary)]">이 수업에 등록된 학생이 없습니다.</p>
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

  const allDisplayStudents =
    isStudent && displaySelfStudent
      ? [displaySelfStudent, ...filteredOthers.map((s) => enrichStudentForDisplay(s))]
      : filteredOthers.map((s) => enrichStudentForDisplay(s));
  const isArchived = course?.status === "archived";

  return (
    <div className="cc-page-main w-full">
        <h2 className="m3-headline-medium cc-text-primary mb-6">수강자들 네트워크</h2>

        {isArchived && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm">
            종료된 수업입니다. 수강자 정보는 읽기 전용으로 조회됩니다.
          </div>
        )}

        {/* 교수 프로필 배너 */}
        {isProfessor && professor && (
          <div className="bg-[#f0f5ff] border border-[#c7d9f8] rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#dbe8fb] flex items-center justify-center flex-shrink-0 ring-2 ring-[#b8d0f5]">
                  <span className="text-xl font-bold text-[#2b5db5]">{professor.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[#1e3a6e]">{professor.name}</span>
                    <span className="cc-badge-info rounded-full px-2 py-0.5 text-xs font-bold">교수</span>
                  </div>
                  <p className="text-[#4a6fa5] text-sm">{professor.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-[#4a6fa5] sm:grid-cols-2">
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
        {isStudent && displaySelfStudent && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <StudentAvatar student={displaySelfStudent} size="lg" />
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#101828] text-xl font-bold">{displaySelfStudent.name} (나)</span>
                    {displaySelfStudent.year && (
                      <span className="text-[#6a7282] text-sm">{displaySelfStudent.year}</span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      displayMajor(displaySelfStudent.major) === NETWORK_MAJOR_PLACEHOLDER
                        ? "text-[#9ca3af] italic"
                        : "text-[#6a7282]"
                    }`}
                  >
                    {displayMajor(displaySelfStudent.major)}
                  </p>
                  <p
                    className={`text-sm leading-relaxed ${
                      displayBio(displaySelfStudent.bio, null) === NETWORK_BIO_PLACEHOLDER
                        ? "text-[#9ca3af] italic"
                        : "text-[#364153]"
                    }`}
                  >
                    {displayBio(displaySelfStudent.bio, null)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {displaySelfStudent.tags.length > 0 ? (
                      displaySelfStudent.tags.map((tag) => (
                        <span key={tag} className="bg-[#f3f4f6] text-[#4a5565] text-xs px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#9ca3af] italic">{NETWORK_TAGS_EMPTY_LABEL}</span>
                    )}
                  </div>
                </div>
              </div>
              {!isArchived && (
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <Link
                    to="/app/mypage/profile"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    data-testid="students-network-edit-profile-link"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    내 정보 수정
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 검색 + 랜덤 팀 생성 */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!isArchived && (isProfessor || isAdmin) && (
            <button
              onClick={() => setShowRandomTeamModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#155dfc] px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
            >
              <Shuffle className="w-4 h-4" />
              랜덤 팀 생성 +
            </button>
          )}
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="키워드를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* 학생 그리드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allDisplayStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              studentExtras={studentExtras}
              editForm={student.isSelf ? editForm : undefined}
              onClick={() =>
                student.isSelf
                  ? setShowMyProfileModal(true)
                  : setSelectedStudent(students.find((s) => s.id === student.id) ?? student)
              }
            />
          ))}
        </div>

        {filteredOthers.length === 0 && searchQuery.trim() && (
          <div className="text-center py-16 text-gray-500">
            <p>"{searchQuery}"에 해당하는 수강자를 찾을 수 없습니다.</p>
          </div>
        )}

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          studentExtras={studentExtras}
          courseId={courseId}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {showMyProfileModal && displaySelfStudent && (
        <StudentProfileModal
          student={displaySelfStudent}
          studentExtras={studentExtras}
          editForm={editForm}
          courseId={courseId}
          onClose={() => setShowMyProfileModal(false)}
          onEditClick={
            isArchived
              ? undefined
              : () => {
                  setShowMyProfileModal(false);
                  navigate("/app/mypage/profile");
                }
          }
        />
      )}

      {!isArchived && showRandomTeamModal && courseId && (
        <RandomTeamModal
          courseId={courseId}
          allStudents={students}
          assignedStudentIds={assignedStudentIds}
          canSave={Boolean(isProfessor || isAdmin)}
          onClose={() => setShowRandomTeamModal(false)}
        />
      )}
    </div>
  );
}
