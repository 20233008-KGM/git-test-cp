import React from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "수업", path: "/app/courses" },
];

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isCourseListPage = location.pathname === "/app/courses";
  const shouldShowTopNav = !isCourseListPage;

  const isActive = (path: string) => {
    if (path === "/app/courses") {
      return location.pathname.startsWith("/app/courses");
    }
    return location.pathname === path;
  };

  return (/*gap-2 h-16 → md:h-16  flex-col md:flex-row md:justify-between pb-4 md:pb-0*/
    <div className="bg-black w-full gap-2 md:h-16 px-8 pb-4 md:pb-0 md:px-32 flex flex-col md:flex-row md:justify-between items-center shadow-lg border-b-3 border-[#3676ff]">
      <Link to="/" className="flex items-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          CampusConnect
        </h1>
      </Link>
      <div className="block md:hidden">
        <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "▲" : "▼"}
        </button>
      </div>
      {/* /*flex-col md:flex-row gap-8ㄱgap-4*/}
      <div className={`flex flex-col md:flex-row items-center gap-4 md:gap-0 ${isOpen ? "block" : "hidden md:flex"}`}>
        {/* /*flex-col md:flex-row gap-1 md:gap-8 items-center */}
        {shouldShowTopNav && (
          <nav className="flex flex-col md:flex-row gap-1 md:gap-8 items-center ">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative transition-colors font-semibold ${isActive(item.path) ? "text-[#3676ff]" : "text-gray-400 hover:text-white"
                  }`}
              >
                <span>{item.label}</span>
                {isActive(item.path) && (
                  /*hidden md:block*/
                  <div className="hidden md:block absolute -bottom-5 left-0 right-0 h-0.5 bg-[#3676ff]" />
                )}
              </Link>
            ))}
          </nav>
        )}
/* flex-col md:flex-row */
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Link to="/app/mypage" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2f67df] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.name.charAt(0) || "U"}
              </span>
            </div>
            <div className="relative">
              <span
                className={`text-sm font-medium ${location.pathname === "/app/mypage" ? "text-[#1862ff]" : "text-white"
                  }`}
              >
                {user?.name || "사용자"}
              </span>
              {location.pathname === "/app/mypage" && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#1862ff]" />
              )}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}