import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { api } from "../api/supabase-api";
import AppModal from "../components/layout/AppModal";
import { useAuth } from "../contexts/AuthContext";
import {
  hasUnreadTeamActivity,
  latestActivityFingerprint,
  markTeamActivitiesSeen,
} from "../utils/teamActivitySeen";
import { useDebouncedRealtimeReload } from "../hooks/useDebouncedRealtimeReload";

import { TeamStageProgress } from "../components/teams/TeamStageProgress";
import type { Activity, Announcement, Course, TeamCard } from "../types";

// 활동 기록 카드 1개를 그리는 작은 컴포넌트입니다.
// TeamCardComponent 안에서 activity 배열을 map으로 돌리며 여러 개 생성합니다.
function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="bg-white border border-[#d2e0ff] rounded-[10px] p-3 shadow-sm">
      {/* 위쪽 줄에는 활동 종류(tag)와 작성 시간을 양쪽 끝에 배치합니다. */}
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

// 팀 카드 전체를 담당하는 컴포넌트입니다.
// 목록 페이지는 teams 배열을 반복하면서 이 컴포넌트를 팀 개수만큼 만들어냅니다.
function TeamCardComponent({
  team,
  stages,
  isMyTeam,
  onClick,
  showJoinActions,
  onJoin,
  hasUnreadActivity,
  courseId,
}: {
  team: TeamCard;
  stages: string[];
  isMyTeam: boolean;
  onClick: () => void;
  showJoinActions?: boolean;
  onJoin?: () => void;
  hasUnreadActivity?: boolean;
  courseId?: string;
}) {
  return (
    <div
      // 카드 아무 곳이나 눌러도 해당 팀 상세 페이지로 이동하게 합니다.
      onClick={onClick}
      className={`cc-hover-elevate flex h-full min-w-0 flex-col cursor-pointer overflow-hidden rounded-[14px] border bg-white shadow-[2px_4px_4px_2px_rgba(224,224,224,0.28)] ${
        isMyTeam ? "border-[#155dfc] ring-2 ring-[#bfdbfe]" : "border-gray-200"
      }`}
    >
      {/* 카드 상단의 파란 그라데이션 영역입니다. 팀 이름과 뱃지를 보여줍니다. */}
      <div className="relative bg-gradient-to-r from-[#3676ff] to-[#003ecc] px-5 py-5 border-b border-black/10 flex-shrink-0">
        {hasUnreadActivity && (
          <span
            data-testid="team-card-activity-unread"
            className="cc-unread-dot-pulse absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#ef4444] ring-2 ring-white"
            title="확인하지 않은 새 활동"
            aria-hidden
          />
        )}
        <p className="mb-1 text-2xl font-black leading-tight text-white xl:text-xl">
          {team.name}
        </p>
        {/* badge 값이 있으면 뱃지 문구를 보여주고, 없으면 아래에서 빈 높이만 맞춥니다. */}
        {team.badge && (
          <p className="text-white text-xs font-bold leading-snug mt-1">
            {team.badge}
          </p>
        )}
        {!team.badge && <div className="h-4" />}
        {isMyTeam && (
          <span
            data-testid="team-card-my-team-badge"
            className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#155dfc]"
          >
            내가 속한 팀
          </span>
        )}
      </div>

      {/* 카드 본문 영역입니다. 프로젝트명, 입장 버튼, 진행률, 단계, 활동 기록이 들어갑니다. */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* 팀이 진행 중인 프로젝트 제목입니다. */}
        <p className="text-[#101828] font-bold text-base text-center">
          {team.projectTitle}
        </p>

        {/* 입장 버튼입니다. 카드 클릭과 같은 이동 동작을 하지만 버튼처럼 보이게 따로 만들었습니다. */}
        <button
          onClick={(e) => {
            // 버튼을 눌렀을 때 부모 카드의 onClick까지 중복 실행되지 않도록 막습니다.
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

        {showJoinActions && !isMyTeam && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              data-testid={`team-join-${team.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.();
              }}
              className="w-full rounded-[10px] border border-[#155dfc] bg-[#eff6ff] py-2 text-sm font-bold text-[#155dfc] hover:bg-blue-100"
            >
              팀 참여
            </button>
          </div>
        )}
        {showJoinActions && isMyTeam && courseId && (
          <Link
            to={`/app/courses/${courseId}/my-team/manage`}
            onClick={(e) => e.stopPropagation()}
            data-testid={`team-leave-link-${team.id}`}
            className="block text-center text-[11px] font-medium text-[#64748b] underline decoration-[#94a3b8] underline-offset-2 hover:text-[#155dfc]"
          >
            팀 관리에서 탈퇴
          </Link>
        )}

        <TeamStageProgress
          completedStages={team.completedStages}
          stages={stages}
          variant="card"
        />

        {/* 최근 활동 목록입니다. 활동이 없으면 빈 상태 메시지를 대신 보여줍니다. */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
            📋 최근 업데이트 & 활동
          </p>
          {team.activities.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* 활동 배열을 하나씩 ActivityCard로 바꿔서 화면에 표시합니다. */}
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

      {/* 카드 맨 아래의 팀원 아바타 목록입니다. */}
      <div className="px-5 pb-4 flex items-center gap-1 flex-shrink-0">
        {team.members.map((member) => (
          <div
            key={member.id}
            className={`w-8 h-8 ${member.imageUrl ? "" : member.color} rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden`}
          >
            {member.imageUrl ? (
              <img
                src={member.imageUrl}
                alt={member.name ? `${member.name} 프로필` : "팀원 프로필"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-[#364153]">
                {member.initial}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 팀 목록 페이지의 실제 시작점입니다.
// 이 컴포넌트가 팀 카드 목록, 공지 목록, 푸터를 한 화면에 조립합니다.
type UnassignedStudent = { id: string; name: string; studentId: string };

export default function TeamsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams<{ courseId?: string }>();
  const { user, isStudent, isProfessor, isAdmin } = useAuth();
  const canManageAnnouncements = isProfessor || isAdmin;
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  const reloadTeams = React.useCallback(async () => {
    if (!courseId) return;
    const [teamData, announcementData, stageData, courseData] = await Promise.all([
      api.teamCards.getAll(courseId),
      api.announcements.getAll(courseId, 3),
      api.teamStages.getAll(courseId),
      api.courses.getById(courseId),
    ]);
    setTeams(teamData);
    setAnnouncements(announcementData);
    setStages(stageData);
    setCourse(courseData ?? null);
  }, [courseId]);

  useEffect(() => {
    void reloadTeams();
  }, [reloadTeams, location.pathname, location.key]);

  useEffect(() => {
    if (!courseId) return;
    const onFocus = () => {
      void reloadTeams();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void reloadTeams();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [courseId, reloadTeams]);

  const realtimeTables = React.useMemo(
    () =>
      courseId
        ? [
            { table: "ai_teams", filter: `course_id=eq.${courseId}` },
            { table: "ai_team_members" },
            { table: "ai_team_activities" },
            { table: "ai_announcements", filter: `course_id=eq.${courseId}` },
          ]
        : [],
    [courseId]
  );

  useDebouncedRealtimeReload(
    `teams-course-live-${courseId ?? "none"}`,
    Boolean(courseId),
    reloadTeams,
    realtimeTables
  );

  useEffect(() => {
    if (!showCreateModal || !courseId) return;

    let cancelled = false;

    async function loadUnassigned() {
      setLoadingUnassigned(true);
      try {
        const [students, assignedIds] = await Promise.all([
          api.students.getAll(courseId),
          api.teams.getAssignedStudentIds(courseId),
        ]);
        if (cancelled) return;

        const assigned = new Set(assignedIds);
        setUnassignedStudents(
          students
            .filter((student) => !assigned.has(student.id))
            .map((student) => ({
              id: student.id,
              name: student.name,
              studentId: student.studentId,
            }))
        );
      } catch {
        if (!cancelled) setUnassignedStudents([]);
      } finally {
        if (!cancelled) setLoadingUnassigned(false);
      }
    }

    void loadUnassigned();

    return () => {
      cancelled = true;
    };
  }, [showCreateModal, courseId]);

  useEffect(() => {
    if (!showCreateModal) {
      setSelectedMemberIds(new Set());
      return;
    }
    if (isStudent && user?.id) {
      setSelectedMemberIds(new Set([user.id]));
    } else {
      setSelectedMemberIds(new Set());
    }
  }, [showCreateModal, isStudent, user?.id]);

  const isArchived = course?.status === "archived";

  const toggleCreateMember = (studentId: string) => {
    if (isStudent && studentId === user?.id) return;
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewTeamName("");
    setNewProjectTitle("");
    setSelectedMemberIds(new Set());
  };

  const hasMyTeamInCourse = useMemo(
    () =>
      Boolean(
        user?.id && teams.some((team) => team.members.some((member) => member.id === user.id))
      ),
    [teams, user?.id]
  );

  return (
    <div className="cc-page-main w-full">
        {/* 페이지 제목과 새 팀 만들기 버튼이 있는 상단 영역입니다. */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-black tracking-tight text-[#155dfc] sm:text-3xl">
            {course ? `[${course.semester}] [${course.name}]` : "[2026-1] [팀 프로젝트]"}
          </h1>
          {isArchived ? (
            <span className="rounded-[10px] border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-500 shadow-sm">
              종료된 수업: 읽기 전용
            </span>
          ) : (isStudent && hasMyTeamInCourse ? null : (
            <button
              type="button"
              data-testid="teams-create-open"
              onClick={() => setShowCreateModal(true)}
              className="w-full rounded-[10px] bg-[#1962ff] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1450e0] sm:w-auto"
            >
              + 새 팀 만들기
            </button>
          ))}
        </div>

        <AppModal
          open={Boolean(showCreateModal && courseId)}
          onClose={closeCreateModal}
          testId="teams-create-modal-overlay"
          ariaLabel="새 팀 만들기"
          panelClassName="max-w-lg"
        >
              <h2 className="mb-4 text-lg font-bold text-gray-900">새 팀 만들기</h2>
              <div className="flex flex-col gap-3">
                <input
                  data-testid="teams-create-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="팀 이름"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  data-testid="teams-create-project"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="프로젝트 제목 (선택)"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />

                <div data-testid="teams-create-member-picker">
                  <p className="mb-2 text-sm font-bold text-gray-800">
                    팀원 선택
                    <span className="ml-2 font-normal text-gray-500">
                      ({selectedMemberIds.size}명)
                    </span>
                  </p>
                  {isStudent && (
                    <p className="mb-2 text-xs text-gray-500">
                      본인은 팀장으로 자동 포함됩니다. 아래 목록은 <strong>아직 팀에 속하지 않은</strong>{" "}
                      수강생만 표시됩니다.
                    </p>
                  )}
                  {!isStudent && (
                    <p className="mb-2 text-xs text-gray-500">
                      팀 미배정 수강생만 선택할 수 있습니다.
                    </p>
                  )}
                  {!isStudent && selectedMemberIds.size > 0 && (
                    <p className="mb-2 text-xs text-gray-500">
                      가장 먼저 선택한 학생이 팀장이 됩니다.
                    </p>
                  )}
                  {loadingUnassigned ? (
                    <p className="text-sm text-gray-500">수강생 목록 불러오는 중…</p>
                  ) : unassignedStudents.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                      팀에 배정되지 않은 수강생이 없습니다.
                    </p>
                  ) : (
                    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                      {unassignedStudents.map((student) => {
                        const selected = selectedMemberIds.has(student.id);
                        const lockedSelf = isStudent && student.id === user?.id;
                        return (
                          <button
                            key={student.id}
                            type="button"
                            data-testid={`teams-create-member-${student.id}`}
                            disabled={lockedSelf}
                            onClick={() => toggleCreateMember(student.id)}
                            className={`rounded-full border px-3 py-1.5 text-left text-sm transition-colors ${
                              selected
                                ? "border-[#155dfc] bg-[#eff6ff] font-bold text-[#155dfc]"
                                : "border-gray-300 bg-white text-gray-700 hover:border-[#155dfc]/50"
                            } ${lockedSelf ? "cursor-default ring-2 ring-[#155dfc]/30" : ""}`}
                          >
                            <span>{student.name}</span>
                            {student.studentId && (
                              <span className="ml-1 text-xs font-normal text-gray-500">
                                ({student.studentId})
                              </span>
                            )}
                            {lockedSelf && (
                              <span className="ml-1 text-xs font-bold text-[#155dfc]">팀장</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={closeCreateModal}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    data-testid="teams-create-submit"
                    disabled={creating || !newTeamName.trim()}
                    onClick={async () => {
                      setCreating(true);
                      try {
                        const { teamId } = await api.teams.create(courseId, {
                          name: newTeamName,
                          projectTitle: newProjectTitle,
                          memberUserIds: [...selectedMemberIds],
                        });
                        closeCreateModal();
                        await reloadTeams();
                        navigate(`/app/courses/${courseId}/teams/${teamId}`);
                      } catch (error) {
                        alert(error instanceof Error ? error.message : "팀 생성에 실패했습니다.");
                      } finally {
                        setCreating(false);
                      }
                    }}
                    className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {creating ? "생성 중…" : "생성"}
                  </button>
                </div>
              </div>
        </AppModal>

        {isArchived && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600">
            종료된 수업입니다. 팀 정보와 활동 기록은 조회만 가능합니다.
          </div>
        )}

        {/* 데스크탑(xl) 5열 — 카드가 세로로 과도하게 길어지지 않도록 (vision #20) */}
        <div
          className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          data-testid="teams-card-grid"
        >
          {teams.map((team) => {
            const isMyTeam = Boolean(user?.id && team.members.some((member) => member.id === user.id));
            const unread =
              Boolean(courseId && user?.id) &&
              hasUnreadTeamActivity(courseId, user.id, team.id, team.activities);
            return (
              <TeamCardComponent
                key={team.id}
                team={team}
                stages={stages}
                isMyTeam={isMyTeam}
                courseId={courseId}
                hasUnreadActivity={unread}
                showJoinActions={isStudent && !isArchived && !hasMyTeamInCourse}
                onJoin={async () => {
                  try {
                    await api.teams.join(team.id);
                    await reloadTeams();
                  } catch (error) {
                    alert(error instanceof Error ? error.message : "팀 참여에 실패했습니다.");
                  }
                }}
                onClick={() => {
                  if (courseId && user?.id) {
                    markTeamActivitiesSeen(
                      courseId,
                      user.id,
                      team.id,
                      latestActivityFingerprint(team.activities)
                    );
                  }
                  navigate(
                    courseId ? `/app/courses/${courseId}/teams/${team.id}` : `/app/teams/${team.id}`
                  );
                }}
              />
            );
          })}
        </div>

        {/* 중요 공지와 마감일 목록입니다. announcements 배열을 반복해서 카드로 보여줍니다. */}
        <div className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#101828] flex items-center gap-2">
              📌 중요 공지 &amp; 마감일
              <span className="text-sm font-normal text-gray-500">(최신 3건)</span>
            </h2>
            {canManageAnnouncements && courseId && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="teams-announcements-compose"
                  onClick={() => navigate(`/app/courses/${courseId}/announcements/compose`)}
                  className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  공지 작성
                </button>
                <button
                  type="button"
                  data-testid="teams-announcements-manage"
                  onClick={() => navigate(`/app/courses/${courseId}/announcements`)}
                  className="rounded-lg border border-[#155dfc] px-4 py-2 text-sm font-bold text-[#155dfc] hover:bg-[#eff6ff]"
                >
                  공지 목록
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500">등록된 공지가 없습니다.</p>
            )}
            {announcements.map((ann, i) => (
              // 공지 하나를 흰색 카드로 표시합니다.
              <div
                key={i}
                className="flex flex-col gap-4 rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6"
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
                  {/* D-숫자 형태로 마감까지 남은 날짜를 강조해서 보여줍니다. */}
                  <span className="bg-[#fee2e2] text-[#dc2626] text-sm font-bold px-3 py-1 rounded-full">
                    D-{ann.dDay}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
