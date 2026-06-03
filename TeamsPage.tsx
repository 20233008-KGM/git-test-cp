import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient"; // 정석대로 연결!

const STAGES = [
  "아이디어 기획",
  "서비스 디자인",
  "프론트 개발",
  "백앤드 개발",
  "배포 & 고객 테스트",
];

interface TeamMember {
  id: string;
  initial: string;
  color: string;
}

interface Activity {
  tag: string;
  title: string;
  description: string;
  time: string;
}

interface TeamCard {
  id: string;
  name: string;
  badge?: string;
  projectTitle: string;
  members: TeamMember[];
  progress: number;
  completedStages: number;
  activities: Activity[];
}

interface Announcement {
  title: string;
  description: string;
  dDay: number;
}

// ⚠️ 가짜 `teams` 배열은 완전히 삭제했습니다! 오직 수파베이스 데이터만 씁니다.

const announcements: Announcement[] = [
  {
    title: "중간발표 관련 공지",
    description:
      "해결방안에 맞는 POC 초안설계(핵심기능위주, Figma 활용), 검토 및 수정(10주차까지 2주의 시간이 있으므로 수업 이외시간에 진행가능보임)",
    dDay: 3,
  },
  {
    title: "주제 발표 공지 (11주차, 12주차 진행)",
    description:
      '이번 주제발표는 "우리 프로젝트를 더 좋게 만들기 위한 실전 적용 발표"이며, 다른 팀도 바로 활용할 수 있게 만드는 발표, 그리고 발표 후 서로 자연스럽게 묻고 배우는 시간까지 포함한 활동입니다.',
    dDay: 18,
  },
];

function StageProgress({ completedStages }: { completedStages: number }) {
  return (
    <div className="flex flex-col">
      {STAGES.map((stage, i) => {
        const isDone = i < completedStages;
        const isLineBlue = i < completedStages - 1;
        return (
          <div key={stage}>
            {/* Stage row */}
            <div className="flex items-center gap-2">
              {/* Dot */}
              <div
                className={`w-[18px] h-[18px] rounded-full flex-shrink-0 ${
                  isDone ? "bg-[#3676ff]" : "bg-black"
                }`}
              />
              {/* Label */}
              <div className="flex-1 bg-[#d2e0ff] border border-[#0143d2] rounded-[5px] px-2 py-[3px]">
                <span className="text-[#101828] text-[11px] font-medium">
                  {stage}
                </span>
              </div>
            </div>
            {/* Connector line between stages */}
            {i < STAGES.length - 1 && (
              <div
                className={`ml-[5.5px] w-[7px] h-[10px] ${
                  isLineBlue ? "bg-[#3676ff]" : "bg-[#c8c8c8]"
                } rounded-sm`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="bg-white border border-[#d2e0ff] rounded-[10px] p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-[#3676ff] bg-[#eff6ff] px-2 py-0.5 rounded-full">
          {activity.tag}
        </span>
        <span className="text-[10px] text-gray-400">{activity.time}</span>
      </div>
      <p className="text-[11px] font-bold text-[#101828] mb-0.5">{activity.title}</p>
      <p className="text-[10px] text-gray-500 leading-[1.4] line-clamp-2">
        {activity.description}
      </p>
    </div>
  );
}

function TeamCardComponent({
  team,
  onClick,
}: {
  team: TeamCard;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[14px] border border-gray-200 shadow-[2px_4px_4px_2px_rgba(224,224,224,0.28)] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
    >
      {/* Blue gradient header */}
      <div className="bg-gradient-to-r from-[#3676ff] to-[#003ecc] px-5 py-5 border-b border-black/10 flex-shrink-0">
        <p className="text-white font-black text-3xl leading-none mb-1">
          {team.name}
        </p>
        {team.badge && (
          <p className="text-white text-xs font-bold leading-snug mt-1">
            {team.badge}
          </p>
        )}
        {!team.badge && <div className="h-4" />}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Project title */}
        <p className="text-[#101828] font-bold text-base text-center">
          {team.projectTitle}
        </p>

        {/* Enter button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full bg-[#3676ff] text-white rounded-[10px] py-2 font-bold flex items-center justify-center gap-2 hover:bg-[#255dd4] transition-colors text-sm shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10.6239 13.9775L14.4999 10L10.6239 6.02252M14.4999 10H5.98347M1 15.625L1 4.37498C1 2.51103 2.51103 1 4.37498 1L15.6249 1C17.4889 1 18.9999 2.51103 18.9999 4.37498V15.625C18.9999 17.489 17.4889 19 15.6249 19H4.37498C2.51103 19 1 17.489 1 15.625Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          입장하기
        </button>

        {/* Progress label */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#3676ff]" />
          <span className="text-[#3676ff] text-xs font-bold">
            {team.progress}% 진행중
          </span>
        </div>

        {/* Stage progress */}
        <StageProgress completedStages={team.completedStages} />

        {/* Recent activity */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
            📋 최근 업데이트 &amp; 활동
          </p>
          {team.activities && team.activities.length > 0 ? (
            <div className="flex flex-col gap-2">
              {team.activities.map((activity, idx) => (
                <ActivityCard key={idx} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-3 text-center">
              <p className="text-[11px] text-gray-400">아직 활동 기록이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Member avatars at bottom */}
      <div className="px-5 pb-4 flex items-center gap-1 flex-shrink-0">
        {team.members && team.members.map((member) => (
          <div
            key={member.id}
            className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}
          >
            <span className="text-[10px] font-bold text-[#364153]">
              {member.initial}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#111827] text-white mt-16">
      <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="text-xl font-bold mb-2">CampusConnect</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            학생들의 팀 프로젝트 협업을 위한
            <br />
            올인원 플랫폼
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

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [loading, setLoading] = useState(true);

  // 팝업 관련 상태
  const [showModal, setShowModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", project_title: "" });

  // 🔗 수강자 테이블 연동을 위한 전용 상태 추가
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const AVATAR_COLORS = ["bg-[#e5e7eb]", "bg-[#d1d5dc]", "bg-[#99a1af]", "bg-[#eff6ff]", "bg-[#d2e0ff]"];

  useEffect(() => {
    fetchTeams();
    fetchStudents(); // 컴포넌트가 켜질 때 학생 목록도 같이 가져옵니다.
  }, []);

  // 📡 1. 진짜 관계형 데이터 가져오기 (JOIN 연동)
  async function fetchTeams() {
    setLoading(true);
    try {
      // 껍데기 복사가 아니라 Teams를 긁어올 때 속해있는 진짜 Students 원본을 결합(JOIN)해서 가져옵니다!
      const { data, error } = await supabase
        .from("Teams")
        .select(`
        
          *,
          Students (
            id,
            name,
            major
          )
        `)
        .order("id", { ascending: true });

      if (error) {
        console.error("데이터 가져오기 실패:", error.message);
      } else if (data) {
        const formattedTeams = data.map((t: any) => {
          // 이 조에 속한 학생들(team_id가 일치하는 학생들)의 원본 데이터를 순회하며 아바타 칩 정보로 자동 가공합니다.
          const members: TeamMember[] = (t.Students || []).map((s: any, index: number) => ({
            id: String(s.id),
            initial: s.name ? s.name.charAt(0) : "익", // 원본 이름이 바뀌면 첫 글자도 자동 갱신!
            color: AVATAR_COLORS[index % AVATAR_COLORS.length],
          }));

          return {
            id: String(t.id),
            name: t.name,
            badge: t.badge || "",
            projectTitle: t.project_title,
            progress: t.progress,
            completedStages: t.completed_stages,
            members: members, // 조립 완료된 진짜 원본 기반 멤버들 박아넣기
            activities: [],
          };
        });
        setTeams(formattedTeams);
      }
    } catch (err) {
      console.error("알 수 없는 에러:", err);
    } finally {
      setLoading(false);
    }
  }

  // 📡 2. 수강자 테이블에서 학생 명부 긁어오기
  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from("Students")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data) {
        setStudents(data);
      }
    } catch (err) {
      console.error("학생 목록 불러오기 실패:", err);
    }
  }

  // 🔘 3. 체크박스 선택 처리 함수
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // 📡 4. 근본적인 양방향 팀 생성 로직 (Insert 후 연결고리 업데이트)
  const handleCreateTeam = async () => {
    if (!newTeam.name) return alert("팀 이름을 입력해주세요!");

    try {
      // Step A: Teams 테이블에 먼저 새로운 조 껍데기를 생성합니다.
      const { data: teamData, error: teamError } = await supabase
        .from("Teams")
        .insert([
          {
            name: newTeam.name,
            project_title: newTeam.project_title,
            progress: 0,
            completed_stages: 0,
          },
        ])
        .select()
        .single();

      if (teamError) {
        alert("팀 생성 실패: " + teamError.message);
        return;
      }

      // Step B: 생성에 성공하여 발급된 진짜 팀 id를 선택한 학생들의 team_id 칸에 쾅 찍어줍니다!
      if (teamData && selectedStudentIds.length > 0) {
        const { error: studentError } = await supabase
          .from("Students")
          .update({ team_id: teamData.id }) // 방금 만들어진 조의 고유 ID로 갱신
          .in("id", selectedStudentIds); // 체크된 모든 학생 일괄 적용

        if (studentError) {
          console.error("학생들의 팀 ID 매핑 실패:", studentError.message);
        }
      }

      // 상태 초기화 및 창 닫기
      setShowModal(false);
      setNewTeam({ name: "", project_title: "" });
      setSelectedStudentIds([]);
      fetchTeams(); // 완벽하게 자동 갱신된 리스트 긁어오기!
    } catch (err) {
      console.error("오류 발생:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-black text-[#155dfc] text-xl gap-2">
        <span className="animate-bounce text-4xl">🌐</span>
        데이터를 연결하는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-[#155dfc] tracking-tight">
            [2026-1] [웹프로그래밍] [가반]
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#1962ff] text-white px-5 py-2.5 rounded-[10px] font-bold hover:bg-[#1450e0] transition-colors shadow-md text-sm"
          >
            + 새 팀 만들기
          </button>
        </div>

        <div className="grid grid-cols-5 gap-5">
          {teams.map((team) => (
            <TeamCardComponent
              key={team.id}
              team={team}
              onClick={() => navigate(`/app/teams/${team.id}`)}
            />
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-black text-[#101828] mb-5 flex items-center gap-2">
            📌 중요 공지 &amp; 마감일
          </h2>
          <div className="flex flex-col gap-4">
            {announcements.map((ann, i) => (
              <div
                key={i}
                className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex items-start justify-between gap-6"
              >
                <div className="flex-1">
                  <p className="font-bold text-[#101828] text-base mb-2">
                    {ann.title}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {ann.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="bg-[#fee2e2] text-[#dc2626] text-sm font-bold px-3 py-1 rounded-full">
                    D-{ann.dDay}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      {/* 팝업 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-96 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6 text-[#101828]">새 팀 등록</h2>
            <input
              placeholder="팀 이름"
              className="w-full border p-3 mb-4 rounded-xl outline-none focus:border-[#155dfc]"
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            />
            <input
              placeholder="프로젝트 제목"
              className="w-full border p-3 mb-6 rounded-xl outline-none focus:border-[#155dfc]"
              onChange={(e) => setNewTeam({ ...newTeam, project_title: e.target.value })}
            />

            {/* 🔗 진짜 데이터베이스에서 동적으로 긁어온 학생들 명부 노출 */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 mb-3">👥 팀원 선택 (수강자 데이터 자동 연동)</p>
              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 max-h-40 overflow-y-auto space-y-2.5">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-3 cursor-pointer select-none text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#155dfc] cursor-pointer"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleToggleStudent(student.id)}
                    />
                    <span>{student.name} ({student.major || "전공 미지정"})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setSelectedStudentIds([]); }}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleCreateTeam}
                className="flex-1 py-3 bg-[#155dfc] text-white rounded-xl font-bold hover:bg-blue-700"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}