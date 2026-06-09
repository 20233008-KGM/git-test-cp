export const MEETING_SUMMARY_PREFIX = "회의요약::";
const MEETING_MARKER = "회의록";

const PLACEHOLDER_MEETING_SUMMARIES = new Set([
  "회의록이 등록되었습니다.",
  "회의록 링크가 등록되었습니다.",
  "내용을 읽지 못했습니다.",
]);

const TEXT_READABLE_EXT = new Set(["txt", "md", "csv", "json"]);

/** macOS 등에서 한글 파일명이 NFD로 저장되는 경우를 통일 */
export function normalizeMeetingText(value: string): string {
  return value.normalize("NFC");
}

function containsMeetingMarker(...parts: (string | null | undefined)[]): boolean {
  const marker = normalizeMeetingText(MEETING_MARKER);
  const haystack = parts
    .map((part) => (part?.trim() ? normalizeMeetingText(part.trim()) : ""))
    .filter(Boolean)
    .join(" ");
  return haystack.includes(marker);
}

export function isMeetingMinutesDeliverable(
  fileName: string,
  subtitle?: string | null,
  title?: string | null,
  description?: string | null,
): boolean {
  return containsMeetingMarker(fileName, subtitle, title, description);
}

export function isPlaceholderMeetingSummary(summary: string): boolean {
  const normalized = normalizeMeetingText(summary.trim());
  return PLACEHOLDER_MEETING_SUMMARIES.has(normalized);
}

function meetingFileBaseName(fileName: string): string {
  const normalized = normalizeMeetingText(fileName.trim());
  const lastDot = normalized.lastIndexOf(".");
  return lastDot > 0 ? normalized.slice(0, lastDot) : normalized;
}

const MEETING_SUBSTANCE_KEYWORDS = [
  "담당",
  "역할",
  "결정",
  "확정",
  "진행",
  "발표",
  "과제",
  "이슈",
  "해결",
  "일정",
  "분담",
  "합의",
  "논의",
  "계획",
  "마감",
  "제출",
  "준비",
  "완료",
  "수정",
  "보완",
  "피드백",
  "검토",
  "자료",
  "발표자",
  "팀원",
  "목표",
  "방향",
  "교수",
  "프로젝트",
  "과목",
  "구현",
  "개발",
  "발표일",
  "중간",
  "최종",
];

const MEETING_SECTION_HEADER_PATTERNS = [
  /^교수님의?\s*(질문|피드백)/,
  /^질문\s*[,·/]\s*답변$/,
  /^해결해야\s*하는\s*(과제|이슈)?$/,
  /^역할\s*분담$/,
  /^회의\s*안건$/,
  /^참석자$/,
  /^일시$/,
  /^장소$/,
  /^다음\s*(회의|액션|일정)$/,
  /^액션\s*아이템$/,
  /^논의\s*사항$/,
  /^진행\s*상황$/,
];

function summaryHasSubstance(summary: string): boolean {
  const normalized = normalizeMeetingText(summary);
  const keywordHits = MEETING_SUBSTANCE_KEYWORDS.filter((keyword) =>
    normalized.includes(keyword),
  ).length;
  if (keywordHits >= 2) return true;
  if (normalized.length >= 32 && keywordHits >= 1) return true;
  return /[다음하겠했었음니다]$/.test(normalized) && normalized.length >= 28;
}

function looksLikeSectionHeaderOnly(summary: string): boolean {
  const normalized = normalizeMeetingText(summary.trim());
  if (!normalized) return true;
  if (MEETING_SECTION_HEADER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  const segments = splitMeetingSegments(normalized);
  if (segments.length === 0) return false;
  const headerLikeCount = segments.filter((segment) => isMeetingSectionHeader(segment)).length;
  return headerLikeCount >= segments.length;
}

/** PDF 앞부분·섹션 제목 나열만 잘라낸 휴리스틱 요약 */
function looksLikeLeadingSectionDump(summary: string): boolean {
  const normalized = normalizeMeetingText(summary.trim());
  if (!normalized) return true;
  if (/^교수님의?\s*질문/.test(normalized)) return true;
  if (/^질문\s*[,·/]\s*답변/.test(normalized)) return true;
  if (/^해결해야\s*하는/.test(normalized) && normalized.length <= 48) return true;

  if (/[•·]/.test(normalized)) {
    const parts = normalized
      .split(/[•·]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (parts.length >= 2) {
      const headerLikeCount = parts.filter((part) => isMeetingSectionHeader(part) || part.length <= 22)
        .length;
      if (headerLikeCount >= parts.length) return true;
    }
  }

  return false;
}

/** 파일명 복사·placeholder·섹션 제목만 나열한 저장값 */
export function isLowQualityMeetingSummary(fileName: string, summary: string): boolean {
  const normalizedSummary = normalizeMeetingText(summary.trim());
  if (!normalizedSummary || isPlaceholderMeetingSummary(normalizedSummary)) return true;

  const normalizedFileName = normalizeMeetingText(fileName.trim());
  const fileBase = meetingFileBaseName(normalizedFileName);
  const summaryBase = meetingFileBaseName(normalizedSummary);

  if (normalizedSummary === normalizedFileName) return true;
  if (normalizedSummary === fileBase) return true;
  if (summaryBase === fileBase && normalizedSummary.length <= fileBase.length + 2) return true;
  if (looksLikeSectionHeaderOnly(normalizedSummary)) return true;
  if (looksLikeLeadingSectionDump(normalizedSummary)) return true;
  if (!summaryHasSubstance(normalizedSummary)) return true;

  return false;
}

function parseMeetingSummaryRow(row: string): { fileName: string; summary: string } | null {
  const trimmed = normalizeMeetingText(row.trim());
  if (!trimmed.startsWith(MEETING_SUMMARY_PREFIX)) return null;
  const body = trimmed.slice(MEETING_SUMMARY_PREFIX.length);
  const sep = body.indexOf("::");
  if (sep < 0) return null;
  const fileName = body.slice(0, sep).trim();
  const summary = body.slice(sep + 2).trim();
  if (!fileName || !summary) return null;
  return { fileName, summary };
}

export function hasStoredMeetingSummary(description: string | null | undefined): boolean {
  if (!description?.trim()) return false;
  return description
    .split("\n")
    .map((row) => parseMeetingSummaryRow(row))
    .some(
      (parsed) =>
        parsed !== null && !isLowQualityMeetingSummary(parsed.fileName, parsed.summary),
    );
}

export function formatMeetingSummaryDisplay(fileName: string, summary: string): string {
  return `${fileName.trim()} - ${summary.trim()}`;
}

export function appendMeetingSummaryLine(
  existingDescription: string | null | undefined,
  fileName: string,
  summary: string,
): string {
  const normalizedFileName = normalizeMeetingText(fileName.trim());
  const line = `${MEETING_SUMMARY_PREFIX}${normalizedFileName}::${summary.trim()}`;
  const base = existingDescription?.trim() ?? "";
  const withoutDuplicate = base
    .split("\n")
    .filter((row) => {
      const trimmed = normalizeMeetingText(row.trim());
      return !trimmed.startsWith(`${MEETING_SUMMARY_PREFIX}${normalizedFileName}::`);
    })
    .join("\n")
    .trim();
  return withoutDuplicate ? `${withoutDuplicate}\n${line}` : line;
}

export function parseMeetingSummariesFromDescription(
  description: string | null | undefined,
): string[] {
  if (!description?.trim()) return [];
  return description
    .split("\n")
    .map((row) => parseMeetingSummaryRow(row))
    .filter((parsed): parsed is { fileName: string; summary: string } => parsed !== null)
    .filter((parsed) => !isLowQualityMeetingSummary(parsed.fileName, parsed.summary))
    .map((parsed) => formatMeetingSummaryDisplay(parsed.fileName, parsed.summary));
}

export function canReadMeetingTextClientSide(fileName: string): boolean {
  const parts = fileName.toLowerCase().split(".");
  const ext = parts.length > 1 ? (parts.pop() ?? "") : "";
  return TEXT_READABLE_EXT.has(ext);
}

export async function readMeetingTextFromFile(file: File): Promise<string | null> {
  if (!canReadMeetingTextClientSide(file.name)) return null;
  try {
    const text = await file.text();
    return text.trim() || null;
  } catch {
    return null;
  }
}

function isMeetingSectionHeader(segment: string): boolean {
  const trimmed = normalizeMeetingText(segment.trim());
  if (!trimmed) return true;
  if (trimmed.length <= 16) return true;
  if (MEETING_SECTION_HEADER_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (/^(질문|답변|안건|참석|일시|장소|역할|과제|이슈)\s*[,·/]/.test(trimmed) && trimmed.length <= 28) {
    return true;
  }
  return false;
}

function splitMeetingSegments(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?:•|·|\n+|(?<=\d)\.\s+)/)
    .map((part) => part.replace(/^\d+\.\s*/, "").trim())
    .filter((part) => part.length >= 10);
}

function scoreMeetingSegment(segment: string, fileName: string): number {
  const trimmed = normalizeMeetingText(segment.trim());
  if (!trimmed || isMeetingSectionHeader(trimmed)) return -20;

  const fileBase = meetingFileBaseName(fileName);
  if (trimmed === fileName.trim() || trimmed === fileBase) return -20;

  let score = Math.min(trimmed.length, 96) / 12;
  for (const keyword of MEETING_SUBSTANCE_KEYWORDS) {
    if (trimmed.includes(keyword)) score += 2.5;
  }
  if (/[다음하겠했었음니다]$/.test(trimmed)) score += 2;
  if (trimmed.length >= 28) score += 1.5;
  if (trimmed.length <= 20) score -= 4;
  return score;
}

function truncateMeetingSummary(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

/** 결정·역할·과제 등 핵심 구간을 골라 1~2문장 요약 (LLM·API 비용 없음) */
export function buildHeuristicMeetingSummary(
  text: string,
  fileName = "",
  maxLen = 140,
): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return "내용을 읽지 못했습니다.";

  const segments = splitMeetingSegments(normalized);
  const ranked = segments
    .map((segment, index) => ({ segment, index, score: scoreMeetingSegment(segment, fileName) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.segment.length - a.segment.length);

  const picked: string[] = [];
  for (const item of ranked) {
    if (picked.some((existing) => existing.includes(item.segment) || item.segment.includes(existing))) {
      continue;
    }
    picked.push(item.segment);
    if (picked.length >= 2) break;
  }

  if (picked.length > 0) {
    const combined = picked
      .map((segment) => segment.replace(/[.!?。]+$/, "").trim())
      .join(". ");
    const summary = truncateMeetingSummary(combined, maxLen);
    if (!isLowQualityMeetingSummary(fileName, summary)) return summary;
  }

  const sentences = normalized
    .split(/(?<=[.!?。])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 16 && !isMeetingSectionHeader(sentence));

  const rankedSentences = sentences
    .map((sentence) => ({ sentence, score: scoreMeetingSegment(sentence, fileName) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (rankedSentences.length >= 2) {
    const combined = `${rankedSentences[0].sentence} ${rankedSentences[1].sentence}`;
    const summary = truncateMeetingSummary(combined, maxLen);
    if (!isLowQualityMeetingSummary(fileName, summary)) return summary;
  }
  if (rankedSentences.length === 1) {
    const summary = truncateMeetingSummary(rankedSentences[0].sentence, maxLen);
    if (!isLowQualityMeetingSummary(fileName, summary)) return summary;
  }

  const fallback = truncateMeetingSummary(normalized, maxLen);
  return fallback || "내용을 읽지 못했습니다.";
}

/** 1~2줄 분량의 간단 요약 (LLM 없음) */
export function summarizeMeetingText(text: string, maxLen = 140): string {
  return buildHeuristicMeetingSummary(text, "", maxLen);
}
