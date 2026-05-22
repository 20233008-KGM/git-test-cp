import React, { useEffect, useRef, useState } from "react";
import type { TeamDeliverable } from "../types";
import {
  formatByteSize,
  zipProjectFolderExcludingDeps,
  type ProjectSourceZipStats,
} from "../utils/projectSourceZip";

export type TeamDeliverableFormPayload = {
  title: string;
  description: string;
  linkUrl: string;
  files: File[];
};

type Props = {
  open: boolean;
  uploading: boolean;
  mode?: "create" | "edit";
  editing?: TeamDeliverable | null;
  onClose: () => void;
  onSubmit: (payload: TeamDeliverableFormPayload) => Promise<void>;
};

const FILE_ACCEPT =
  ".pdf,.zip,.7z,.rar,.tar,.gz,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.svg,.txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.java,.c,.cpp,.go,.rs,.sql,.yaml,.yml,.doc,.docx,.xls,.xlsx";

const emptyForm = (): TeamDeliverableFormPayload => ({
  title: "",
  description: "",
  linkUrl: "",
  files: [],
});

export default function TeamDeliverableSubmitModal({
  open,
  uploading,
  mode = "create",
  editing = null,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = mode === "edit" && editing != null;
  const isLinkEdit = isEdit && editing.kind === "link";
  const isFileEdit = isEdit && editing.kind !== "link";

  const [form, setForm] = useState<TeamDeliverableFormPayload>(emptyForm);
  const [zipping, setZipping] = useState(false);
  const [zipStats, setZipStats] = useState<ProjectSourceZipStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setZipping(false);
    setZipStats(null);
    if (isEdit && editing) {
      setForm({
        title: editing.fileName,
        description: editing.description ?? "",
        linkUrl: editing.kind === "link" ? editing.publicUrl : "",
        files: [],
      });
      return;
    }
    setForm(emptyForm());
  }, [open, isEdit, editing]);

  if (!open) return null;

  const busy = uploading || zipping;

  const update = <K extends keyof TeamDeliverableFormPayload>(key: K, value: TeamDeliverableFormPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const mergeFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setZipStats(null);
    const next = isFileEdit ? ([] as File[]) : [...form.files];
    for (const file of Array.from(incoming)) {
      if (!next.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
        next.push(file);
      }
    }
    update("files", isFileEdit ? next.slice(0, 1) : next);
  };

  const handleProjectFolderPick = async (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setZipping(true);
    setZipStats(null);
    try {
      const { zipFile, stats } = await zipProjectFolderExcludingDeps(incoming);
      setZipStats(stats);
      update("files", [zipFile]);
      if (!form.title.trim()) {
        update("title", stats.zipFileName.replace(/\.zip$/i, ""));
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "프로젝트 압축에 실패했습니다.");
      update("files", []);
    } finally {
      setZipping(false);
    }
  };

  const removeFile = (index: number) => {
    setZipStats(null);
    update(
      "files",
      form.files.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    const linkUrl = form.linkUrl.trim();
    if (isEdit) {
      if (isLinkEdit && !linkUrl) {
        alert("배포 링크를 입력해주세요.");
        return;
      }
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        linkUrl,
        files: form.files,
      });
      return;
    }

    if (!linkUrl && form.files.length === 0) {
      alert("배포 링크 또는 파일·프로젝트 폴더 ZIP 중 하나 이상을 추가해주세요.");
      return;
    }
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      linkUrl,
      files: form.files,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="team-deliverable-modal-overlay"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[12px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="team-deliverable-modal"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#1e2939]">{isEdit ? "산출물 수정" : "산출물 등록"}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]" htmlFor="team-deliverable-modal-title">
              제목
            </label>
            <input
              id="team-deliverable-modal-title"
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              data-testid="team-deliverable-link-title-input"
              placeholder="예: 중간 발표 자료, v1.0 배포"
              className="w-full rounded-[8px] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]" htmlFor="team-deliverable-modal-description">
              메시지
            </label>
            <textarea
              id="team-deliverable-modal-description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              data-testid="team-deliverable-modal-description-input"
              placeholder="팀원에게 전달할 설명을 적어주세요."
              rows={3}
              className="w-full resize-none rounded-[8px] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>

          {(isLinkEdit || !isEdit) && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1e2939]" htmlFor="team-deliverable-link-url-input">
                배포 링크 {isLinkEdit && <span className="text-red-600">*</span>}
              </label>
              <input
                id="team-deliverable-link-url-input"
                type="text"
                value={form.linkUrl}
                onChange={(e) => update("linkUrl", e.target.value)}
                data-testid="team-deliverable-link-url-input"
                placeholder="https://example.com 또는 example.com/path"
                className="w-full rounded-[8px] border border-[#bfdbfe] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}

          {isFileEdit && (
            <p className="rounded-[8px] border border-gray-200 bg-[#f9fafb] px-3 py-2 text-xs text-[#4a5565]">
              현재 파일: {editing.fileName}
              {editing.fileSize > 0 ? ` (${(editing.fileSize / 1024).toFixed(1)} KB)` : ""}
            </p>
          )}

          {(!isEdit || isFileEdit) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1e2939]">
                {isFileEdit ? "파일 교체 (선택)" : "파일 · 프로젝트 소스"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="rounded-[8px] border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-60"
                >
                  {isFileEdit ? "다른 파일로 교체" : "파일 선택"}
                </button>
                {!isFileEdit && (
                  <button
                    type="button"
                    onClick={() => projectFolderInputRef.current?.click()}
                    disabled={busy}
                    data-testid="team-deliverable-project-folder-picker"
                    className="rounded-[8px] border-2 border-[#93c5fd] bg-[#eff6ff] px-3 py-2 text-xs font-bold text-[#155dfc] hover:bg-[#dbeafe] disabled:opacity-60"
                  >
                    {zipping ? "압축 중…" : "프로젝트 폴더 → ZIP"}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple={!isFileEdit}
                accept={FILE_ACCEPT}
                className="hidden"
                data-testid="team-deliverable-file-input"
                onChange={(e) => {
                  mergeFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {!isFileEdit && (
                <input
                  ref={projectFolderInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  // @ts-expect-error webkitdirectory is supported in Chromium browsers
                  webkitdirectory=""
                  data-testid="team-deliverable-project-folder-input"
                  onChange={(e) => {
                    void handleProjectFolderPick(e.target.files);
                    e.target.value = "";
                  }}
                />
              )}
              {zipping && (
                <p className="text-xs text-[#155dfc]" data-testid="team-deliverable-zip-progress">
                  node_modules·.git 제외 후 ZIP을 만드는 중입니다…
                </p>
              )}
              {zipStats && !zipping && (
                <p className="text-xs text-[#008236]" data-testid="team-deliverable-zip-stats">
                  포함 {zipStats.includedCount}개 · 제외 {zipStats.skippedCount}개 · 압축{" "}
                  {formatByteSize(zipStats.zipBytes)}
                </p>
              )}
              {form.files.length > 0 ? (
                <ul className="max-h-32 space-y-1 overflow-y-auto rounded-[8px] border border-gray-200 bg-[#f9fafb] p-2">
                  {form.files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex items-center justify-between gap-2 text-xs text-[#364153]"
                    >
                      <span className="truncate">
                        📄 {file.name}{" "}
                        <span className="text-[#6a7282]">({formatByteSize(file.size)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={busy}
                        className="shrink-0 text-red-600 hover:underline disabled:opacity-60"
                      >
                        제거
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                !isFileEdit &&
                !zipping && (
                  <p className="text-[11px] text-[#64748b]" data-testid="team-deliverable-upload-guide">
                    프로젝트 폴더 선택 시 <strong>node_modules</strong>·<strong>.git</strong> 은 빼고 ZIP 1개로
                    올립니다. 개별 파일·기존 zip도 가능 · 최대 500MB
                  </p>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-[8px] border border-gray-300 px-4 py-2 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy}
            data-testid="team-deliverable-link-submit"
            className="rounded-[8px] bg-[#155dfc] px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? "저장 중..." : zipping ? "압축 중..." : isEdit ? "저장" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
