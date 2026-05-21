import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import type { Team, TeamMember } from "../types";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";

export default function RandomTeamPage() {
  const navigate = useNavigate();
  const { courseId: courseIdFromRoute } = useParams<{ courseId?: string }>();
  const { isProfessor, isAdmin } = useAuth();
  const canManage = isProfessor || isAdmin;

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamSize, setTeamSize] = useState(4);
  const [students, setStudents] = useState<TeamMember[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;

    async function load() {
      setLoadingStudents(true);
      try {
        const resolvedId =
          courseIdFromRoute?.trim() || (await api.navigation.getPrimaryCourseId()) || "";

        if (!resolvedId || cancelled) {
          setStudents([]);
          setCourseId("");
          return;
        }

        setCourseId(resolvedId);
        const [data, assignedIds] = await Promise.all([
          api.students.getAll(resolvedId),
          api.teams.getAssignedStudentIds(resolvedId),
        ]);
        if (cancelled) return;

        const assigned = new Set(assignedIds);
        const members: TeamMember[] = data
          .filter((s) => !assigned.has(s.id))
          .map((s) => ({
            id: s.id,
            name: s.name,
            studentId: s.studentId,
          }));
        setStudents(members);
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [courseIdFromRoute, canManage]);

  const generateRandomTeams = () => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const newTeams: Team[] = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
      newTeams.push({
        id: `preview-${newTeams.length + 1}`,
        name: `팀 ${newTeams.length + 1}`,
        members: shuffled.slice(i, i + teamSize),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setTeams(newTeams);
  };

  if (!canManage) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          랜덤 팀 생성은 교수만 사용할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-black text-gray-900 sm:text-3xl">랜덤 팀 생성</h1>

      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="font-medium text-gray-700">팀당 인원:</label>
          <input
            type="number"
            min="2"
            max="10"
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            className="w-20 rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="button"
            disabled={loadingStudents || students.length === 0}
            onClick={generateRandomTeams}
            className="w-full rounded bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
          >
            팀 미리보기
          </button>
          <button
            type="button"
            data-testid="random-team-save"
            disabled={saving || teams.length === 0 || !courseId}
            onClick={async () => {
              if (!courseId || teams.length === 0) return;
              setSaving(true);
              try {
                const result = await api.teams.saveRandomAssignment(
                  courseId,
                  teams.map((team) => team.members.map((member) => member.id))
                );
                alert(`${result.teamCount}개 팀, ${result.memberCount}명을 저장했습니다.`);
                navigate(`/app/courses/${courseId}/teams`);
              } catch (error) {
                console.error(error);
                alert(error instanceof Error ? error.message : "팀 저장에 실패했습니다.");
              } finally {
                setSaving(false);
              }
            }}
            className="w-full rounded border border-[#155dfc] bg-white px-6 py-2 font-medium text-[#155dfc] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "저장 중…" : "Supabase에 저장"}
          </button>
        </div>
        {!loadingStudents && students.length === 0 && (
          <p className="text-sm text-gray-600">
            배정 가능한 수강생이 없습니다. 이미 모든 학생이 팀에 속했거나 수업에 학생이 없습니다.
          </p>
        )}
        {loadingStudents && <p className="text-sm text-gray-500">수강생 목록을 불러오는 중…</p>}
      </div>

      {teams.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {teams.map((team) => (
            <div key={team.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">{team.name}</h2>
              <ul className="space-y-2">
                {team.members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 text-gray-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {(member.name ?? "").charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{member.name ?? ""}</div>
                      <div className="text-sm text-gray-500">{member.studentId}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
