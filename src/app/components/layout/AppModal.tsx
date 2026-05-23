import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
};

/**
 * viewport 기준 중앙 모달 — 부모 transform/contain 영향 없이 document.body에 포탈.
 * vision #68 · #80
 */
export default function AppModal({
  open,
  onClose,
  children,
  panelClassName = "",
  testId = "app-modal-overlay",
  ariaLabel,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
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
    document.body
  );
}
