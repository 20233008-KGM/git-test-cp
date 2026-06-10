import React, { useRef, useState } from "react";
import { api } from "../../api/supabase-api";
import type { PortfolioFileItem } from "../../types";
import {
  isPortfolioImageFileName,
  STUDENT_PORTFOLIO_ACCEPT,
  STUDENT_PORTFOLIO_ALLOWED_EXT,
  STUDENT_PORTFOLIO_MAX_BYTES,
  STUDENT_PORTFOLIO_MAX_FILES,
} from "../../utils/studentNetworkDisplay";

type PortfolioAttachmentsPanelProps = {
  files: PortfolioFileItem[];
  canManage: boolean;
  onUpdated?: () => void;
};

export default function PortfolioAttachmentsPanel({
  files,
  canManage,
  onUpdated,
}: PortfolioAttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handlePickFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || !canManage) return;
    setMessage(null);

    const selected = Array.from(fileList);
    if (files.length + selected.length > STUDENT_PORTFOLIO_MAX_FILES) {
      setMessage(`첨부파일은 최대 ${STUDENT_PORTFOLIO_MAX_FILES}개까지 등록할 수 있습니다.`);
      return;
    }

    for (const file of selected) {
      const extension = file.name.toLowerCase().split(".").pop() ?? "";
      if (!extension || !STUDENT_PORTFOLIO_ALLOWED_EXT.has(extension)) {
        setMessage(`지원하지 않는 파일 형식입니다: ${file.name}`);
        return;
      }
      if (file.size > STUDENT_PORTFOLIO_MAX_BYTES) {
        setMessage(`${file.name}: 파일 크기는 50MB 이하여야 합니다.`);
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of selected) {
        await api.studentNetwork.uploadPortfolio(file);
      }
      onUpdated?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (publicUrl: string) => {
    if (!canManage || !publicUrl) return;
    if (!window.confirm("이 첨부파일을 삭제할까요?")) return;
    setMessage(null);
    setRemovingUrl(publicUrl);
    try {
      await api.studentNetwork.removePortfolio(publicUrl);
      onUpdated?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setRemovingUrl(null);
    }
  };

  return (
    <div>
      <p className="mb-2 text-base font-bold text-black">포트폴리오 & 첨부파일</p>
      <div className="space-y-2 rounded-[10px] border border-gray-200 px-4 py-3">
        {files.length > 0 ? (
          <ul className="space-y-2" data-testid="student-profile-portfolio-list">
            {files.map((file) => {
              const isImage = isPortfolioImageFileName(file.fileName) && Boolean(file.publicUrl);
              return (
              <li
                key={`${file.publicUrl ?? file.fileName}`}
                className="flex items-start justify-between gap-2"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  {isImage ? (
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 overflow-hidden rounded-md border border-[var(--cc-outline-variant)] bg-[var(--cc-surface-sunken)]"
                      data-testid="student-profile-portfolio-thumb-link"
                      title={`${file.fileName} 미리보기`}
                    >
                      <img
                        src={file.publicUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 object-cover"
                        data-testid="student-profile-portfolio-thumb"
                      />
                    </a>
                  ) : (
                    <span className="cc-icon-muted mt-0.5 text-sm" aria-hidden>
                      📎
                    </span>
                  )}
                  <div className="min-w-0 pt-0.5">
                    {file.publicUrl ? (
                      <a
                        href={file.publicUrl}
                        download={file.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="student-profile-portfolio-download"
                        className="cc-link block truncate text-sm underline"
                      >
                        {file.fileName}
                      </a>
                    ) : (
                      <span
                        className="cc-text-secondary block truncate text-sm"
                        data-testid="student-profile-portfolio-filename"
                      >
                        {file.fileName}
                      </span>
                    )}
                  </div>
                </div>
                {canManage && file.publicUrl && (
                  <button
                    type="button"
                    onClick={() => void handleRemove(file.publicUrl!)}
                    disabled={removingUrl === file.publicUrl || uploading}
                    className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    data-testid="student-profile-portfolio-remove"
                  >
                    {removingUrl === file.publicUrl ? "삭제 중…" : "삭제"}
                  </button>
                )}
              </li>
            );
            })}
          </ul>
        ) : (
          <p className="cc-text-placeholder cc-text-placeholder--empty text-sm" data-testid="student-profile-portfolio-empty">
            등록된 파일 없음
          </p>
        )}

        {canManage && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={STUDENT_PORTFOLIO_ACCEPT}
              className="hidden"
              data-testid="student-profile-portfolio-input"
              onChange={(e) => void handlePickFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || files.length >= STUDENT_PORTFOLIO_MAX_FILES}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-[#364153] transition-colors hover:border-[#155dfc] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="student-profile-portfolio-upload"
            >
              {uploading ? "업로드 중…" : "파일 추가"}
            </button>
            <p className="cc-text-muted text-xs">
              PDF, 문서, 이미지, 압축, 코드 등 · 파일당 50MB · 최대 {STUDENT_PORTFOLIO_MAX_FILES}개
            </p>
          </>
        )}
        {message && (
          <p className="text-xs font-medium text-red-600" role="alert">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
