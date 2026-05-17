import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "수업", path: "/app/courses" },
];

export default function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
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

  return (
    <header className="sticky top-0 z-40 w-full border-b-3 border-[#3676ff] bg-black/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <Link to={logoPath} className="flex min-w-0 items-center">
        <h1 className="truncate text-xl font-bold tracking-wide text-white sm:text-2xl">
          CampusConnect
        </h1>
      </Link>
      <button
        className="rounded-lg border border-white/15 px-3 py-2 text-sm font-bold text-white md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="메뉴 열기"
      >
        {isOpen ? "닫기" : "메뉴"}
      </button>
      <div className={`w-full flex-col items-stretch gap-3 md:flex md:w-auto md:flex-row md:items-center md:gap-8 ${isOpen ? "flex" : "hidden"}`}>
        {shouldShowTopNav && (
          <nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-lg border-b-2 px-3 py-2 text-center font-semibold transition-colors md:px-0 md:py-0 ${isActive(item.path) ? "border-[#3676ff] bg-white/10 text-[#3676ff] md:bg-transparent" : "border-transparent text-gray-400 hover:bg-white/10 hover:text-white md:hover:bg-transparent"
                  }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <Link to="/app/mypage" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 md:px-0 md:py-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f67df]">
              <span className="text-white text-sm font-bold">
                {user?.name.charAt(0) || "U"}
              </span>
            </div>
            <div className="border-b border-transparent">
              <span
                className={`text-sm font-medium ${location.pathname === "/app/mypage" ? "text-[#1862ff]" : "text-white"
                  }`}
              >
                {user?.name || "사용자"}
              </span>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </header>
  );
}