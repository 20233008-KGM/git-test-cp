import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";

function MyTeamSideNavGroup({
  courseId,
  courseTab,
  myTeamId,
  disabled,
}: {
  courseId: string | undefined;
  courseTab: string;
  myTeamId: string | null;
  disabled: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const teamsListPath = courseId ? `/app/courses/${courseId}/teams` : "/app/courses";
  const workspacePath =
    courseId && myTeamId ? `/app/courses/${courseId}/teams/${myTeamId}` : teamsListPath;
  const membersPath = courseId ? `/app/courses/${courseId}?tab=my-team-members` : "/app/courses";
  const managePath = courseId ? `/app/courses/${courseId}/my-team/manage` : "/app/courses";

  const isWorkspaceActive =
    Boolean(courseId && myTeamId) &&
    (location.pathname === `/app/courses/${courseId}/teams/${myTeamId}` ||
      location.pathname.startsWith(`/app/courses/${courseId}/teams/${myTeamId}/`));
  const isMembersActive =
    Boolean(courseId) &&
    location.pathname === `/app/courses/${courseId}` &&
    courseTab === "my-team-members";
  const isManageActive =
    Boolean(courseId) && location.pathname === `/app/courses/${courseId}/my-team/manage`;
  const isGroupActive = isWorkspaceActive || isMembersActive || isManageActive;

  const expanded = (open || isGroupActive) && !disabled;

  const rowActiveClass = isGroupActive
    ? "bg-[#155dfc] text-white shadow-sm"
    : disabled
      ? "cursor-not-allowed bg-gray-100 text-gray-400"
      : "bg-gray-50 text-gray-600 hover:bg-[#eff6ff] hover:text-[#155dfc]";

  const goToWorkspace = () => {
    if (disabled) return;
    navigate(workspacePath);
    setOpen(false);
  };

  return (
    <div
      className="flex w-full flex-col"
      onMouseEnter={() => !disabled && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-testid="course-detail-side-my-team-group"
    >
      <div
        className={`flex w-full overflow-hidden rounded-xl text-sm font-bold transition-colors duration-200 ${rowActiveClass}`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={goToWorkspace}
          data-testid="course-detail-side-my-team"
          aria-expanded={expanded}
          className="flex flex-1 items-center whitespace-nowrap px-4 py-3 text-left disabled:cursor-not-allowed"
        >
          내 팀
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          aria-label="내 팀 하위 메뉴 펼치기"
          data-testid="course-detail-side-my-team-toggle"
          className="flex items-center justify-center px-3 py-3 disabled:cursor-not-allowed"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!expanded}
      >
        <div
          className={`min-h-0 overflow-hidden transition-opacity duration-300 ease-in-out ${
            expanded ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div
            className="mt-1 flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
            data-testid="course-detail-side-my-team-submenu"
          >
            {myTeamId ? (
              <Link
                to={workspacePath}
                data-testid="course-detail-side-my-team-workspace"
                onClick={() => setOpen(false)}
                tabIndex={expanded ? 0 : -1}
                className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                  isWorkspaceActive
                    ? "bg-[#eff6ff] text-[#155dfc]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#155dfc]"
                }`}
              >
                워크스페이스
              </Link>
            ) : (
              <Link
                to={teamsListPath}
                data-testid="course-detail-side-my-team-workspace"
                onClick={() => setOpen(false)}
                tabIndex={expanded ? 0 : -1}
                className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-50"
              >
                팀 참여하기
              </Link>
            )}
            <Link
              to={membersPath}
              data-testid="course-detail-side-my-team-members"
              onClick={() => setOpen(false)}
              tabIndex={expanded ? 0 : -1}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                isMembersActive
                  ? "bg-[#eff6ff] text-[#155dfc]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#155dfc]"
              }`}
            >
              나의 팀 멤버
            </Link>
            <Link
              to={managePath}
              data-testid="course-detail-side-team-manage"
              onClick={() => setOpen(false)}
              tabIndex={expanded ? 0 : -1}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                isManageActive
                  ? "bg-[#eff6ff] text-[#155dfc]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#155dfc]"
              }`}
            >
              팀 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseSideNavigation() {
  const location = useLocation();
  const { user, isProfessor, isAdmin, isStudent } = useAuth();
  const courseMatch = location.pathname.match(/^\/app\/courses\/([^/]+)/);
  const courseId = courseMatch?.[1];
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [courseStatus, setCourseStatus] = useState<"active" | "archived" | null>(null);

  useEffect(() => {
    if (!courseId || !user?.id) {
      setMyTeamId(null);
      return;
    }

    let isCancelled = false;
    void api.teamCards.getAll(courseId).then((teams) => {
      if (isCancelled) return;
      const myTeam = teams.find((team) => team.members.some((member) => member.id === user.id));
      setMyTeamId(myTeam?.id ?? null);
    });

    return () => {
      isCancelled = true;
    };
  }, [courseId, user?.id]);

  useEffect(() => {
    if (!courseId) {
      setCourseStatus(null);
      return;
    }
    void api.courses.getById(courseId).then((course) => {
      setCourseStatus(course?.status ?? null);
    });
  }, [courseId]);

  const courseTab = new URLSearchParams(location.search).get("tab") ?? "overview";
  const myTeamPeerReviewPath = useMemo(() => {
    if (!courseId || !myTeamId) return "";
    return `/app/courses/${courseId}/teams/${myTeamId}/peer-review`;
  }, [courseId, myTeamId]);

  const sideNavItems = [
    {
      key: "overview",
      label: "강의개요",
      path: courseId ? `/app/courses/${courseId}?tab=overview` : "/app/courses",
      active: Boolean(courseId) && location.pathname === `/app/courses/${courseId}` && courseTab === "overview",
      disabled: !courseId,
      testId: "course-detail-side-overview",
    },
    {
      key: "students",
      label: "수강자들",
      path: courseId ? `/app/courses/${courseId}/students` : "/app/students",
      active: location.pathname.startsWith(courseId ? `/app/courses/${courseId}/students` : "/app/students"),
      disabled: !courseId,
      testId: "course-detail-side-students",
    },
    {
      key: "teams",
      label: "팀",
      path: courseId ? `/app/courses/${courseId}/teams` : "/app/teams",
      active: location.pathname.startsWith(courseId ? `/app/courses/${courseId}/teams` : "/app/teams"),
      disabled: !courseId,
      testId: "course-detail-side-teams",
    },
    ...(isProfessor || isAdmin
      ? [
          {
            key: "announcements",
            label: "공지게시판",
            path: courseId ? `/app/courses/${courseId}/announcements` : "/app/courses",
            active: Boolean(courseId) && location.pathname === `/app/courses/${courseId}/announcements`,
            disabled: !courseId,
            testId: "course-detail-side-announcements",
          },
          {
            key: "peer-reviews-overview",
            label: "동료평가 조회",
            path: courseId ? `/app/courses/${courseId}/peer-reviews` : "/app/courses",
            active: Boolean(courseId) && location.pathname === `/app/courses/${courseId}/peer-reviews`,
            disabled: !courseId,
            testId: "course-detail-side-peer-reviews-overview",
          },
        ]
      : []),
    ...(courseStatus === "archived" && courseId
      ? [
          {
            key: "my-peer-reviews",
            label: "내 조원평가",
            path: `/app/courses/${courseId}/evals/my-peer-reviews`,
            active: location.pathname === `/app/courses/${courseId}/evals/my-peer-reviews`,
            disabled: false,
            testId: "course-detail-side-my-peer-reviews",
          },
          {
            key: "professor-evals",
            label: "교수 평가",
            path: `/app/courses/${courseId}/evals/professor`,
            active: location.pathname === `/app/courses/${courseId}/evals/professor`,
            disabled: false,
            testId: "course-detail-side-professor-evals",
          },
        ]
      : [
          {
            key: "peer-review",
            label: "조원평가",
            path: myTeamPeerReviewPath,
            active: Boolean(myTeamPeerReviewPath) && location.pathname.startsWith(myTeamPeerReviewPath),
            disabled: !myTeamPeerReviewPath,
            testId: "course-detail-side-peer-review",
          },
        ]),
  ] as const;

  return (
    <aside className="w-full lg:w-[220px] lg:shrink-0">
      <div className="rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:sticky lg:top-24 lg:p-4">
        <p className="mb-3 px-1 text-sm font-black text-gray-500">수업 메뉴</p>
        <nav className="flex flex-col gap-2">
          {sideNavItems.map((item) => {
            if (item.key === "overview") {
              return (
                <React.Fragment key="nav-block-start">
                  <Link
                    key={item.key}
                    to={item.path || "#"}
                    data-testid={item.testId}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                    }}
                    className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      item.active
                        ? "bg-[#155dfc] text-white shadow-sm"
                        : item.disabled
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-gray-50 text-gray-600 hover:bg-[#eff6ff] hover:text-[#155dfc]"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {isStudent && (
                    <MyTeamSideNavGroup
                      courseId={courseId}
                      courseTab={courseTab}
                      myTeamId={myTeamId}
                      disabled={!courseId}
                    />
                  )}
                </React.Fragment>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.path || "#"}
                data-testid={item.testId}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                }}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  item.active
                    ? "bg-[#155dfc] text-white shadow-sm"
                    : item.disabled
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-gray-50 text-gray-600 hover:bg-[#eff6ff] hover:text-[#155dfc]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const showCourseSideNavigation =
    /^\/app\/courses\/[^/]+/.test(location.pathname) ||
    location.pathname.startsWith("/app/students") ||
    location.pathname.startsWith("/app/teams");
  const isCourseTeamsListPage = /^\/app\/courses\/[^/]+\/teams\/?$/.test(location.pathname);
  const courseContentMaxWidth = isCourseTeamsListPage
    ? "max-w-[min(100%,1920px)]"
    : "max-w-7xl";

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 w-full">
        {showCourseSideNavigation ? (
          <div
            className={`mx-auto flex w-full ${courseContentMaxWidth} flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-6 lg:flex-row lg:px-8`}
          >
            <CourseSideNavigation />
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
}
