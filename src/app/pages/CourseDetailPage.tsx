import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { Course, TeamMember } from "../types";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [myTeamMembers, setMyTeamMembers] = useState<TeamMember[]>([]);
  const { isProfessor, isAdmin, user } = useAuth();
  const canArchiveCourse = Boolean(
    course && course.status === "active" && (isAdmin || (isProfessor && course.professorId === user?.id))
  );

  useEffect(() => {
    if (!id) return;

    void Promise.all([api.courses.getById(id), api.teamCards.getAll(id)]).then(([courseData, teamCards]) => {
      setCourse(courseData || null);
      const myTeam = teamCards.find((team) => team.members.some((member) => member.id === user?.id));
      setMyTeamId(myTeam?.id ?? null);
      setMyTeamMembers(myTeam?.members ?? []);
      setLoading(false);
    });
  }, [id, user?.id]);

  const myTeamPeerReviewPath = useMemo(() => {
    if (!id || !myTeamId) return null;
    return `/app/courses/${id}/teams/${myTeamId}/peer-review`;
  }, [id, myTeamId]);

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "my-team-members") return "my-team-members";
    if (tab === "students") return "students";
    if (tab === "teams") return "teams";
    return "overview";
  }, [searchParams]);

  const handleArchiveCourse = async () => {
    if (!course || !window.confirm(`'${course.name}' 수업을 종료하고 아카이브로 전환할까요?`)) return;

    setArchiving(true);
    setErrorMessage("");

    try {
      const archivedCourse = await api.courses.archive(course.id);
      setCourse(archivedCourse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "수업을 종료하지 못했습니다.");
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">{"\uB85C\uB529 \uC911..."}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">{"\uACFC\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
        <Link to="/app/courses" className="text-blue-600 hover:underline mt-4 inline-block">
          {"\uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">{course.name}</h1>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                {course.code}
              </span>
            </div>
            <p className="text-gray-600">{course.semester}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canArchiveCourse && (
              <button
                type="button"
                disabled={archiving}
                onClick={handleArchiveCourse}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {archiving ? "종료 중..." : "수업 종료"}
              </button>
            )}
            <Link to="/app/courses" className="px-3 py-2 text-sm text-blue-600 hover:underline">
              {"\uBAA9\uB85D\uC73C\uB85C"}
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {course.status === "archived" && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
            종료된 수업입니다. 교수자와 학생 모두 읽기 전용으로 조회할 수 있습니다.
          </div>
        )}

        {course.description && (
          <p className="text-gray-700 mb-4">{course.description}</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{"\uB2F4\uB2F9 \uAD50\uC218"}</p>
            <p className="font-bold text-gray-900">{course.professor}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{"\uAC15\uC758 \uC2DC\uAC04"}</p>
            <p className="font-bold text-gray-900">{course.schedule}</p>
          </div>
          {course.room && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{"\uAC15\uC758\uC2E4"}</p>
              <p className="font-bold text-gray-900">{course.room}</p>
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{"\uC218\uAC15 \uC778\uC6D0"}</p>
            <p className="font-bold text-gray-900">
              {course.students}
              {course.maxStudents && `/${course.maxStudents}`}{"\uBA85"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-xl font-bold mb-4">{"\uAC15\uC758 \uAC1C\uC694"}</h2>
              <p className="text-gray-700">
                {course.description || "\uAC15\uC758 \uAC1C\uC694\uAC00 \uC544\uC9C1 \uB4F1\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."}
              </p>
              {course.stages && course.stages.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-bold text-gray-900">팀플 스테이지</h3>
                  <ol className="space-y-2">
                    {course.stages.map((stage) => (
                      <li key={stage.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {stage.position}. {stage.name}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                {"\uC218\uAC15\uC0DD \uBAA9\uB85D"} ({course.students}{"\uBA85"})
              </h2>
              <p className="text-gray-600">{"\uC88C\uCE21 \uB124\uBE44\uAC8C\uC774\uC158\uC758 \uC218\uAC15\uC790\uB4E4 \uBA54\uB274\uC5D0\uC11C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}</p>
            </div>
          )}

          {activeTab === "teams" && (
            <div>
              <h2 className="text-xl font-bold mb-4">{"\uD300 \uBAA9\uB85D"}</h2>
              <p className="text-gray-600">{"\uC88C\uCE21 \uB124\uBE44\uAC8C\uC774\uC158\uC758 \uD300 \uBA54\uB274\uC5D0\uC11C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}</p>
            </div>
          )}

          {activeTab === "my-team-members" && (
            <div>
              <h2 className="text-xl font-bold mb-4" data-testid="course-detail-my-team-members-title">
                나의 팀 멤버
              </h2>
              {myTeamMembers.length === 0 ? (
                <p className="text-sm text-gray-600">
                  현재 배정된 팀이 없거나 팀 멤버 정보를 찾을 수 없습니다.
                </p>
              ) : (
                <div className="space-y-2" data-testid="course-detail-my-team-members-list">
                  {myTeamMembers.map((member) => (
                    <div key={member.id} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                      <span className="font-semibold text-gray-900">{member.name ?? "이름 없음"}</span>
                      {member.studentId && <span className="ml-2 text-gray-500">({member.studentId})</span>}
                      {member.role && <span className="ml-2 text-blue-700">[{member.role}]</span>}
                    </div>
                  ))}
                </div>
              )}
              {myTeamPeerReviewPath && (
                <Link
                  to={myTeamPeerReviewPath}
                  className="mt-4 inline-block rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  조원평가 페이지로 이동
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
