import React from "react";
import { Link, Outlet, useLocation } from "react-router";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";

const sideNavItems = [
  { label: "수강자들", path: "/app/students" },
  { label: "팀", path: "/app/teams" },
];

function CourseSideNavigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/app/students") {
      return location.pathname.startsWith("/app/students");
    }

    if (path === "/app/teams") {
      return location.pathname.startsWith("/app/teams");
    }

    return location.pathname === path;
  };

  return (
    <aside className="w-full lg:w-[220px] lg:shrink-0">
      <div className="lg:sticky lg:top-20 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-black text-gray-500">수업 메뉴</p>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sideNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap rounded-[10px] px-4 py-3 text-sm font-bold transition-colors ${
                isActive(item.path)
                  ? "bg-[#155dfc] text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-[#eff6ff] hover:text-[#155dfc]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const showCourseSideNavigation =
    /^\/app\/courses\/[^/]+/.test(location.pathname) ||
    location.pathname.startsWith("/app/students") ||
    location.pathname.startsWith("/app/teams");

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1 w-full">
        {showCourseSideNavigation ? (
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
            <CourseSideNavigation />
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
}
