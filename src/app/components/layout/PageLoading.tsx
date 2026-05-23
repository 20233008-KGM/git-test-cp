import React from "react";

export type PageLoadingLayout = "fullscreen" | "page" | "inline";
export type PageLoadingSize = "sm" | "md" | "lg";

export interface PageLoadingProps {
  /** 화면에 표시할 안내 문구 */
  message?: string;
  /** fullscreen: 앱 전체 · page: 본문 영역 · inline: 섹션/목록 안 */
  layout?: PageLoadingLayout;
  /** sm/md/lg — 스피너 크기 */
  size?: PageLoadingSize;
  /** CoursesPage 등 shell 밖 페이지 — cc-app-shell 래핑 */
  shell?: boolean;
  className?: string;
  testId?: string;
}

const layoutClass: Record<PageLoadingLayout, string> = {
  fullscreen:
    "flex min-h-screen w-full flex-col items-center justify-center bg-[var(--cc-surface-container)] px-4",
  page: "flex min-h-[min(50vh,28rem)] w-full flex-1 items-center justify-center px-4 py-12",
  inline: "flex w-full items-center justify-center px-4 py-16",
};

const sizeClass: Record<PageLoadingSize, string> = {
  sm: "cc-loading-spinner--sm",
  md: "cc-loading-spinner--md",
  lg: "cc-loading-spinner--lg",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: PageLoadingSize;
  className?: string;
}) {
  return (
    <div
      className={`cc-loading-spinner ${sizeClass[size]} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="cc-loading-spinner__ring cc-loading-spinner__ring--outer" />
      <span className="cc-loading-spinner__ring cc-loading-spinner__ring--inner" />
      <span className="cc-loading-spinner__dot" />
    </div>
  );
}

export default function PageLoading({
  message = "불러오는 중…",
  layout = "page",
  size = "md",
  shell = false,
  className = "",
  testId = "page-loading",
}: PageLoadingProps) {
  const panel = (
    <div
      className="cc-loading-panel"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      data-testid={testId}
    >
      <LoadingSpinner size={size} />
      <p className="cc-loading-message">{message}</p>
    </div>
  );

  const body = (
    <div className={`${layoutClass[layout]} ${className}`.trim()}>{panel}</div>
  );

  if (shell) {
    return <div className="cc-app-shell w-full py-4 sm:py-6">{body}</div>;
  }

  return body;
}
