import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { getAppShellClassName } from "../layouts/appShell";
import NavProfileInbox from "./NavProfileInbox";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "수업", path: "/app/courses" },
  { label: "강의계획서", path: "/app/syllabi" },
];

const DESKTOP_NAV_MQ = "(min-width: 768px)";

export default function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isCourseListPage = location.pathname === "/app/courses";
  const shouldShowTopNav = !isCourseListPage;
  const logoPath = isAuthenticated ? "/app/courses" : "/";

  const isActive = (path: string) => {
    if (path === "/app/courses") {
      return location.pathname.startsWith("/app/courses");
    }
    return location.pathname === path;
  };

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_NAV_MQ);
    const sync = () => {
      if (mq.matches) setIsOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const appShellClass = getAppShellClassName(location.pathname);

  return (
    <header className="m3-top-app-bar sticky top-0 z-40 w-full" data-testid="app-top-nav">
      <div
        className={`relative flex min-h-[var(--cc-nav-height)] items-center justify-between gap-3 py-2 ${appShellClass}`}
      >
        <Link to={logoPath} className="flex min-w-0 items-center">
          <span className="m3-top-app-bar__title truncate">CampusConnect</span>
        </Link>

        {/* 모바일 전용 — m3-icon-btn 사용 금지(display가 md:hidden을 덮음) */}
        <button
          type="button"
          className="inline-flex min-h-10 items-center rounded-[var(--m3-shape-full)] border border-[var(--cc-footer-border)] px-3 py-2 text-[var(--cc-on-footer-muted)] transition-colors hover:bg-white/10 md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          aria-controls="app-top-nav-menu"
          data-testid="app-top-nav-menu-toggle"
        >
          <span className="m3-top-app-bar__menu-toggle px-1">{isOpen ? "닫기" : "메뉴"}</span>
        </button>

        <div
          id="app-top-nav-menu"
          className={`absolute left-0 right-0 top-full z-50 flex-col gap-2 border-b border-[var(--cc-footer-border)] bg-[var(--cc-footer)] px-4 py-3 shadow-[var(--m3-elevation-2)] md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none ${
            isOpen ? "flex" : "hidden md:flex"
          }`}
        >
          {shouldShowTopNav && (
            <nav className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1" aria-label="주요 메뉴">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`m3-top-app-bar__nav-link text-center ${
                    isActive(item.path) ? "m3-top-app-bar__nav-link--active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex flex-col items-stretch gap-2 border-t border-[var(--cc-footer-border)] pt-2 md:flex-row md:items-stretch md:border-0 md:pt-0 md:pl-2">
            <NavProfileInbox
              userName={user?.name || "사용자"}
              userImageUrl={user?.imageUrl}
              userId={user?.id}
              isAuthenticated={isAuthenticated}
              onNavigate={() => setIsOpen(false)}
              mobileMenuOpen={isOpen}
            />
            {isAuthenticated && (
              <button
                type="button"
                data-testid="logout-button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="m3-top-app-bar__nav-link cc-touch-target"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
