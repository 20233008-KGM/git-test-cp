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
import TeamDetailPage from "./pages/TeamDetailPage";
import TeamPeerReviewPage from "./pages/TeamPeerReviewPage";
import TeamRetrospectivePage from "./pages/TeamRetrospectivePage";
import MyPage from "./pages/MyPage";
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
            path: "courses/:courseId/teams",
            Component: TeamsPage,
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
            Component: RandomTeamPage,
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
