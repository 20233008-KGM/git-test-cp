import type { PeerEvaluationSummary, StudentExtra } from "../types";

export const NETWORK_MAJOR_PLACEHOLDER = "전공 미입력";
/** 본인 카드·모달용 */
export const NETWORK_BIO_PLACEHOLDER =
  "아직 자기소개가 없습니다. 카드를 눌러 정보를 등록해 보세요.";
/** 다른 사람 프로필 조회용 (vision #98) */
export const NETWORK_BIO_PLACEHOLDER_OTHER = "아직 자기소개가 없습니다";
export const NETWORK_TAGS_EMPTY_LABEL = "관심 태그 없음";

export type ParsedPortfolioFile = {
  fileName: string;
  publicUrl?: string;
};

/** `ai_user_learning_profiles.portfolio_file` — JSON 또는 레거시 파일명/URL */
export function parsePortfolioFile(raw: string | null | undefined): ParsedPortfolioFile {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return { fileName: "" };

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { fileName?: string; publicUrl?: string };
      if (typeof parsed === "object" && parsed !== null && parsed.fileName?.trim()) {
        return {
          fileName: parsed.fileName.trim(),
          publicUrl: parsed.publicUrl?.trim() || undefined,
        };
      }
    } catch {
      /* fall through to legacy */
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const segment = trimmed.split("/").pop() || "portfolio";
    try {
      return { fileName: decodeURIComponent(segment), publicUrl: trimmed };
    } catch {
      return { fileName: segment, publicUrl: trimmed };
    }
  }

  return { fileName: trimmed };
}

export function serializePortfolioFile(fileName: string, publicUrl: string): string {
  return JSON.stringify({
    fileName: fileName.trim(),
    publicUrl: publicUrl.trim(),
  });
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
    if (student.isSelf && editHints?.portfolioFileName?.trim()) {
      const parsed = parsePortfolioFile(editHints.portfolioFileName);
      minimal.portfolioFile = parsed.fileName;
      minimal.portfolioUrl = parsed.publicUrl;
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
  const portfolioFromDb = {
    fileName: raw.portfolioFile?.trim() ?? "",
    publicUrl: raw.portfolioUrl,
  };
  const portfolioFromHints =
    student.isSelf && editHints?.portfolioFileName?.trim()
      ? parsePortfolioFile(editHints.portfolioFileName)
      : null;
  const portfolioFile = portfolioFromDb.fileName || portfolioFromHints?.fileName || "";
  const portfolioUrl = portfolioFromDb.publicUrl || portfolioFromHints?.publicUrl;

  const hasLearningProfile =
    Boolean(portfolioFile) ||
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
    detailedBio,
    keywords,
    hasLearningProfile: hasLearningProfile || Boolean(summary && summary.keywords.length > 0),
    peerSummary: summary,
  };
}
