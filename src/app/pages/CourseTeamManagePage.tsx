import React, { useCallback, useEffect, useState } from "react";
import { Crown, LogOut, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../api/supabase-api";
import {
  TeamStageProgress,
  TeamStageProgressEditor,
} from "../components/teams/TeamStageProgress";
import { useAuth } from "../contexts/AuthContext";
import type { TeamManagementInfo } from "../types";
import PageLoading from "../components/layout/PageLoading";

export default function CourseTeamManagePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isStudent } = useAuth();
  const [info, setInfo] = useState<TeamManagementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferringTo, setTransferringTo] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [completedStages, setCompletedStages] = useState(0);
  const [savingStages, setSavingStages] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) {
      setInfo(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.teams.getManagement(courseId);
      setInfo(data);
      if (data) {
        setEditTeamName(data.teamName);
        setEditProjectTitle(data.projectTitle);
        setCompletedStages(data.completedStages);
      }
    } catch (error) {
      console.error(error);
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleTransferLeader = async (newLeaderUserId: string, newLeaderName: string) => {
    if (!info || info.isArchived || info.myRole !== "leader") return;
    if (
      !window.confirm(
        `${newLeaderName}님에게 팀장을 넘기시겠습니까? 본인은 일반 팀원이 됩니다.`,
      )
    ) {
      return;
    }

    setTransferringTo(newLeaderUserId);
    try {
      await api.teams.transferLeader(info.teamId, newLeaderUserId);
      await load();
      alert(`${newLeaderName}님이 새 팀장이 되었습니다.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "팀장 변경에 실패했습니다.");
    } finally {
      setTransferringTo(null);
    }
  };

  const handleLeaveTeam = async () => {
    if (!info || info.isArchived || leaving) return;
    const leaderNote =
      info.myRole === "leader" && info.members.length > 1
        ? "\n(팀장이 탈퇴하면 가장 먼저 합류한 팀원이 자동으로 팀장이 됩니다.)"
        : "";
    if (
      !window.confirm(
        `「${info.teamName}」 팀에서 탈퇴할까요?${leaderNote}\n탈퇴 후 다른 팀에 참여하려면 팀 목록에서 참여할 수 있습니다.`,
      )
    ) {
      return;
    }

    setLeaving(true);
    try {
      await api.teams.leave(info.teamId);
      navigate(courseId ? `/app/courses/${courseId}/teams` : "/app/teams");
    } catch (error) {
      alert(error instanceof Error ? error.message : "팀 탈퇴에 실패했습니다.");
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return <PageLoading message="팀 정보를 불러오는 중…" testId="course-team-manage-loading" />;
  }

  if (!isStudent) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-[#4a5565]">팀 관리는 학생 계정에서 이용할 수 있습니다.</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm" data-testid="team-manage-empty">
        <h1 className="mb-2 text-2xl font-black text-[#155dfc]">팀 관리</h1>
        <p className="mb-6 text-sm text-[#6a7282]">
          이 수업에 배정된 팀이 없습니다. 팀 목록에서 팀을 만들거나 참여해 주세요.
        </p>
        {courseId && (
          <Link
            to={`/app/courses/${courseId}/teams`}
            className="inline-flex rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            팀 목록으로 이동
          </Link>
        )}
      </div>
    );
  }

  const workspacePath = `/app/courses/${courseId}/teams/${info.teamId}`;
  const otherMembers = info.members.filter((member) => !member.isSelf);
  const canEditStages = info.myRole === "leader" && !info.isArchived;

  return (
    <div className="mx-auto w-full max-w-2xl" data-testid="course-team-manage-page">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff6ff] text-[#155dfc]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#101828]">팀 관리</h1>
            <p className="mt-1 text-sm text-[#6a7282]">
              {info.teamName}
              {info.projectTitle ? ` · ${info.projectTitle}` : ""}
            </p>
          </div>
        </div>

        {info.isArchived && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
            종료된 수업입니다. 팀장 변경·탈퇴는 할 수 없습니다.
          </div>
        )}

        {info.myRole === "leader" && !info.isArchived && (
          <div className="cc-alert-warning mb-6 rounded-xl px-4 py-3 text-sm">
            현재 <strong>팀장</strong>입니다. 아래에서 다른 팀원에게 팀장을 넘길 수 있습니다.
          </div>
        )}

        {info.myRole === "leader" && !info.isArchived && (
          <form
            className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
            data-testid="team-manage-profile-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingProfile(true);
              try {
                await api.teams.updateProfile(info.teamId, {
                  name: editTeamName,
                  projectTitle: editProjectTitle,
                });
                await load();
                alert("팀 정보가 저장되었습니다.");
              } catch (error) {
                alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
              } finally {
                setSavingProfile(false);
              }
            }}
          >
            <h2 className="text-sm font-bold text-[#1e2939]">팀·프로젝트 이름</h2>
            <input
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="팀 이름"
              data-testid="team-manage-name-input"
            />
            <input
              value={editProjectTitle}
              onChange={(e) => setEditProjectTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="프로젝트 이름"
              data-testid="team-manage-project-input"
            />
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-[#155dfc] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {savingProfile ? "저장 중…" : "팀 정보 저장"}
            </button>
          </form>
        )}

        <section
          className="mb-6 rounded-xl border border-gray-200 bg-[#f8fafc] p-4 shadow-sm"
          data-testid="team-manage-stages-section"
        >
          <h2 className="mb-1 text-base font-bold text-[#101828]">팀플 스테이지 진행</h2>
          <p className="mb-3 text-xs text-[#6a7282]">
            {canEditStages
              ? "수업에 정의된 단계 기준으로, 우리 팀이 어디까지 왔는지 표시합니다. 변경 내용은 팀 목록 카드에도 반영됩니다."
              : info.isArchived
                ? "종료된 수업입니다. 진행 상황은 조회만 가능합니다."
                : info.myRole === "leader"
                  ? "종료된 수업이 아니면 팀장이 진행 단계를 수정할 수 있습니다."
                  : "팀장만 진행 단계를 수정할 수 있습니다. 아래는 현재 팀 진행 상황입니다."}
          </p>
          {canEditStages ? (
            <TeamStageProgressEditor
              completedStages={completedStages}
              stages={info.stageNames}
              disabled={info.isArchived}
              saving={savingStages}
              testIdPrefix="team-manage-stage"
              onChange={async (next) => {
                setSavingStages(true);
                try {
                  await api.teams.updateCompletedStages(info.teamId, next);
                  setCompletedStages(next);
                } catch (error) {
                  alert(
                    error instanceof Error ? error.message : "스테이지 진행 저장에 실패했습니다."
                  );
                } finally {
                  setSavingStages(false);
                }
              }}
            />
          ) : (
            <>
              {info.stageNames.length > 0 && (
                <p className="mb-2 text-xs font-medium text-[#4a5565]">
                  완료 {info.completedStages} / {info.stageNames.length} 단계
                </p>
              )}
              <TeamStageProgress
                completedStages={info.completedStages}
                stages={info.stageNames}
              />
            </>
          )}
        </section>

        <h2 className="mb-3 text-base font-bold text-[#1e2939]">팀원</h2>
        <ul className="space-y-2" data-testid="team-manage-member-list">
          {info.members.map((member) => (
            <li
              key={member.id}
              className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                member.role === "leader"
                  ? "border-[#155dfc] bg-[#eff6ff]"
                  : "border-gray-200 bg-gray-50"
              }`}
              data-testid={`team-manage-member-${member.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    member.role === "leader" ? "bg-[#155dfc]" : "bg-gray-400"
                  }`}
                >
                  {member.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {member.name}
                    {member.isSelf && (
                      <span className="ml-1 text-xs font-normal text-[#64748b]">(나)</span>
                    )}
                  </p>
                  {member.studentId && (
                    <p className="text-xs text-gray-500">{member.studentId}</p>
                  )}
                </div>
                {member.role === "leader" && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#155dfc] px-2.5 py-0.5 text-xs font-bold text-white"
                    data-testid={`team-manage-leader-badge-${member.id}`}
                  >
                    <Crown className="h-3 w-3" />
                    팀장
                  </span>
                )}
              </div>

              {info.myRole === "leader" &&
                !info.isArchived &&
                !member.isSelf &&
                member.role !== "leader" && (
                  <button
                    type="button"
                    disabled={transferringTo !== null}
                    onClick={() => void handleTransferLeader(member.id, member.name)}
                    data-testid={`team-manage-transfer-${member.id}`}
                    className="shrink-0 rounded-lg border border-[#155dfc] bg-white px-3 py-2 text-xs font-bold text-[#155dfc] hover:bg-[#eff6ff] disabled:opacity-60"
                  >
                    {transferringTo === member.id ? "변경 중…" : "팀장으로 지정"}
                  </button>
                )}
            </li>
          ))}
        </ul>

        {info.myRole === "leader" && !info.isArchived && otherMembers.length === 0 && (
          <p className="mt-3 text-xs text-[#9ca3af]">
            다른 팀원이 없어 팀장을 넘길 수 없습니다. 팀원이 합류하면 여기서 지정할 수 있습니다.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:flex-wrap">
          <Link
            to={workspacePath}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            팀 워크스페이스
          </Link>
          {courseId && (
            <Link
              to={`/app/courses/${courseId}?tab=my-team-members`}
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              나의 팀 멤버
            </Link>
          )}
          {!info.isArchived && (
            <button
              type="button"
              onClick={() => void handleLeaveTeam()}
              disabled={leaving}
              data-testid="team-manage-leave"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600/90 hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {leaving ? "탈퇴 처리 중…" : "팀에서 탈퇴하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
