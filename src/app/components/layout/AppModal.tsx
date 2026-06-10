import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MODAL_ROOT_ID = "cc-modal-root";

type BodyScrollSnapshot = {
  scrollY: number;
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyPaddingRight: string;
};

let bodyScrollLockCount = 0;
let bodyScrollSnapshot: BodyScrollSnapshot | null = null;

function getModalRoot(): HTMLElement {
  let root = document.getElementById(MODAL_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = MODAL_ROOT_ID;
    document.documentElement.appendChild(root);
  }
  return root;
}

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    bodyScrollSnapshot = {
      scrollY,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyPaddingRight: document.body.style.paddingRight,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  bodyScrollLockCount += 1;
}

function unlockBodyScroll() {
  if (bodyScrollLockCount === 0) return;
  bodyScrollLockCount -= 1;
  if (bodyScrollLockCount > 0 || !bodyScrollSnapshot) return;

  const {
    scrollY,
    htmlOverflow,
    bodyOverflow,
    bodyPosition,
    bodyTop,
    bodyLeft,
    bodyRight,
    bodyWidth,
    bodyPaddingRight,
  } = bodyScrollSnapshot;

  document.body.style.position = bodyPosition;
  document.body.style.top = bodyTop;
  document.body.style.left = bodyLeft;
  document.body.style.right = bodyRight;
  document.body.style.width = bodyWidth;
  document.body.style.overflow = bodyOverflow;
  document.body.style.paddingRight = bodyPaddingRight;
  document.documentElement.style.overflow = htmlOverflow;
  window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  bodyScrollSnapshot = null;
}

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 모달 패널에 추가 class */
  panelClassName?: string;
  /** 오버레이 data-testid */
  testId?: string;
  /** 패널 role=dialog title (접근성) */
  ariaLabel?: string;
  /** true면 반투명 배경 없이 기존 화면 그대로 노출 */
  hideBackdrop?: boolean;
};

/**
 * viewport 기준 중앙 모달 — body 스크롤 잠금과 분리된 #cc-modal-root 포탈.
 * vision #68 · #80
 */
export default function AppModal({
  open,
  onClose,
  children,
  panelClassName = "",
  testId = "app-modal-overlay",
  ariaLabel,
  hideBackdrop = false,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${hideBackdrop ? "bg-transparent" : "bg-black/40"}`}
      onClick={onClose}
      data-testid={testId}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`max-h-[min(90vh,900px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${panelClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    getModalRoot()
  );
}
