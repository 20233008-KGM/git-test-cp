import type { PeerEvaluationSummary, PortfolioFileItem, StudentExtra } from "../types";

export const NETWORK_MAJOR_PLACEHOLDER = "전공 미입력";
/** 본인 카드·모달용 */
export const NETWORK_BIO_PLACEHOLDER =
  "아직 자기소개가 없습니다. 카드를 눌러 정보를 등록해 보세요.";
/** 다른 사람 프로필 조회용 (vision #98) */
export const NETWORK_BIO_PLACEHOLDER_OTHER = "아직 자기소개가 없습니다";
export const NETWORK_TAGS_EMPTY_LABEL = "관심 태그 없음";

export type { PortfolioFileItem };
export type ParsedPortfolioFile = PortfolioFileItem;

export const STUDENT_PORTFOLIO_MAX_BYTES = 50 * 1024 * 1024;
export const STUDENT_PORTFOLIO_MAX_FILES = 20;
export const STUDENT_PORTFOLIO_ACCEPT =
  ".pdf,.zip,.7z,.rar,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.txt,.md,.json,.csv,.png,.jpg,.jpeg,.webp,.gif,.svg,.ts,.tsx,.js,.jsx,.py,.java,.c,.cpp,.go,.rs,.sql,.yaml,.yml";

export const STUDENT_PORTFOLIO_ALLOWED_EXT = new Set([
  "pdf",
  "zip",
  "7z",
  "rar",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "hwp",
  "hwpx",
  "txt",
  "md",
  "json",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "java",
  "c",
  "cpp",
  "go",
  "rs",
  "sql",
  "yaml",
  "yml",
]);

const STUDENT_PORTFOLIO_IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);

export function isPortfolioImageFileName(fileName: string): boolean {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  return STUDENT_PORTFOLIO_IMAGE_EXT.has(extension);
}

function parseSinglePortfolioEntry(
  entry: unknown
): PortfolioFileItem | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as { fileName?: string; publicUrl?: string };
  const fileName = record.fileName?.trim();
  if (!fileName) return null;
  return {
    fileName,
    publicUrl: record.publicUrl?.trim() || undefined,
  };
}

/** `ai_user_learning_profiles.portfolio_file` — JSON 배열·단일 객체·레거시 파일명/URL */
export function parsePortfolioFiles(raw: string | null | undefined): PortfolioFileItem[] {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return [];

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        files?: unknown[];
        fileName?: string;
        publicUrl?: string;
      };
      if (Array.isArray(parsed.files)) {
        return parsed.files
          .map(parseSinglePortfolioEntry)
          .filter((item): item is PortfolioFileItem => item !== null);
      }
      const single = parseSinglePortfolioEntry(parsed);
      if (single) return [single];
    } catch {
      /* fall through */
    }
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown[];
      if (Array.isArray(parsed)) {
        return parsed
          .map(parseSinglePortfolioEntry)
          .filter((item): item is PortfolioFileItem => item !== null);
      }
    } catch {
      /* fall through */
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const segment = trimmed.split("/").pop() || "portfolio";
    try {
      return [{ fileName: decodeURIComponent(segment), publicUrl: trimmed }];
    } catch {
      return [{ fileName: segment, publicUrl: trimmed }];
    }
  }

  return [{ fileName: trimmed }];
}

/** 첫 번째 파일 (레거시 단일 필드 호환) */
export function parsePortfolioFile(raw: string | null | undefined): ParsedPortfolioFile {
  const files = parsePortfolioFiles(raw);
  return files[0] ?? { fileName: "" };
}

export function serializePortfolioFiles(files: PortfolioFileItem[]): string {
  const normalized = files
    .map((file) => ({
      fileName: file.fileName.trim(),
      publicUrl: file.publicUrl?.trim() || undefined,
    }))
    .filter((file) => file.fileName);
  return JSON.stringify({ files: normalized });
}

export function serializePortfolioFile(fileName: string, publicUrl: string): string {
  return serializePortfolioFiles([{ fileName, publicUrl }]);
}

type NetworkProfileMeta = {
  mbti?: string;
  careerInterest?: string;
  hobbies?: string;
};

export function parseNetworkProfileMeta(detailedBio: string | null | undefined): NetworkProfileMeta {
  if (!detailedBio?.trim()) return {};
  try {
    const parsed = JSON.parse(detailedBio) as NetworkProfileMeta;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function isProfileMetaJson(detailedBio: string | null | undefined): boolean {
  if (!detailedBio?.trim().startsWith("{")) return false;
  const meta = parseNetworkProfileMeta(detailedBio);
  return Boolean(meta.mbti?.trim() || meta.careerInterest?.trim() || meta.hobbies?.trim());
}

function splitCommaList(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function nameToAvatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : "?";
}

/** `ai_users.image` 등 — avatar(이니셜)와 구분해 실제 URL만 허용 */
export function isLikelyImageUrl(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("data:image/")) return true;
  if (trimmed.startsWith("/")) return true;
  return false;
}

export function resolveProfileImageUrl(image: string | null | undefined): string | undefined {
  const trimmed = image?.trim();
  return trimmed && isLikelyImageUrl(trimmed) ? trimmed : undefined;
}

export function normalizeStudentTags(tags: string[], skills?: string[]): string[] {
  const fromSkills = (skills ?? []).map((skill) =>
    skill.startsWith("#") ? skill : `#${skill}`,
  );
  return [...new Set([...tags, ...fromSkills].map((tag) => tag.trim()).filter(Boolean))];
}

export function displayMajor(major: string | undefined | null): string {
  return major?.trim() || NETWORK_MAJOR_PLACEHOLDER;
}

export function displayBio(
  bio: string | undefined | null,
  detailedBio: string | undefined | null,
  metaPreview?: NetworkProfileMeta,
  options?: { isSelf?: boolean },
): string {
  if (bio?.trim()) return bio.trim();
  if (detailedBio?.trim() && !isProfileMetaJson(detailedBio)) return detailedBio.trim();
  const meta = metaPreview ?? (detailedBio ? parseNetworkProfileMeta(detailedBio) : {});
  const preview = [meta.mbti, meta.careerInterest, meta.hobbies]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  const fallback = options?.isSelf ? NETWORK_BIO_PLACEHOLDER : NETWORK_BIO_PLACEHOLDER_OTHER;
  return preview || fallback;
}

export function tagsFromEditHints(hints?: {
  careerInterest?: string;
  hobbies?: string;
  mbti?: string;
}): string[] {
  if (!hints) return [];
  const raw = [
    ...splitCommaList(hints.careerInterest ?? ""),
    ...splitCommaList(hints.hobbies ?? ""),
    ...splitCommaList(hints.mbti ?? ""),
  ];
  return raw.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

export type ResolvedStudentExtra = StudentExtra & {
  hasLearningProfile: boolean;
  peerSummary?: PeerEvaluationSummary;
};

export function buildMinimalStudentExtra(
  bio: string | undefined | null,
): ResolvedStudentExtra {
  return {
    temperature: 37,
    teamProjectCount: 0,
    portfolioFile: "",
    portfolioUrl: undefined,
    portfolioFiles: [],
    detailedBio: displayBio(bio, null),
    keywords: [],
    hasLearningProfile: false,
  };
}

export function resolveStudentExtra(
  student: {
    id: string;
    bio?: string;
    isSelf?: boolean;
  },
  extras: Record<string, StudentExtra>,
  peerEvaluations?: Record<string, PeerEvaluationSummary>,
  editHints?: {
    bio?: string;
    careerInterest?: string;
    hobbies?: string;
    mbti?: string;
    portfolioFileName?: string;
    portfolioFiles?: PortfolioFileItem[];
  },
): ResolvedStudentExtra {
  const raw = extras[student.id];
  const hints =
    student.isSelf && editHints
      ? {
          bio: editHints.bio,
          careerInterest: editHints.careerInterest,
          hobbies: editHints.hobbies,
          mbti: editHints.mbti,
        }
      : undefined;

  if (!raw) {
    const minimal = buildMinimalStudentExtra(student.isSelf ? editHints?.bio ?? student.bio : student.bio);
    const summary = peerEvaluations?.[student.id];
    if (summary && summary.keywords.length > 0) {
      minimal.keywords = summary.keywords;
      minimal.hasLearningProfile = true;
      minimal.peerSummary = summary;
    }
    const hintFiles =
      student.isSelf && editHints?.portfolioFiles?.length
        ? editHints.portfolioFiles
        : student.isSelf && editHints?.portfolioFileName?.trim()
          ? parsePortfolioFiles(editHints.portfolioFileName)
          : [];
    if (hintFiles.length > 0) {
      minimal.portfolioFiles = hintFiles;
      minimal.portfolioFile = hintFiles[0].fileName;
      minimal.portfolioUrl = hintFiles[0].publicUrl;
    }
    return minimal;
  }

  const meta = parseNetworkProfileMeta(raw.detailedBio);
  const detailedBio = displayBio(
    student.isSelf ? editHints?.bio ?? student.bio : student.bio,
    raw.detailedBio,
    meta,
    { isSelf: student.isSelf },
  );
  const portfolioFilesFromDb = raw.portfolioFiles?.length
    ? raw.portfolioFiles
    : raw.portfolioFile?.trim()
      ? [{ fileName: raw.portfolioFile.trim(), publicUrl: raw.portfolioUrl }]
      : [];
  const portfolioFilesFromHints =
    student.isSelf && editHints?.portfolioFiles?.length
      ? editHints.portfolioFiles
      : student.isSelf && editHints?.portfolioFileName?.trim()
        ? parsePortfolioFiles(editHints.portfolioFileName)
        : [];
  const portfolioFiles =
    portfolioFilesFromDb.length > 0 ? portfolioFilesFromDb : portfolioFilesFromHints;
  const portfolioFile = portfolioFiles[0]?.fileName ?? "";
  const portfolioUrl = portfolioFiles[0]?.publicUrl;

  const hasLearningProfile =
    portfolioFiles.length > 0 ||
    raw.teamProjectCount > 0 ||
    raw.keywords.length > 0 ||
    (Boolean(raw.detailedBio?.trim()) && !isProfileMetaJson(raw.detailedBio));
  const summary = peerEvaluations?.[student.id];
  const keywords = summary && summary.keywords.length > 0 ? summary.keywords : raw.keywords;

  return {
    temperature: hasLearningProfile ? Number(raw.temperature) || 37 : 37,
    teamProjectCount: raw.teamProjectCount,
    portfolioFile,
    portfolioUrl,
    portfolioFiles,
    detailedBio,
    keywords,
    hasLearningProfile: hasLearningProfile || Boolean(summary && summary.keywords.length > 0),
    peerSummary: summary,
  };
}
