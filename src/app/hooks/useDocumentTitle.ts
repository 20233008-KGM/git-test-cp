import { useEffect } from "react";
import { useLocation } from "react-router";

const BASE = "CampusConnect";

const TITLE_BY_PATH: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (p) => p === "/", title: "로그인" },
  { match: (p) => p === "/signin", title: "회원가입" },
  { match: (p) => p === "/app/courses", title: "수업 목록" },
  { match: (p) => p === "/app/mypage/profile", title: "내 정보" },
  { match: (p) => p.startsWith("/app/mypage"), title: "마이페이지" },
  { match: (p) => p.includes("/teams/") && !p.endsWith("/teams"), title: "팀 워크스페이스" },
  { match: (p) => p.endsWith("/teams"), title: "팀 목록" },
  { match: (p) => p.includes("/students"), title: "수강생 네트워크" },
  { match: (p) => p.includes("/announcements"), title: "공지사항" },
  { match: (p) => p.includes("/peer-reviews"), title: "동료평가" },
  { match: (p) => p.includes("/my-team/manage"), title: "팀 관리" },
  { match: (p) => p.startsWith("/app/courses/"), title: "수업" },
];

function resolvePageTitle(pathname: string): string {
  for (const { match, title } of TITLE_BY_PATH) {
    if (match(pathname)) return title;
  }
  return "CampusConnect";
}

export function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = resolvePageTitle(pathname);
    document.title = page === BASE ? BASE : `${page} | ${BASE}`;
  }, [pathname]);
}
