import AppModal from "./layout/AppModal";
import { extractDeployLinkFromDescription } from "../api/supabase-api";
import type { TeamDeliverable } from "../types";

type Props = {
  open: boolean;
  item: TeamDeliverable | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
};

export default function TeamDeliverableDetailModal({
  open,
  item,
  canEdit,
  onClose,
  onEdit,
}: Props) {
  if (!item) return null;

  const deployLink =
    item.kind === "link" ? item.publicUrl : extractDeployLinkFromDescription(item.description);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      testId="team-deliverable-detail-modal-overlay"
      ariaLabel="산출물 상세"
      panelClassName="max-w-[560px] !p-0"
    >
      <div className="border-b border-[var(--cc-outline-variant)] px-6 py-4">
        <p className="text-xs font-medium text-[var(--cc-on-surface-variant)]">
          {item.kind === "link" ? "링크 게시물" : "파일 게시물"}
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--cc-on-surface)]">{item.fileName}</h2>
        {item.subtitle && (
          <p className="mt-1 text-sm text-[var(--cc-on-surface-variant)]">{item.subtitle}</p>
        )}
      </div>

      <div className="space-y-4 px-6 py-5">
        {item.description && (
          <div>
            <p className="cc-label mb-1">본문</p>
            <p className="whitespace-pre-wrap text-sm text-[var(--cc-on-surface)]">{item.description}</p>
          </div>
        )}
        {deployLink && (
          <div>
            <p className="cc-label mb-1">배포 링크</p>
            <a
              href={deployLink}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-link break-all text-sm"
            >
              {deployLink}
            </a>
          </div>
        )}
        <p className="text-xs text-[var(--cc-on-surface-variant)]">
          {item.uploaderName} · {new Date(item.createdAt).toLocaleString("ko-KR")}
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--cc-outline-variant)] px-6 py-4">
        <a
          href={item.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="m3-btn m3-btn--tonal px-4 py-2 text-sm"
        >
          {item.kind === "link" ? "링크 열기" : "다운로드"}
        </a>
        {canEdit && (
          <button type="button" onClick={onEdit} className="m3-btn m3-btn--filled px-4 py-2 text-sm font-bold">
            수정
          </button>
        )}
        <button type="button" onClick={onClose} className="m3-btn m3-btn--outlined px-4 py-2 text-sm">
          닫기
        </button>
      </div>
    </AppModal>
  );
}
