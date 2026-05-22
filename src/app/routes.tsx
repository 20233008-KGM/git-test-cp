import { createBrowserRouter } from "react-router";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { CourseScopedRedirect } from "./components/CourseScopedRedirect";
import LandingPage from "./pages/LandingPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import ProfessorProfilePage from "./pages/ProfessorProfilePage";
import RandomTeamPage from "./pages/RandomTeamPage";
import OtherStudentProfilePage from "./pages/OtherStudentProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import QnAPage from "./pages/QnAPage";
import QnADetailPage from "./pages/QnADetailPage";
import TeamsPage from "./pages/TeamsPage";
import CourseAnnouncementsPage from "./pages/CourseAnnouncementsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TeamPeerReviewPage from "./pages/TeamPeerReviewPage";
import TeamRetrospectivePage from "./pages/TeamRetrospectivePage";
import CoursePeerReviewsOverviewPage from "./pages/CoursePeerReviewsOverviewPage";
import CourseTeamManagePage from "./pages/CourseTeamManagePage";
import CourseMyPeerReviewsGivenPage from "./pages/CourseMyPeerReviewsGivenPage";
import CourseProfessorEvalsPage from "./pages/CourseProfessorEvalsPage";
import MyPage from "./pages/MyPage";
import MyPageProfilePage from "./pages/MyPageProfilePage";
import MyPageArchivedCoursesPage from "./pages/MyPageArchivedCoursesPage";
import NotFoundPage from "./pages/NotFoundPage";
import StudentsNetworkPage from "./pages/StudentsNetworkPage";
import SignInPage from "./pages/SignInPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/signin",
    Component: SignInPage,
  },
  {
    path: "/app",
    Component: ProtectedRoute,
    children: [
      {
        Component: MainLayout,
        children: [
          {
            path: "courses",
            Component: CoursesPage,
          },
          {
            path: "courses/:id",
            Component: CourseDetailPage,
          },
          {
            path: "courses/:courseId/students",
            Component: StudentsNetworkPage,
          },
          {
            path: "courses/:courseId/my-team/manage",
            Component: CourseTeamManagePage,
          },
          {
            path: "courses/:courseId/teams",
            Component: TeamsPage,
          },
          {
            path: "courses/:courseId/announcements",
            Component: CourseAnnouncementsPage,
          },
          {
            path: "courses/:courseId/peer-reviews",
            Component: CoursePeerReviewsOverviewPage,
          },
          {
            path: "courses/:courseId/evals/my-peer-reviews",
            Component: CourseMyPeerReviewsGivenPage,
          },
          {
            path: "courses/:courseId/evals/professor",
            Component: CourseProfessorEvalsPage,
          },
          {
            path: "courses/:courseId/teams/random",
            Component: RandomTeamPage,
          },
          {
            path: "courses/:courseId/teams/:teamId",
            Component: TeamDetailPage,
          },
          {
            path: "courses/:courseId/teams/:teamId/peer-review",
            Component: TeamPeerReviewPage,
          },
          {
            path: "courses/:courseId/teams/:teamId/retrospective",
            Component: TeamRetrospectivePage,
          },
          {
            path: "profile",
            Component: StudentProfilePage,
          },
          {
            path: "profile/professor",
            Component: ProfessorProfilePage,
          },
          {
            path: "teams/random",
            element: <CourseScopedRedirect target="random-teams" />,
          },
          {
            path: "students/:id",
            Component: OtherStudentProfilePage,
          },
          {
            path: "projects",
            Component: ProjectsPage,
          },
          {
            path: "qna",
            Component: QnAPage,
          },
          {
            path: "qna/:questionId",
            Component: QnADetailPage,
          },
          {
            path: "teams",
            element: <CourseScopedRedirect target="teams" />,
          },
          {
            path: "teams/:id",
            element: <CourseScopedRedirect target="team-detail" />,
          },
          {
            path: "mypage",
            Component: MyPage,
          },
          {
            path: "mypage/profile",
            Component: MyPageProfilePage,
          },
          {
            path: "mypage/archived-courses",
            Component: MyPageArchivedCoursesPage,
          },
          {
            path: "students",
            element: <CourseScopedRedirect target="students" />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
