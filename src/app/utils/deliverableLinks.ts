/** 산출물·배너 링크 — 브라우저에서 바로 열 수 있는 http(s) URL */
export function externalDeliverableHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const DELIVERABLE_LINK_LINE_PREFIX = "🔗 배포 링크: ";

/** description에 저장된 배포 URL (파일 산출물 + 링크 동시 제출) */
export function extractDeployLinkFromDescription(description?: string | null): string | null {
  if (!description) return null;
  const match = description.match(/🔗 배포 링크:\s*(https?:\/\/\S+)/i);
  return match?.[1] ?? null;
}

/** AI 요약·카드용 — 배포 링크 줄·URL 제거 후 첫 줄만 짧게 */
export function briefDeliverableDescriptionSummary(
  description?: string | null,
  maxLen = 48
): string {
  if (!description?.trim()) return "";
  let text = description.trim();
  text = text.replace(/\n*🔗 배포 링크:\s*https?:\/\/\S+/gi, "").trim();
  text = text.replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim();
  const firstLine = text.split(/\n+/).map((line) => line.trim()).find(Boolean) ?? "";
  if (!firstLine) return "";
  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen)}…` : firstLine;
}

export function isDeliverableArchiveFile(
  fileName: string,
  mimeType?: string | null,
  storagePath?: string | null
): boolean {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (["zip", "7z", "rar", "tar", "gz"].includes(ext)) return true;
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("zip") || mime === "application/x-zip-compressed" || mime.includes("7z")) {
    return true;
  }
  const base = storagePath?.split("/").filter(Boolean).pop() ?? "";
  return /\.(zip|7z)$/i.test(base);
}

export function deliverableHasDeployLink(item: {
  kind?: "file" | "link";
  publicUrl?: string;
  description?: string | null;
}): boolean {
  if (item.kind === "link") return Boolean(item.publicUrl?.trim());
  return Boolean(extractDeployLinkFromDescription(item.description));
}

export function resolveDeliverableDeployUrl(item: {
  kind?: "file" | "link";
  publicUrl?: string;
  description?: string | null;
}): string | null {
  if (item.kind === "link") {
    const href = externalDeliverableHref(item.publicUrl ?? "");
    return href || null;
  }
  const embedded = extractDeployLinkFromDescription(item.description);
  if (!embedded) return null;
  const href = externalDeliverableHref(embedded);
  return href || null;
}

/** 배너·외부 열기용 배포 링크 — Storage public_url이 아닌 사용자 URL 우선 */
export function deliverableDeployUrl(item: {
  kind?: "file" | "link";
  publicUrl: string;
  description?: string | null;
}): string | null {
  if (item.kind === "link") {
    const link = externalDeliverableHref(item.publicUrl);
    return link || null;
  }
  const fromDescription = extractDeployLinkFromDescription(item.description);
  if (fromDescription) {
    const href = externalDeliverableHref(fromDescription);
    return href || null;
  }
  return null;
}

export function deliverableLinkLabel(item: { fileName: string; publicUrl: string }): string {
  const url = externalDeliverableHref(item.publicUrl);
  if (!url) return item.fileName;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || item.fileName;
  } catch {
    return item.fileName || url;
  }
}

export function deliverableDeployLinkLabel(item: {
  fileName: string;
  kind?: "file" | "link";
  publicUrl: string;
  description?: string | null;
}): string {
  const deployUrl = deliverableDeployUrl(item);
  if (!deployUrl) return item.fileName;
  return deliverableLinkLabel({ fileName: item.fileName, publicUrl: deployUrl });
}
