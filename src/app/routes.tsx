import { createBrowserRouter } from "react-router";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import ProfessorProfilePage from "./pages/ProfessorProfilePage";
import RandomTeamPage from "./pages/RandomTeamPage";
import OtherStudentProfilePage from "./pages/OtherStudentProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import QnAPage from "./pages/QnAPage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
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
        path: "teams",
        Component: TeamsPage,
      },
      {
        path: "teams/:id",
        Component: TeamDetailPage,
      },
      {
        path: "mypage",
        Component: MyPage,
      },
      {
        path: "students",
        Component: StudentsNetworkPage,
      },
    ],
  },

  {
    path: "*",
    Component: NotFoundPage,
  },
]);