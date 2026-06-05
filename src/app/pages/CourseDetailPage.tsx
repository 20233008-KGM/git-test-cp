import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api } from "../api/supabase-api";
import StudentQuickProfileModal from "../components/StudentQuickProfileModal";
import PageHeader from "../components/layout/PageHeader";
import PageLoading from "../components/layout/PageLoading";
import { useAuth } from "../contexts/AuthContext";
import { formatCoursePeriod } from "../utils/courseDates";
import type { Course, CourseMaterial, StudentProfile, TeamMember } from "../types";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [myTeamMembers, setMyTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<StudentProfile | null>(null);
  const [memberProfileLoading, setMemberProfileLoading] = useState(false);
  const [memberProfileError, setMemberProfileError] = useState<string | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const { isProfessor, isAdmin, isStudent, user } = useAuth();
  const canManageMaterials = isProfessor || isAdmin;

  const openMemberProfile = async (memberId: string) => {
    if (memberId === user?.id) return;
    setMemberProfileLoading(true);
    setMemberProfileError(null);
    setSelectedMemberProfile(null);
    try {
      const profile = await api.students.getById(memberId);
      if (!profile) {
        setMemberProfileError("프로필을 불러오지 못했습니다.");
        return;
      }
      setSelectedMemberProfile(profile);
    } catch (error) {
      console.error(error);
      setMemberProfileError(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다."
      );
    } finally {
      setMemberProfileLoading(false);
    }
  };

  const closeMemberProfile = () => {
    setSelectedMemberProfile(null);
    setMemberProfileError(null);
    setMemberProfileLoading(false);
  };
  const canArchiveCourse = Boolean(
    course && course.status === "active" && (isAdmin || (isProfessor && course.professorId === user?.id))
  );

  const loadCourseDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [courseData, teamCards, materials] = await Promise.all([
        api.courses.getById(id),
        api.teamCards.getAll(id),
        api.courses.listMaterials(id),
      ]);
      setCourse(courseData || null);
      const myTeam = teamCards.find((team) => team.members.some((member) => member.id === user?.id));
      setMyTeamId(myTeam?.id ?? null);
      setMyTeamMembers(myTeam?.members ?? []);
      setCourseMaterials(materials);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    void loadCourseDetail();
  }, [loadCourseDetail]);

  const handleUploadCourseMaterial = async (file: File) => {
    if (!id || !file) return;
    setUploadingMaterial(true);
    try {
      const created = await api.courses.uploadMaterial(id, file);
      setCourseMaterials((prev) => [created, ...prev]);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "강의 자료 업로드에 실패했습니다.");
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteCourseMaterial = async (materialId: string) => {
    if (!window.confirm("이 강의 자료를 삭제할까요?")) return;
    try {
      await api.courses.deleteMaterial(materialId);
      setCourseMaterials((prev) => prev.filter((item) => item.id !== materialId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  };

  const myTeamPeerReviewPath = useMemo(() => {
    if (!id || !myTeamId) return null;
    return `/app/courses/${id}/teams/${myTeamId}/peer-review`;
  }, [id, myTeamId]);

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "my-team-members" && isStudent) return "my-team-members";
    if (tab === "students") return "students";
    if (tab === "teams") return "teams";
    return "overview";
  }, [searchParams, isStudent]);

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
    return <PageLoading message="수업 정보를 불러오는 중…" testId="course-detail-loading" />;
  }

  if (!course) {
    return (
      <div className="cc-page-main w-full py-4">
        <p className="text-gray-600">{"\uACFC\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
        <Link to="/app/courses" className="cc-link mt-4 inline-block">
          {"\uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30"}
        </Link>
      </div>
    );
  }

  return (
    <div className="cc-page-main w-full">
      <PageHeader
        title={course.name}
        subtitle={course.semester}
        titleTestId="course-detail-title"
        meta={
          <span className="cc-course-code cc-course-code--badge mt-1 inline-flex">
            {course.code}
          </span>
        }
        actions={
          <>
            {canArchiveCourse && (
              <button
                type="button"
                disabled={archiving}
                onClick={handleArchiveCourse}
                data-testid="course-archive-button"
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {archiving ? "종료 중..." : "수업 종료"}
              </button>
            )}
            <Link to="/app/courses" className="cc-link px-3 py-2 text-sm">
              {"\uBAA9\uB85D\uC73C\uB85C"}
            </Link>
          </>
        }
      />

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">

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
          {formatCoursePeriod(course.startDate, course.endDate) ? (
            <div className="bg-gray-50 p-4 rounded-lg" data-testid="course-detail-period">
              <p className="text-sm text-gray-600 mb-1">수업 기간</p>
              <p className="font-bold text-gray-900">
                {formatCoursePeriod(course.startDate, course.endDate)}
              </p>
            </div>
          ) : null}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">강의 시간</p>
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
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">팀플 스테이지</h3>
                  {canManageMaterials && course.status === "active" && id && (
                    <Link
                      to={`/app/courses/${id}/stages/edit`}
                      className="text-sm font-bold text-[#155dfc] hover:underline"
                      data-testid="course-stages-edit-link"
                    >
                      스테이지 수정
                    </Link>
                  )}
                </div>
                {course.stages && course.stages.length > 0 ? (
                  <ol className="space-y-2">
                    {course.stages.map((stage) => (
                      <li
                        key={stage.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        {stage.position}. {stage.name}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">등록된 스테이지가 없습니다.</p>
                )}
              </div>

              <div className="mt-8" data-testid="course-materials-section">
                <h3 className="mb-3 font-bold text-gray-900">강의계획서 · 강의 자료</h3>
                {courseMaterials.length === 0 ? (
                  <p className="text-sm text-gray-500">등록된 자료가 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {courseMaterials.map((material) => (
                      <li
                        key={material.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{material.title}</p>
                          <p className="text-xs text-gray-500">
                            {material.fileName} · {material.uploaderName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={material.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            다운로드
                          </a>
                          {canManageMaterials && course.status !== "archived" && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteCourseMaterial(material.id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {canManageMaterials && course.status !== "archived" && (
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.hwp,.hwpx"
                      disabled={uploadingMaterial}
                      data-testid="course-material-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadCourseMaterial(file);
                        e.target.value = "";
                      }}
                    />
                    {uploadingMaterial ? "업로드 중…" : "+ 강의 자료 업로드"}
                  </label>
                )}
              </div>
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

          {activeTab === "my-team-members" && isStudent && (
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
                    <button
                      key={member.id}
                      type="button"
                      data-testid={`course-detail-my-team-member-${member.id}`}
                      onClick={() => void openMemberProfile(member.id)}
                      disabled={member.id === user?.id}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm transition-colors hover:border-[#155dfc] hover:bg-[#eff6ff] disabled:cursor-default disabled:opacity-80"
                    >
                      <span className="font-semibold text-gray-900">{member.name ?? "이름 없음"}</span>
                      {member.studentId && <span className="ml-2 text-gray-500">({member.studentId})</span>}
                      {member.role === "leader" && (
                        <span className="ml-2 inline-flex rounded-full bg-[#155dfc] px-2 py-0.5 text-xs font-bold text-white">
                          팀장
                        </span>
                      )}
                      {member.id === user?.id && (
                        <span className="ml-2 text-xs text-[#64748b]">(나)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {id && (
                <Link
                  to={`/app/courses/${id}/my-team/manage`}
                  className="mt-4 inline-block rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  data-testid="course-detail-team-manage-link"
                >
                  팀 관리 (스테이지 · 팀장 · 탈퇴)
                </Link>
              )}
              {myTeamPeerReviewPath && (
                <Link
                  to={myTeamPeerReviewPath}
                  className="mt-4 ml-0 inline-block rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:ml-3"
                >
                  조원평가 페이지로 이동
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <StudentQuickProfileModal
        profile={selectedMemberProfile}
        loading={memberProfileLoading}
        errorMessage={memberProfileError}
        onClose={closeMemberProfile}
      />
    </div>
  );
}
