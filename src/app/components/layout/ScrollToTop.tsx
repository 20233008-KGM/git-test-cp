import { useEffect } from "react";
import { useLocation } from "react-router";

/** vision #64 — 페이지 전환 시 스크롤을 맨 위로 (사이드 네비는 동일 레이아웃 내 탭 전환) */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, search, hash]);

  return null;
}
