import React from "react";
import { useLocation } from "react-router";
import { getAppShellClassName } from "../../layouts/appShell";
import MyPageSideNav from "./MyPageSideNav";

export default function MyPageShell({
  children,
  testId,
}: {
  children: React.ReactNode;
  testId?: string;
}) {
  const location = useLocation();
  const appShellClass = getAppShellClassName(location.pathname);

  return (
    <div className="cc-page-bg min-h-screen" data-testid={testId}>
      <div
        className={`${appShellClass} flex w-full flex-col gap-6 py-4 sm:gap-8 sm:py-6 lg:flex-row lg:items-start`}
      >
        <MyPageSideNav />
        <main className="min-w-0 w-full flex-1">
          <div className="mypage-content-column">{children}</div>
        </main>
      </div>
    </div>
  );
}
