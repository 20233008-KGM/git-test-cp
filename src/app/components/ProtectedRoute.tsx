import { Navigate, Outlet, useLocation } from "react-router"; // react-router-dom을 react-router로 변경!
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. 로딩 중일 때는 빈 화면을 보여줘서 테스트 봇이 꼬이지 않게 합니다.
  if (isLoading) {
    return null;
  }

  // 2. 로그인이 안 되어 있다면 로그인 페이지('/')로 보냅니다.
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // 3. 로그인된 상태라면 정상적으로 화면을 보여줍니다.
  return <Outlet />;
}