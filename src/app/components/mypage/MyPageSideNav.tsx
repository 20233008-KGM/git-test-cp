import { Archive, FileText, User } from "lucide-react";
import { useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import AppSideNav from "../layout/AppSideNav";
import SideNavItem from "../layout/SideNavItem";

export default function MyPageSideNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const isProfessor = user?.role === "professor" || user?.role === "admin";
  const isReport = pathname === "/app/mypage";
  const isProfile = pathname === "/app/mypage/profile";
  const isArchived = pathname === "/app/mypage/archived-courses";

  return (
    <AppSideNav
      label="마이페이지 메뉴"
      labelId="mypage-side-nav-label"
      footer={
        isStudent ? (
          <SideNavItem
            to="/app/mypage/archived-courses"
            icon={Archive}
            active={isArchived}
            data-testid="mypage-archived-courses-nav"
          >
            과거 수업
          </SideNavItem>
        ) : undefined
      }
    >
      <SideNavItem to="/app/mypage" icon={FileText} active={isReport}>
        리포트
      </SideNavItem>
      {isStudent ? (
        <SideNavItem
          to="/app/mypage/profile"
          icon={User}
          active={isProfile}
          data-testid="mypage-profile-nav"
        >
          내 정보
        </SideNavItem>
      ) : null}
      {isProfessor ? (
        <SideNavItem
          to="/app/profile/professor"
          icon={User}
          active={pathname === "/app/profile/professor"}
          data-testid="mypage-professor-profile-nav"
        >
          내 정보
        </SideNavItem>
      ) : null}
    </AppSideNav>
  );
}
