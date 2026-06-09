import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Home,
  Megaphone,
  MessageCircle,
  Star,
  Users,
  UsersRound,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import AppSideNav from "../components/layout/AppSideNav";
import SideNavItem from "../components/layout/SideNavItem";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import SkipLink from "../components/SkipLink";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import ScrollToTop from "../components/layout/ScrollToTop";
import { getAppShellClassName } from "./appShell";

function courseNavIcon(key: string) {
  switch (key) {
    case "overview":
      return BookOpen;
    case "students":
      return Users;
    case "messages":
      return MessageCircle;
    case "teams":
      return UsersRound;
    case "announcements":
      return Megaphone;
    case "peer-reviews-overview":
      return ClipboardList;
    case "peer-review":
    case "my-peer-reviews":
      return Star;
    case "professor-evals":
      return GraduationCap;
    default:
      return undefined;
  }
}

function MyTeamSideNavGroup({
  courseId,
  courseTab,
  myTeamId,
  disabled,
  showMembersLink = true,
  showTeamManage = true,
}: {
  courseId: string | undefined;
  courseTab: string;
  myTeamId: string | null;
  disabled: boolean;
  showMembersLink?: boolean;
  showTeamManage?: boolean;
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
    ? "m3-nav-item--active"
    : disabled
      ? "cursor-not-allowed opacity-40"
      : "";

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
        className={`m3-nav-item m3-nav-item--split w-full transition-colors duration-200 ${rowActiveClass}`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={goToWorkspace}
          data-testid="course-detail-side-my-team"
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left disabled:cursor-not-allowed"
        >
          <span className="m3-nav-item__icon shrink-0" aria-hidden>
            <Home className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="m3-nav-item__label truncate">내 팀</span>
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
          className="flex shrink-0 items-center justify-center self-stretch border-l border-transparent px-2.5 py-3 disabled:cursor-not-allowed [.m3-nav-item--active_&]:border-[var(--cc-primary-border)]"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
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
            className="mt-1 flex flex-col gap-1 rounded-[var(--m3-shape-large)] border border-[var(--cc-outline-variant)] bg-[var(--cc-surface-container)] p-1"
            data-testid="course-detail-side-my-team-submenu"
          >
            {myTeamId ? (
              <SideNavItem
                to={workspacePath}
                data-testid="course-detail-side-my-team-workspace"
                onClick={() => setOpen(false)}
                tabIndex={expanded ? 0 : -1}
                active={isWorkspaceActive}
                sub
              >
                워크스페이스
              </SideNavItem>
            ) : (
              <SideNavItem
                to={teamsListPath}
                data-testid="course-detail-side-my-team-workspace"
                onClick={() => setOpen(false)}
                tabIndex={expanded ? 0 : -1}
                attention
                sub
              >
                팀 참여하기
              </SideNavItem>
            )}
            {showMembersLink && (
              <SideNavItem
                to={membersPath}
                data-testid="course-detail-side-my-team-members"
                onClick={() => setOpen(false)}
                tabIndex={expanded ? 0 : -1}
                active={isMembersActive}
                sub
              >
                나의 팀 멤버
              </SideNavItem>
            )}
            {showTeamManage && (
              <SideNavItem
                to={managePath}
                data-testid="course-detail-side-team-manage"
                onClick={() => setOpen(false)}
                tabIndex={expanded ? 0 : -1}
                active={isManageActive}
                sub
              >
                팀 관리
              </SideNavItem>
            )}
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
      key: "messages",
      label: "챗리스트",
      path: courseId ? `/app/courses/${courseId}/messages` : "/app/courses",
      active: Boolean(courseId) && location.pathname === `/app/courses/${courseId}/messages`,
      disabled: !courseId,
      testId: "course-detail-side-messages",
    },
    {
      key: "teams",
      label: "팀",
      path: courseId ? `/app/courses/${courseId}/teams` : "/app/teams",
      active: (() => {
        const base = courseId ? `/app/courses/${courseId}/teams` : "/app/teams";
        if (location.pathname === base || location.pathname === `${base}/random`) return true;
        if (!courseId || !myTeamId) return false;
        const myTeamPrefix = `/app/courses/${courseId}/teams/${myTeamId}`;
        if (location.pathname === myTeamPrefix || location.pathname.startsWith(`${myTeamPrefix}/`)) {
          return false;
        }
        return location.pathname.startsWith(`${base}/`);
      })(),
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
    ...(courseStatus === "archived" && courseId && isStudent
      ? [
          ...(myTeamPeerReviewPath
            ? [
                {
                  key: "peer-review",
                  label: "조원평가 작성",
                  path: myTeamPeerReviewPath,
                  active:
                    Boolean(myTeamPeerReviewPath) &&
                    location.pathname.startsWith(myTeamPeerReviewPath),
                  disabled: false,
                  testId: "course-detail-side-peer-review-archived",
                },
              ]
            : []),
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
      : []),
    ...(courseStatus !== "archived" && isStudent && myTeamPeerReviewPath
      ? [
          {
            key: "peer-review",
            label: "조원평가",
            path: myTeamPeerReviewPath,
            active:
              Boolean(myTeamPeerReviewPath) &&
              location.pathname.startsWith(myTeamPeerReviewPath),
            disabled: false,
            testId: "course-detail-side-peer-review",
          },
        ]
      : []),
  ] as const;

  return (
    <AppSideNav label="수업 메뉴" labelId="course-side-nav-label">
          {sideNavItems.map((item) => {
            if (item.key === "overview") {
              return (
                <React.Fragment key="nav-block-start">
                  <SideNavItem
                    key={item.key}
                    to={item.path || "#"}
                    data-testid={item.testId}
                    active={item.active}
                    disabled={item.disabled}
                    icon={courseNavIcon(item.key)}
                  >
                    {item.label}
                  </SideNavItem>
                  {isStudent && (
                    <MyTeamSideNavGroup
                      courseId={courseId}
                      courseTab={courseTab}
                      myTeamId={myTeamId}
                      disabled={!courseId}
                      showMembersLink
                      showTeamManage
                    />
                  )}
                </React.Fragment>
              );
            }

            return (
              <SideNavItem
                key={item.key}
                to={item.path || "#"}
                data-testid={item.testId}
                active={item.active}
                disabled={item.disabled}
                icon={courseNavIcon(item.key)}
              >
                {item.label}
              </SideNavItem>
            );
          })}
    </AppSideNav>
  );
}

export default function MainLayout() {
  useDocumentTitle();
  const location = useLocation();
  const showCourseSideNavigation =
    /^\/app\/courses\/[^/]+/.test(location.pathname) ||
    location.pathname.startsWith("/app/students") ||
    location.pathname.startsWith("/app/teams");
  const appShellClass = getAppShellClassName(location.pathname);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[var(--cc-surface-container)]">
      <ScrollToTop />
      <SkipLink />
      <Navigation />
      <main
        id="main-content"
        className="cc-main-viewport flex w-full flex-1 flex-col bg-[var(--cc-surface-container)]"
        tabIndex={-1}
      >
        {showCourseSideNavigation ? (
          <div
            className={`flex w-full min-w-0 flex-col gap-4 overflow-x-clip py-4 sm:gap-6 sm:py-6 lg:flex-row lg:items-start ${appShellClass}`}
          >
            <CourseSideNavigation />
            <div className="cc-page-main cc-page-main--with-side-nav min-w-0 overflow-x-clip">
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
