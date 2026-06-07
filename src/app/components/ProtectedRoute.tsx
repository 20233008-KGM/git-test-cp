import { Outlet, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. 로딩 상태 처리
  if (isLoading) return null;

  // 2. 인증되지 않았다면 window.location으로 강제 이동
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = "/";
    }
    return null; // 이동하는 동안 아무것도 렌더링하지 않음
  }

  // 3. 정상 접속
  return <Outlet />;
}