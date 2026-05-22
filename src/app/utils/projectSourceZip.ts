import JSZip from "jszip";

/** 산출물 업로드 한도 (supabase-api TEAM_DELIVERABLE_MAX_BYTES 와 동일) */
export const PROJECT_SOURCE_ZIP_MAX_BYTES = 500 * 1024 * 1024;

/** 폴더 선택 시 경로에서 제외할 디렉터리 이름 (세그먼트 일치) */
const EXCLUDED_DIR_NAMES = new Set(["node_modules", ".git"]);

export type ProjectSourceZipStats = {
  includedCount: number;
  skippedCount: number;
  uncompressedBytes: number;
  zipBytes: number;
  zipFileName: string;
};

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

/** webkitRelativePath 기준으로 node_modules·.git 하위는 제외 */
export function shouldExcludeProjectPath(relativePath: string): boolean {
  const parts = normalizePath(relativePath).split("/").filter(Boolean);
  return parts.some((segment) => EXCLUDED_DIR_NAMES.has(segment));
}

function defaultZipBaseName(files: File[]): string {
  const first = files.find((f) => f.webkitRelativePath)?.webkitRelativePath;
  if (!first) return "project-source";
  const root = normalizePath(first).split("/")[0];
  const safe = root.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "project-source";
}

/**
 * 폴더 선택(FileList, webkitRelativePath) → node_modules 등 제외 후 zip 1개 생성
 */
export async function zipProjectFolderExcludingDeps(
  fileList: FileList | File[],
  options?: { zipBaseName?: string; maxBytes?: number }
): Promise<{ zipFile: File; stats: ProjectSourceZipStats }> {
  const maxBytes = options?.maxBytes ?? PROJECT_SOURCE_ZIP_MAX_BYTES;
  const files = Array.from(fileList);
  if (files.length === 0) {
    throw new Error("선택한 폴더에 파일이 없습니다.");
  }

  const zip = new JSZip();
  let includedCount = 0;
  let skippedCount = 0;
  let uncompressedBytes = 0;

  for (const file of files) {
    const relativePath = normalizePath(file.webkitRelativePath || file.name);
    if (!relativePath || shouldExcludeProjectPath(relativePath)) {
      skippedCount += 1;
      continue;
    }
    zip.file(relativePath, file);
    includedCount += 1;
    uncompressedBytes += file.size;
  }

  if (includedCount === 0) {
    throw new Error(
      "압축할 소스 파일이 없습니다. node_modules만 있는 폴더이거나, 제외 규칙에 걸린 경로만 있습니다."
    );
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  if (blob.size > maxBytes) {
    throw new Error(
      `압축 파일이 ${(blob.size / (1024 * 1024)).toFixed(1)}MB입니다. 파일당 최대 ${(maxBytes / (1024 * 1024)).toFixed(0)}MB 이하로 줄여 주세요.`
    );
  }

  const base = options?.zipBaseName ?? defaultZipBaseName(files);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const zipFileName = `${base}-source-${date}.zip`;
  const zipFile = new File([blob], zipFileName, {
    type: "application/zip",
    lastModified: Date.now(),
  });

  return {
    zipFile,
    stats: {
      includedCount,
      skippedCount,
      uncompressedBytes,
      zipBytes: blob.size,
      zipFileName,
    },
  };
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
