/**
 * recommend-troubleshooting — 팀 상세 트러블슈팅 AI 추천
 *
 * Secret: GEMINI_API_KEY (generate-report와 동일)
 * 배포: supabase functions deploy recommend-troubleshooting
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type RecommendRequest = {
  teamId?: string;
  locale?: "ko" | "en";
  intent?: "troubleshooting" | "progress-insight";
};

type TroubleshootingLogRow = {
  id: string;
  problem: string;
  plan: string | null;
  solution: string | null;
  status: string;
  author: string;
};

type RecommendResponse = {
  problem: string;
  plan: string;
  rationale?: string;
  generated_at: string;
  model: string;
};

type ProgressInsightResponse = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  architecture_risks: string[];
  improvements: string[];
  generated_at: string;
  model: string;
  used_memory?: boolean;
  new_deliverables_analyzed?: number;
};

type DeliverableRow = {
  id: string;
  file_name: string;
  description: string | null;
  subtitle: string | null;
  mime_type: string | null;
  storage_path: string | null;
  file_size: number | null;
  public_url: string | null;
  created_at: string;
};

type AiMemoryState = {
  memory_markdown: string;
  analyzed_deliverable_ids: Set<string>;
};

type SourceSnippet = {
  file_name: string;
  excerpt: string;
};

type TeamContext = {
  team: {
    id: string;
    name: string;
    project_title: string | null;
    progress: number | null;
    course_id: string | null;
  };
  teammates: Array<{ name: string; contribution: number | null }>;
  logs: TroubleshootingLogRow[];
  deliverables: Array<{
    id: string;
    file_name: string;
    description: string | null;
    subtitle: string | null;
    mime_type: string | null;
    is_link: boolean;
    has_deploy_link: boolean;
    deploy_url: string | null;
    is_archive: boolean;
    is_new_since_memory: boolean;
  }>;
  source_snippets: SourceSnippet[];
  chat_snippets: string[];
  feedback_count: number;
  project_memory_markdown: string;
  new_deliverable_count: number;
};

const DELIVERABLES_BUCKET = "ai_team_deliverables";
const SOURCE_EXTS = /\.(ts|tsx|js|jsx|py|java|go|rs|sql|md|json|yaml|yml|html|css)$/i;
const MAX_SOURCE_BYTES = 120_000;
const MAX_ZIP_BYTES = 80_000_000;
const MAX_SNIPPET_CHARS = 3500;
const MAX_ZIP_ENTRIES_SCAN = 400;
const MAX_DELIVERABLES_FETCH = 24;
const MAX_SOURCE_SNIPPETS_PROGRESS = 8;
const MAX_SOURCE_SNIPPETS_TROUBLESHOOT = 6;
const TROUBLESHOOTING_ALWAYS_SAMPLE_LATEST_FILES = 2;
const PROGRESS_ALWAYS_SAMPLE_LATEST_FILES = 2;
const EXCLUDED_DIR_NAMES = new Set(["node_modules", ".git"]);

function normalizeArchivePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function shouldExcludeArchivePath(relativePath: string): boolean {
  const parts = normalizeArchivePath(relativePath).split("/").filter(Boolean);
  return parts.some((segment) => EXCLUDED_DIR_NAMES.has(segment));
}

function storageInnerRelativePath(storagePath: string): string | null {
  const parts = storagePath.split("/").filter(Boolean);
  if (parts.length < 4) return null;
  return parts.slice(3).join("/");
}

function storagePathBasename(storagePath: string): string {
  return storagePath.split("/").filter(Boolean).pop() ?? "";
}

function deliverableRowIsZip(row: DeliverableRow): boolean {
  const name = String(row.file_name ?? "");
  const mime = row.mime_type ? String(row.mime_type) : null;
  const storagePath = row.storage_path?.trim() ?? "";
  const innerPath = storagePath ? storageInnerRelativePath(storagePath) : null;
  return isZipDeliverable(name, mime, storagePath || null, innerPath);
}

function isZipSnippetSuccess(snippet: SourceSnippet): boolean {
  if (snippet.file_name.includes("::__inventory")) return false;
  return Boolean(snippet.excerpt.trim()) && !snippet.excerpt.startsWith("(ZIP");
}

function countUsableSourceSnippets(snippets: SourceSnippet[]): number {
  return snippets.filter((s) => isZipSnippetSuccess(s)).length;
}

function extractDeployLinkFromDescription(description: string | null | undefined): string | null {
  if (!description) return null;
  const match = description.match(/🔗 배포 링크:\s*(https?:\/\/\S+)/i);
  return match?.[1] ?? null;
}

function briefDeliverableDescription(description: string | null | undefined, maxLen = 48): string {
  if (!description?.trim()) return "";
  let text = description.trim();
  text = text.replace(/\n*🔗 배포 링크:\s*https?:\/\/\S+/gi, "").trim();
  text = text.replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim();
  const firstLine = text.split(/\n+/).map((line) => line.trim()).find(Boolean) ?? "";
  if (!firstLine) return "";
  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen)}…` : firstLine;
}

function deliverableHasDeployLink(row: DeliverableRow, isLink: boolean): boolean {
  if (isLink) return true;
  return Boolean(extractDeployLinkFromDescription(row.description));
}

function archivePathPriority(path: string): number {
  const lower = path.toLowerCase();
  if (isReadmePath(path)) return 0;
  if (isPackageJsonPath(path)) return 1;
  if (/\.(tsx|ts|jsx|js)$/.test(lower)) return 2;
  if (/\.(py|go|rs|sql|md)$/.test(lower)) return 3;
  return 4;
}

function snippetInnerPath(fileName: string): string {
  const idx = fileName.indexOf("::");
  return idx >= 0 ? fileName.slice(idx + 2) : fileName;
}

function isReadmePath(path: string): boolean {
  const base = (path.split("/").pop() ?? path).toLowerCase();
  return /^readme(\.(md|txt|rst|markdown))?$/i.test(base);
}

function isPackageJsonPath(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  return /^package\.json$/i.test(base);
}

type ZipEntryInventory = {
  readmePaths: string[];
  packageJsonPaths: string[];
  hasTests: boolean;
  codeFileCount: number;
  totalEligible: number;
};

function buildZipEntryInventory(entryPaths: string[]): ZipEntryInventory {
  const readmePaths = entryPaths.filter(isReadmePath);
  const packageJsonPaths = entryPaths.filter(isPackageJsonPath);
  const codeFileCount = entryPaths.filter((p) =>
    /\.(tsx?|jsx?|py|go|rs|sql)$/i.test(p)
  ).length;
  return {
    readmePaths,
    packageJsonPaths,
    hasTests: entryPaths.some((p) => /(^|\/)(test|tests|__tests__|spec)\//i.test(p) || /\.(test|spec)\./i.test(p)),
    codeFileCount,
    totalEligible: entryPaths.length,
  };
}

/** README·package.json은 샘플 한도 안에서 항상 본문을 읽도록 예약 */
function selectZipPathsForSampling(entryPaths: string[], maxRead: number): string[] {
  if (entryPaths.length === 0) return [];

  const readme = entryPaths.filter(isReadmePath);
  const pkg = entryPaths.filter(isPackageJsonPath);
  const rest = entryPaths
    .filter((p) => !isReadmePath(p) && !isPackageJsonPath(p))
    .sort((a, b) => archivePathPriority(a) - archivePathPriority(b) || a.localeCompare(b));

  const selected: string[] = [];
  const add = (p: string) => {
    if (selected.length >= maxRead) return;
    if (!selected.includes(p)) selected.push(p);
  };

  for (const p of readme.slice(0, 1)) add(p);
  for (const p of pkg.slice(0, 1)) add(p);
  for (const p of rest) add(p);

  return selected;
}

function suggestsMissingReadme(line: string): boolean {
  return /readme.*(없|부재|미작|미비|추가|작성|정리|제출)|실행\s*가이드.*없|실행\s*방법.*(없|정리하세요)|온보딩.*없/i.test(
    line
  );
}

function suggestsMissingTests(line: string): boolean {
  return /테스트.*(없|부재|추가|작성)|test.*missing/i.test(line);
}

/** 표시명·MIME·Storage 경로(마지막 세그먼트)로 ZIP 여부 판별 */
function isZipDeliverable(
  name: string,
  mime: string | null,
  storagePath?: string | null,
  innerPath?: string | null
): boolean {
  if (/\.(zip|7z)$/i.test(name)) return true;
  if (innerPath && /\.(zip|7z)$/i.test(innerPath)) return true;
  const mimeLower = (mime ?? "").toLowerCase();
  if (mimeLower && /zip|x-zip-compressed|7z/.test(mimeLower)) return true;
  const base = storagePath ? storagePathBasename(storagePath) : "";
  if (/\.(zip|7z)$/i.test(base)) return true;
  return false;
}

function parseAnalyzedDeliverableIds(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((id): id is string => typeof id === "string" && id.trim()).map((id) => id.trim()));
}

async function loadTeamAiMemory(
  supabase: ReturnType<typeof createClient>,
  teamId: string
): Promise<AiMemoryState> {
  const { data, error } = await supabase
    .from("ai_team_detail_ai_memory")
    .select("memory_markdown, analyzed_deliverable_ids")
    .eq("team_id", teamId)
    .maybeSingle();

  if (error && !isMissingRelationError(error)) throw error;

  return {
    memory_markdown: data?.memory_markdown ? String(data.memory_markdown) : "",
    analyzed_deliverable_ids: parseAnalyzedDeliverableIds(data?.analyzed_deliverable_ids),
  };
}

function buildMemoryMarkdown(teamName: string, insight: ProgressInsightResponse): string {
  const lines = [
    `# ${teamName} — AI 프로젝트 상태 기억`,
    `업데이트: ${insight.generated_at}`,
    "",
    "## 요약",
    insight.summary,
    "",
  ];
  const section = (title: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push(`## ${title}`);
    for (const item of items) lines.push(`- ${item}`);
    lines.push("");
  };
  section("강점", insight.strengths);
  section("보완", insight.gaps);
  section("다음 할 일", insight.next_steps);
  section("아키텍처 리스크", insight.architecture_risks);
  section("개선", insight.improvements);
  return lines.join("\n").trim();
}

async function saveTeamAiMemory(
  supabase: ReturnType<typeof createClient>,
  teamId: string,
  memoryMarkdown: string,
  analyzedIds: Set<string>,
  lastSummary: string
): Promise<void> {
  const { error } = await supabase.from("ai_team_detail_ai_memory").upsert(
    {
      team_id: teamId,
      memory_markdown: memoryMarkdown,
      analyzed_deliverable_ids: Array.from(analyzedIds),
      last_insight_summary: lastSummary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_id" }
  );
  if (error && !isMissingRelationError(error)) throw error;
}

function sortDeliverablesForSampling(rows: DeliverableRow[], analyzedIds: Set<string>): DeliverableRow[] {
  return [...rows].sort((a, b) => {
    const aNew = !analyzedIds.has(a.id);
    const bNew = !analyzedIds.has(b.id);
    if (aNew !== bNew) return aNew ? -1 : 1;
    const aZip = deliverableRowIsZip(a);
    const bZip = deliverableRowIsZip(b);
    if (aZip !== bZip) return aZip ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function stripSentenceEnding(text: string): string {
  return text.replace(/[.!?。…]+\s*$/u, "").trim();
}

const STACK_TOPIC_RE =
  /react|typescript|vite|supabase|firebase|next\.?js|스택으로|기반으로|진입 파일/i;

function isDuplicateInsightLine(line: string, summary: string): boolean {
  const text = line.trim();
  if (!text || text.length < 8) return false;
  if (summary.includes(text)) return true;
  const probe = text.slice(0, Math.min(40, text.length));
  if (probe.length >= 10 && summary.includes(probe)) return true;
  if (STACK_TOPIC_RE.test(text) && STACK_TOPIC_RE.test(summary)) return true;
  if (/스택으로 보이|기반으로 보이|업로드된 소스 기준/.test(text) && STACK_TOPIC_RE.test(summary)) {
    return true;
  }
  if (/배포·데모 URL|데모 URL/.test(text) && /배포|데모|URL/.test(summary)) return true;
  return false;
}

function normalizeProgressInsightForDisplay(
  insight: ProgressInsightResponse,
  signals?: Pick<SourceCodeSignals, "hasReadme" | "hasTests" | "hasPackageJson">
): ProgressInsightResponse {
  let summary = insight.summary.trim();
  summary = summary
    .replace(/입니다\.입니다/g, "입니다.")
    .replace(/습니다\.입니다/g, "습니다.")
    .replace(/하세요\.을\(를\) 권장합니다/g, "하세요.")
    .replace(/하세요\.을\(를\) 권장합니다\./g, "하세요.");
  if (signals?.hasReadme && suggestsMissingReadme(summary)) {
    summary = summary
      .replace(/readme[^.]*?(없|부재|미비)[^.]*\.?/gi, "")
      .replace(/실행\s*가이드[^.]*?(없|부재)[^.]*\.?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  const cappedSummary = summary.length > 240 ? `${summary.slice(0, 237)}…` : summary;

  const filterAdvice = (items: string[], max: number) =>
    items
      .map((s) => s.trim())
      .filter((s) => {
        if (!s || isDuplicateInsightLine(s, cappedSummary)) return false;
        if (signals?.hasReadme && suggestsMissingReadme(s)) return false;
        if (signals?.hasTests && suggestsMissingTests(s)) return false;
        return true;
      })
      .slice(0, max);

  return {
    ...insight,
    summary: cappedSummary,
    strengths: [],
    gaps: filterAdvice(insight.gaps, 2),
    next_steps: filterAdvice(insight.next_steps, 2),
    architecture_risks: filterAdvice(insight.architecture_risks, 1),
    improvements: filterAdvice(insight.improvements, 1),
  };
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  return error?.code === "42P01" || (error?.message?.includes("does not exist") ?? false);
}

function isDeliverableLinkRow(row: DeliverableRow): boolean {
  const mime = row.mime_type ? String(row.mime_type) : null;
  const fileName = String(row.file_name ?? "");
  return (
    mime === "text/uri-list" ||
    mime === "text/url" ||
    /^https?:\/\//i.test(fileName) ||
    fileName.startsWith("http") ||
    (row.storage_path ?? "").startsWith("link://")
  );
}

async function gatherTeamContext(
  supabase: ReturnType<typeof createClient>,
  teamId: string,
  options?: {
    maxSourceSnippets?: number;
    incrementalSourceOnly?: boolean;
    /** 트러블슈팅 추천: 최신 산출물 N건은 분석 이력과 무관하게 ZIP/소스 재조회 */
    alwaysSampleLatestFileCount?: number;
  }
): Promise<TeamContext & { deliverable_rows: DeliverableRow[]; memory: AiMemoryState; processed_deliverable_ids: string[] }> {
  const { data: team, error: teamError } = await supabase
    .from("ai_teams")
    .select("id, name, project_title, progress, course_id")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError) throw teamError;
  if (!team) {
    const notFound = new Error("팀을 찾을 수 없습니다.");
    (notFound as Error & { status?: number }).status = 404;
    throw notFound;
  }

  const memory = await loadTeamAiMemory(supabase, teamId);
  const maxSnippets = options?.maxSourceSnippets ?? MAX_SOURCE_SNIPPETS_TROUBLESHOOT;
  const incrementalSourceOnly = options?.incrementalSourceOnly ?? true;

  const [logsResult, deliverablesResult, chatResult, teammatesResult, feedbackResult] =
    await Promise.all([
      supabase
        .from("ai_team_detail_troubleshooting_logs")
        .select("id, problem, plan, solution, status, author")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("ai_team_deliverables")
        .select(
          "id, file_name, description, subtitle, mime_type, storage_path, file_size, public_url, created_at"
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(MAX_DELIVERABLES_FETCH),
      supabase
        .from("ai_team_detail_chat_messages")
        .select("text, sender")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: false })
        .limit(12),
      supabase
        .from("ai_team_detail_teammates")
        .select("name, contribution")
        .eq("team_id", teamId),
      supabase
        .from("ai_team_detail_feedbacks")
        .select("id")
        .eq("team_id", teamId),
    ]);

  if (logsResult.error && !isMissingRelationError(logsResult.error)) throw logsResult.error;
  if (deliverablesResult.error && !isMissingRelationError(deliverablesResult.error)) {
    throw deliverablesResult.error;
  }
  if (chatResult.error && !isMissingRelationError(chatResult.error)) throw chatResult.error;
  if (teammatesResult.error && !isMissingRelationError(teammatesResult.error)) {
    throw teammatesResult.error;
  }
  if (feedbackResult.error && !isMissingRelationError(feedbackResult.error)) {
    throw feedbackResult.error;
  }

  const chatRows = (chatResult.data ?? []) as Array<{ text: string; sender: string }>;
  const chat_snippets = chatRows
    .map((m) => truncateText(`${m.sender}: ${m.text}`, 100))
    .filter(Boolean)
    .reverse();

  const deliverableRows = (deliverablesResult.data ?? []) as DeliverableRow[];
  const sortedForSampling = sortDeliverablesForSampling(deliverableRows, memory.analyzed_deliverable_ids);
  const hasPriorAnalysis = memory.analyzed_deliverable_ids.size > 0;
  const incrementalRows =
    incrementalSourceOnly && hasPriorAnalysis
      ? sortedForSampling.filter((row) => !memory.analyzed_deliverable_ids.has(row.id))
      : sortedForSampling;

  const latestFileCount = options?.alwaysSampleLatestFileCount ?? 0;
  const latestFileRows =
    latestFileCount > 0
      ? sortedForSampling.filter((row) => !isDeliverableLinkRow(row)).slice(0, latestFileCount)
      : [];

  /** 최신 ZIP은 분석 이력과 무관하게 항상 다시 해제·스캔 */
  const latestArchiveRows = deliverableRows
    .filter((row) => !isDeliverableLinkRow(row) && deliverableRowIsZip(row))
    .slice(0, 2);

  const rowsById = new Map<string, DeliverableRow>();
  for (const row of [...latestArchiveRows, ...latestFileRows, ...incrementalRows]) {
    rowsById.set(row.id, row);
  }
  const rowsToSample = sortDeliverablesForSampling([...rowsById.values()], memory.analyzed_deliverable_ids);

  const { snippets: source_snippets, processedDeliverableIds } = await sampleDeliverableSourceSnippets(
    supabase,
    rowsToSample,
    maxSnippets
  );

  const newDeliverableCount = deliverableRows.filter(
    (row) => !memory.analyzed_deliverable_ids.has(row.id)
  ).length;

  return {
    team: {
      id: team.id,
      name: team.name ?? teamId,
      project_title: team.project_title ?? null,
      progress: typeof team.progress === "number" ? team.progress : null,
      course_id: team.course_id ?? null,
    },
    teammates: (teammatesResult.data ?? []).map((t) => ({
      name: String(t.name ?? ""),
      contribution: typeof t.contribution === "number" ? t.contribution : null,
    })),
    logs: (logsResult.data ?? []) as TroubleshootingLogRow[],
    deliverables: deliverableRows.slice(0, 12).map((d) => {
      const fileName = String(d.file_name ?? "");
      const mime = d.mime_type ? String(d.mime_type) : null;
      const storagePath = d.storage_path?.trim() ?? "";
      const innerPath = storagePath ? storageInnerRelativePath(storagePath) : null;
      const isLink = isDeliverableLinkRow(d);
      const deployUrl = isLink
        ? (d.public_url ? String(d.public_url) : null)
        : extractDeployLinkFromDescription(d.description);
      return {
        id: d.id,
        file_name: fileName,
        description: d.description ? String(d.description) : null,
        subtitle: d.subtitle ? String(d.subtitle) : null,
        mime_type: mime,
        is_link: isLink,
        has_deploy_link: deliverableHasDeployLink(d, isLink),
        deploy_url: deployUrl,
        is_archive: isZipDeliverable(fileName, mime, storagePath || null, innerPath),
        is_new_since_memory: !memory.analyzed_deliverable_ids.has(d.id),
      };
    }),
    source_snippets,
    chat_snippets,
    feedback_count: (feedbackResult.data ?? []).length,
    project_memory_markdown: memory.memory_markdown,
    new_deliverable_count: newDeliverableCount,
    deliverable_rows: deliverableRows,
    memory,
    processed_deliverable_ids: processedDeliverableIds,
  };
}

async function extractZipSourceSnippets(
  supabase: ReturnType<typeof createClient>,
  path: string,
  zipLabel: string,
  size: number,
  maxSnippetsPerArchive = 8
): Promise<SourceSnippet[]> {
  if (size > MAX_ZIP_BYTES) {
    return [
      {
        file_name: zipLabel,
        excerpt: `(ZIP ${Math.round(size / (1024 * 1024))}MB — 크기 제한으로 내부 파일 미수집)`,
      },
    ];
  }

  const { data, error } = await supabase.storage.from(DELIVERABLES_BUCKET).download(path);
  if (error || !data) {
    const msg = error?.message ? truncateText(error.message, 80) : "객체 없음";
    console.error("[recommend-troubleshooting] zip download failed", path, msg);
    return [
      {
        file_name: zipLabel,
        excerpt: `(ZIP Storage 다운로드 실패: ${msg})`,
      },
    ];
  }

  try {
    const JSZip = (await import("npm:jszip@3.10.1")).default;
    const zip = await JSZip.loadAsync(await data.arrayBuffer());
    const allEligible = Object.keys(zip.files)
      .filter((entryPath) => {
        const entry = zip.files[entryPath];
        if (!entry || entry.dir) return false;
        if (shouldExcludeArchivePath(entryPath)) return false;
        return SOURCE_EXTS.test(entryPath);
      })
      .sort((a, b) => archivePathPriority(a) - archivePathPriority(b) || a.localeCompare(b));

    const inventory = buildZipEntryInventory(allEligible);
    const pathsToRead = selectZipPathsForSampling(
      allEligible.slice(0, MAX_ZIP_ENTRIES_SCAN),
      maxSnippetsPerArchive
    );

    const snippets: SourceSnippet[] = [];
    if (inventory.readmePaths.length > 0 || inventory.packageJsonPaths.length > 0) {
      snippets.push({
        file_name: `${zipLabel}::__inventory`,
        excerpt: truncateText(
          `ZIP 인벤토리(전체 ${inventory.totalEligible}개 파일): README=${inventory.readmePaths.join(", ") || "없음"}; package.json=${inventory.packageJsonPaths.join(", ") || "없음"}; 테스트=${inventory.hasTests ? "있음" : "없음"}; 코드파일≈${inventory.codeFileCount}`,
          400
        ),
      });
    }

    for (const entryPath of pathsToRead) {
      const entry = zip.files[entryPath];
      if (!entry) continue;
      try {
        const text = (await entry.async("string")).trim();
        if (!text) continue;
        snippets.push({
          file_name: `${zipLabel}::${entryPath}`,
          excerpt: truncateText(text, MAX_SNIPPET_CHARS),
        });
      } catch {
        // skip binary inside zip
      }
    }

    const contentSnippets = snippets.filter((s) => !s.file_name.includes("::__inventory"));
    if (contentSnippets.length === 0) {
      return [
        {
          file_name: zipLabel,
          excerpt: `(ZIP 내부에서 읽을 수 있는 소스 파일(${allEligible.length > 0 ? "0" : "없음"})을 찾지 못했습니다)`,
        },
      ];
    }

    return snippets;
  } catch (zipErr) {
    const msg = zipErr instanceof Error ? truncateText(zipErr.message, 80) : "알 수 없음";
    console.error("[recommend-troubleshooting] zip parse failed", path, msg);
    return [
      {
        file_name: zipLabel,
        excerpt: `(ZIP 파일을 열 수 없습니다: ${msg})`,
      },
    ];
  }
}

async function sampleDeliverableSourceSnippets(
  supabase: ReturnType<typeof createClient>,
  rows: DeliverableRow[],
  maxSnippets: number
): Promise<{ snippets: SourceSnippet[]; processedDeliverableIds: string[] }> {
  const snippets: SourceSnippet[] = [];
  const processedDeliverableIds: string[] = [];

  for (const row of rows) {
    if (snippets.length >= maxSnippets) break;
    const path = row.storage_path?.trim() ?? "";
    if (!path || path.startsWith("link://")) continue;

    const name = String(row.file_name ?? "");
    const mime = row.mime_type ? String(row.mime_type) : null;
    const innerPath = storageInnerRelativePath(path);
    const sourcePath = innerPath ?? name;
    const size = Number(row.file_size ?? 0);

    if (deliverableRowIsZip(row)) {
      const zipSnippets = await extractZipSourceSnippets(supabase, path, name, size);
      if (zipSnippets.some(isZipSnippetSuccess)) {
        processedDeliverableIds.push(row.id);
      }
      for (const snippet of zipSnippets) {
        if (snippets.length >= maxSnippets) break;
        snippets.push(snippet);
      }
      continue;
    }

    if (!SOURCE_EXTS.test(sourcePath)) continue;

    if (size > MAX_SOURCE_BYTES) {
      snippets.push({
        file_name: innerPath ? `${name}::${innerPath}` : name,
        excerpt: `(파일 ${Math.round(size / 1024)}KB — 전문 미수집, 파일명·확장자만 참고)`,
      });
      continue;
    }

    try {
      const { data, error } = await supabase.storage.from(DELIVERABLES_BUCKET).download(path);
      if (error || !data) continue;
      const text = await data.text();
      const trimmed = text.trim();
      if (!trimmed) continue;
      snippets.push({
        file_name: innerPath ? `${name}::${innerPath}` : name,
        excerpt: truncateText(trimmed, MAX_SNIPPET_CHARS),
      });
      processedDeliverableIds.push(row.id);
    } catch {
      // skip unreadable binary
    }
  }

  return { snippets, processedDeliverableIds };
}

function parseInsightStringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is string => typeof s === "string" && s.trim())
    .map((s) => truncateText(s.trim(), 160))
    .slice(0, max);
}

function buildDraftRecommendation(context: TeamContext): RecommendResponse {
  const open = context.logs.filter((l) => l.status === "in-progress");
  const resolved = context.logs.filter((l) => l.status === "resolved");
  const progress = context.team.progress ?? 0;
  const deliverableCount = context.deliverables.length;
  const sampled = context.source_snippets.length;
  const latestDeliverable = context.deliverables.find((d) => !d.is_link);

  if (sampled > 0 && latestDeliverable) {
    const hint = context.source_snippets[0]?.file_name ?? latestDeliverable.file_name;
    return {
      problem: `최근 산출물(${latestDeliverable.file_name}) 코드·구조를 보며 ${truncateText(hint, 50)} 관련 이슈를 점검하세요.`,
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (deliverableCount === 0 && context.project_memory_markdown) {
    return {
      problem: "기억된 프로젝트 상태는 있으나 새 산출물이 없어 실행·배포 환경을 다시 확인하세요.",
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (open.length > 0) {
    const latest = open[open.length - 1];
    return {
      problem: `진행 중 이슈 점검 필요: ${truncateText(latest.problem, 100)}`,
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (deliverableCount === 0 && progress < 60) {
    return {
      problem: "역할·일정·산출물이 불명확해 마감 지연 위험이 있습니다.",
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (resolved.length > 0 && open.length === 0) {
    const last = resolved[resolved.length - 1];
    return {
      problem: `최근 해결 이슈「${truncateText(last.problem, 70)}」의 재발·회고 누락 가능성`,
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (context.chat_snippets.length > 0) {
    return {
      problem: "채팅에만 남은 막힌 지점이 트러블슈팅으로 정리되지 않았을 수 있습니다.",
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  return {
    problem: "통합·배포·데모 전 환경·데이터 불일치로 런타임 오류가 날 수 있습니다.",
    plan: "",
    generated_at: new Date().toISOString(),
    model: "draft-db-only",
  };
}

function buildLlmPayload(context: TeamContext) {
  return {
    team: context.team,
    teammates: context.teammates,
    troubleshooting_logs: context.logs.map((l) => ({
      status: l.status,
      problem: truncateText(l.problem, 200),
      plan: l.plan ? truncateText(l.plan, 150) : null,
      solution: l.solution ? truncateText(l.solution, 150) : null,
      author: l.author,
    })),
    deliverables: context.deliverables.map((d) => ({
      id: d.id,
      name: d.file_name,
      subtitle: d.subtitle ? truncateText(d.subtitle, 80) : null,
      kind: d.is_link ? "link" : "file",
      description: d.description ? briefDeliverableDescription(d.description, 72) || null : null,
      deploy_url: d.deploy_url ? truncateText(d.deploy_url, 120) : null,
      has_deploy_link: d.has_deploy_link,
      is_archive: d.is_archive,
      is_new_since_last_ai_run: d.is_new_since_memory,
    })),
    recent_chat: context.chat_snippets.slice(-8),
    source_code_samples: context.source_snippets.filter((s) => !s.file_name.includes("::__inventory")),
    zip_inventory_notes: context.source_snippets
      .filter((s) => s.file_name.includes("::__inventory"))
      .map((s) => s.excerpt),
    feedback_submission_count: context.feedback_count,
    project_memory_markdown: context.project_memory_markdown
      ? truncateText(context.project_memory_markdown, 6000)
      : null,
    new_deliverables_since_memory: context.new_deliverable_count,
    analysis_note:
      context.new_deliverable_count > 0
        ? "source_code_samples are from NEW uploads only; merge with project_memory_markdown."
        : context.project_memory_markdown
          ? "No new file uploads; update assessment from memory, logs, and chat."
          : "First analysis run.",
  };
}

function buildTroubleshootingSystemPrompt(locale: "ko" | "en"): string {
  const lang = locale === "en" ? "English" : "Korean";
  return `You help university team projects pick the next troubleshooting topic to investigate. Input includes:
- deliverables: board posts (title, subtitle, description) for the project workspace
- source_code_samples: excerpts from the latest project ZIP/uploads (paths like "bundle.zip::src/App.tsx")
- project_memory_markdown: saved summary of prior AI project-state review
- troubleshooting_logs, recent_chat

Respond in ${lang}. Return JSON only: problem (string, max 140 chars), rationale (optional, max 100 chars). Do NOT include plan/solution steps.

Rules:
- Base the recommendation on CURRENT project deliverables and source_code_samples when present—not only old logs.
- If source_code_samples shows API/routing/state/deploy issues, suggest a concrete problem aligned with that code.
- If deliverables exist but source_code_samples is empty, say code review is limited and point to missing upload types (e.g. zip with .ts/.py).
- Use project_memory_markdown for context but prefer evidence from latest source_code_samples for "what to debug now".
- Suggest ONE new problem situation (not already fully resolved in logs). Do not copy log text verbatim.`;
}

type SourceCodeSignals = {
  stackHints: string[];
  hasReadme: boolean;
  hasTests: boolean;
  hasPackageJson: boolean;
  hasApiLayer: boolean;
  hasUiLayer: boolean;
  hasDbOrSupabase: boolean;
  hasEnvConfig: boolean;
  hasTodoMarkers: boolean;
  entryFiles: string[];
  sampledPaths: string[];
};

function analyzeSourceCodeSignals(snippets: SourceSnippet[]): SourceCodeSignals {
  const usable = snippets.filter(isZipSnippetSuccess);
  const innerPaths = usable.map((s) => snippetInnerPath(s.file_name));
  const pathsLower = innerPaths.map((p) => p.toLowerCase());
  const inventoryLine = snippets.find((s) => s.file_name.includes("::__inventory"))?.excerpt ?? "";
  const inventoryHasReadme = /README=(?!없음)/i.test(inventoryLine);
  const blob = usable.map((s) => `${s.file_name}\n${s.excerpt}`).join("\n").toLowerCase();

  const stackHints = new Set<string>();
  if (pathsLower.some((p) => /\.tsx?$/.test(p)) || blob.includes("react")) stackHints.add("React/TypeScript");
  if (blob.includes("next/") || pathsLower.some((p) => p.includes("next.config"))) stackHints.add("Next.js");
  if (blob.includes("vite") || pathsLower.some((p) => p.includes("vite.config"))) stackHints.add("Vite");
  if (pathsLower.some((p) => /\.py$/.test(p)) || blob.includes("fastapi") || blob.includes("django")) {
    stackHints.add("Python");
  }
  if (blob.includes("supabase") || blob.includes("createclient")) stackHints.add("Supabase");
  if (blob.includes("firebase")) stackHints.add("Firebase");

  const entryFiles = innerPaths.filter((p) =>
    /(?:^|\/)(main|index|app)\.(tsx?|jsx?)$|(?:^|\/)app\/(page|layout)\.tsx$/i.test(p)
  );

  const hasReadmeFromPaths = innerPaths.some(isReadmePath);
  const hasReadmeFromContent = usable.some(
    (s) => isReadmePath(s.file_name) && /npm\s+(run|install)|yarn|pnpm|getting\s+started|실행\s*방법|환경\s*변수/i.test(s.excerpt)
  );

  return {
    stackHints: [...stackHints],
    hasReadme: inventoryHasReadme || hasReadmeFromPaths || hasReadmeFromContent,
    hasTests:
      innerPaths.some((p) => /(^|\/)(test|tests|__tests__|spec)\//i.test(p) || /\.(test|spec)\./i.test(p)) ||
      /테스트=있음/i.test(inventoryLine),
    hasPackageJson: innerPaths.some(isPackageJsonPath) || /package\.json=/.test(inventoryLine),
    hasApiLayer: innerPaths.some((p) => /api|route|controller|server|functions/.test(p)),
    hasUiLayer: innerPaths.some((p) => /component|pages|views|screen/.test(p)),
    hasDbOrSupabase: blob.includes("supabase") || innerPaths.some((p) => /migration|schema|sql/.test(p)),
    hasEnvConfig: blob.includes("process.env") || innerPaths.some((p) => p.includes(".env")),
    hasTodoMarkers: /\b(todo|fixme|hack|xxx)\b/i.test(blob),
    entryFiles: entryFiles.slice(0, 3),
    sampledPaths: innerPaths.slice(0, 6),
  };
}

function isLowQualityProgressInsight(insight: Pick<ProgressInsightResponse, "summary" | "strengths">): boolean {
  const summary = insight.summary.trim();
  if (!summary) return true;

  const hasTechnicalSignal =
    /(react|next|vite|supabase|typescript|python|readme|api|컴포넌트|구조|스택|migration|route)/i.test(
      summary
    );

  const countOnlySummary =
    /^(팀 활동 요약:|산출물 \d+건)/.test(summary) &&
    (/소스 샘플 \d+건/.test(summary) || /트러블슈팅 해결 \d+건/.test(summary)) &&
    summary.length < 200 &&
    !hasTechnicalSignal;

  const strengthsOnlyCounts =
    insight.strengths.length > 0 &&
    insight.strengths.every(
      (s) =>
        /(\d+건|제출됨|분석됨|샘플|읽음)/.test(s) &&
        s.length < 56 &&
        !/(react|next|vite|supabase|readme|api|ui|테스트|zip|스택)/i.test(s)
    );

  return countOnlySummary || (strengthsOnlyCounts && insight.strengths.length <= 3);
}

/** ZIP/소스 스니펫·산출물 메타를 해석해 유의미한 진행 요약 생성 (Gemini 미사용 시) */
function buildHeuristicProgressInsight(context: TeamContext): ProgressInsightResponse {
  const deliverableCount = context.deliverables.length;
  const fileDeliverables = context.deliverables.filter((d) => !d.is_link);
  const deployLinkDeliverables = context.deliverables.filter((d) => d.has_deploy_link);
  const latestFile = fileDeliverables[0];
  const latestBriefDesc = briefDeliverableDescription(latestFile?.description, 48);
  const latestSub = latestFile?.subtitle?.trim() ?? "";
  const hasArchiveUpload = fileDeliverables.some((d) => d.is_archive);
  const projectLabel = context.team.project_title?.trim() || latestFile?.file_name || context.team.name;
  const progressPct = context.team.progress ?? null;

  const resolved = context.logs.filter((l) => l.status === "resolved");
  const open = context.logs.filter((l) => l.status !== "resolved");
  const signals = analyzeSourceCodeSignals(context.source_snippets);
  const hasSource = context.source_snippets.some(isZipSnippetSuccess);

  const strengths: string[] = [];
  const gaps: string[] = [];
  const next_steps: string[] = [];
  const architecture_risks: string[] = [];
  const improvements: string[] = [];

  if (!hasSource && latestFile) {
    strengths.push(
      `「${latestFile.file_name}」 산출물이 등록되어${latestSub ? ` 부제「${truncateText(latestSub, 40)}」` : ""} 프로젝트 방향이 문서화되기 시작했습니다.`
    );
  }

  if (resolved.length > 0) {
    strengths.push(`트러블슈팅 ${resolved.length}건 해결 기록이 있습니다.`);
  }

  if (!hasSource && hasArchiveUpload) {
    gaps.push(
      "프로젝트 ZIP은 올라왔으나 .ts·.tsx 등 읽을 수 있는 소스가 추출되지 않았습니다. ZIP에 src·package.json이 포함됐는지 확인하세요."
    );
  } else if (!hasSource && fileDeliverables.length > 0) {
    gaps.push("산출물은 있으나 읽을 수 있는 소스(.ts·.tsx·.py·.md 등)가 확인되지 않았습니다.");
  }
  if (deliverableCount === 0) gaps.push("산출물 게시판이 비어 있어 현재 구현 상태를 외부에서 검증하기 어렵습니다.");
  if (!signals.hasReadme && hasSource) {
    gaps.push("README·실행 가이드가 없어 팀원·교수가 로컬 실행·검증하기 어렵습니다.");
  } else if (signals.hasReadme && hasSource) {
    const readmePath = signals.sampledPaths.find(isReadmePath);
    if (readmePath) {
      strengths.push(`README(${readmePath.split("/").pop()})가 포함되어 실행·온보딩 문서가 있습니다.`);
    }
  }
  if (!signals.hasTests && hasSource) gaps.push("테스트 코드가 보이지 않아 리팩터·통합 시 회귀 위험이 큽니다.");
  if (open.length > 0) {
    gaps.push(
      `진행 중 트러블슈팅 ${open.length}건(예: ${truncateText(open[0].problem, 36)})이 남아 핵심 블로커가 해소되지 않았습니다.`
    );
  } else if (context.logs.length === 0) {
    gaps.push("트러블슈팅 로그가 없어 디버깅·의사결정 과정이 추적되지 않습니다.");
  }
  if (signals.hasTodoMarkers) gaps.push("소스에 TODO/FIXME가 남아 있어 미완 기능·임시 처리 구간이 있습니다.");
  if (context.feedback_count === 0) gaps.push("팀 피드백 제출이 없어 협업·역할 분담에 대한 기록이 부족합니다.");

  if (!signals.hasEnvConfig && hasSource && signals.hasDbOrSupabase) {
    architecture_risks.push("환경 변수·설정 분리 흔적이 약해 배포 환경에서 키/URL 불일치가 날 수 있습니다.");
  }
  if (hasSource && !signals.hasApiLayer && signals.hasUiLayer) {
    architecture_risks.push("UI 코드는 많으나 API/데이터 계층이 드러나지 않아 상태·데이터 흐름이 한곳에 몰릴 수 있습니다.");
  }
  if (hasSource && signals.hasApiLayer && !signals.hasUiLayer) {
    architecture_risks.push("서버·API 중심 구조로 보이며, 사용자 시나리오 검증용 화면·문서가 부족할 수 있습니다.");
  }

  if (!signals.hasReadme && hasSource) next_steps.push("README에 실행 방법, 환경 변수, 데모 URL을 정리하세요.");
  if (!signals.hasTests && hasSource) next_steps.push("핵심 유스케이스 1~2개에 대한 스모크 테스트를 추가하세요.");
  if (open.length > 0) next_steps.push("진행 중 트러블슈팅을 해결·회고까지 마무리하고 산출물/README에 반영하세요.");
  if (deployLinkDeliverables.length === 0 && hasSource) {
    next_steps.push("스테이징·데모 URL을 링크 산출물 또는 설명란 배포 링크로 등록하세요.");
  }
  if (deliverableCount === 0) next_steps.push("중간 결과물(소스 ZIP + 발표 초안 + 데모 링크)을 게시판에 올리세요.");

  if (signals.hasTodoMarkers) improvements.push("TODO 구간을 이슈·트러블슈팅 로그로 분리해 추적 가능하게 만드세요.");
  if (resolved.length > 0) improvements.push("해결한 트러블슈팅을 README·회고에 연결해 학습 기록을 남기세요.");
  if (hasSource && !signals.hasReadme) {
    improvements.push("폴더 구조·레이어(components / api / lib)를 README 다이어그램으로 설명하세요.");
  } else if (hasSource && signals.hasReadme) {
    improvements.push("README에 환경 변수·데모 URL·배포 절차가 빠져 있으면 보완하세요.");
  }

  const summaryParts: string[] = [];
  if (hasSource && signals.stackHints.length > 0) {
    const layer =
      signals.hasUiLayer && signals.hasApiLayer
        ? "화면·API"
        : signals.hasUiLayer
          ? "화면"
          : signals.hasApiLayer
            ? "API"
            : "코어";
    summaryParts.push(
      `「${projectLabel}」은 ${signals.stackHints.join(", ")} 기반 ${layer} 구조가 확인됩니다.`
    );
    if (deployLinkDeliverables.length > 0) {
      const host = (() => {
        const url = deployLinkDeliverables[0]?.deploy_url ?? "";
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return "데모";
        }
      })();
      summaryParts.push(`배포 URL(${host})로 동작 확인이 가능합니다.`);
    }
  } else if (latestFile) {
    const titlePart = latestSub
      ? `「${latestFile.file_name}」(${truncateText(latestSub, 40)})`
      : `「${latestFile.file_name}」`;
    summaryParts.push(
      `「${projectLabel}」은 최근 산출물 ${titlePart}${latestBriefDesc ? ` — ${latestBriefDesc}` : ""} 중심으로 진행 중입니다.`
    );
  } else {
    summaryParts.push(`「${projectLabel}」 산출물·기록이 부족해 진행 파악이 제한됩니다.`);
  }

  if (progressPct != null) {
    summaryParts.push(`진행률 약 ${progressPct}%.`);
  }

  const topGap = gaps[0];
  if (topGap) {
    const gapCore = stripSentenceEnding(truncateText(topGap.replace(/^\d+\.\s*/, ""), 72));
    summaryParts.push(`보완: ${gapCore}.`);
  }

  return {
    summary: truncateText(summaryParts.join(" "), 260),
    strengths: strengths.slice(0, 2),
    gaps: gaps.slice(0, 3),
    next_steps: next_steps.slice(0, 3),
    architecture_risks: architecture_risks.slice(0, 2),
    improvements: improvements.slice(0, 2),
    generated_at: new Date().toISOString(),
    model: "heuristic-insight",
  };
}

function buildProgressInsightSystemPrompt(locale: "ko" | "en"): string {
  const lang = locale === "en" ? "English" : "Korean";
  return `You are a staff engineer mentoring a university team. Review their project workspace like a Cursor agent.

Input: deliverable board posts, troubleshooting_logs, recent_chat, project_memory_markdown, source_code_samples (ZIP excerpts; paths like "proj.zip::src/App.tsx").

Respond in ${lang}. JSON only: summary, strengths, gaps, next_steps, architecture_risks, improvements.

CRITICAL — summary: 1-2 short sentences (max ~220 chars). Include stack/pattern ONCE if visible in source_code_samples, one biggest gap, optional progress %. Do NOT repeat stack in strengths. Do NOT append "입니다" to sentences that already end with 다/요/습니다/하세요.

strengths: omit entirely OR leave [] — UI does not show strengths (do not duplicate summary).

gaps: max 2 items, each one line, no overlap with summary wording.
next_steps: max 2 actionable tasks; shown in a separate UI block (do not copy into summary).
architecture_risks: max 1 item when evidence exists.
improvements: max 1 item when evidence exists.

FORBIDDEN: count-only summaries ("산출물 N건", "소스 샘플 N건") without technical synthesis; repeating Firebase/React/Vite in both summary and strengths.

If zip_inventory_notes or source paths show README (e.g. README.md), do NOT list missing README, "write a README", or "add run instructions" as a gap or next_step — only suggest improving README content if clearly incomplete.

If source_code_samples is empty, use memory + metadata but state code review was limited.`;
}

async function callGeminiProgressInsight(
  apiKey: string,
  modelId: string,
  locale: "ko" | "en",
  context: TeamContext
): Promise<ProgressInsightResponse> {
  const payload = buildLlmPayload(context);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildProgressInsightSystemPrompt(locale) }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: {
        temperature: 0.55,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const completion = await response.json();
  const content = completion?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || typeof content !== "string") {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  const parsed = JSON.parse(content) as Partial<ProgressInsightResponse>;
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  if (!summary) throw new Error("Gemini JSON에 summary가 없습니다.");

  const insight: ProgressInsightResponse = {
    summary: truncateText(summary, 280),
    strengths: parseInsightStringList(parsed.strengths, 3),
    gaps: parseInsightStringList(parsed.gaps, 3),
    next_steps: parseInsightStringList(parsed.next_steps, 3),
    architecture_risks: parseInsightStringList(parsed.architecture_risks, 2),
    improvements: parseInsightStringList(parsed.improvements, 2),
    generated_at: new Date().toISOString(),
    model: modelId,
  };

  if (isLowQualityProgressInsight(insight)) {
    return { ...buildHeuristicProgressInsight(context), model: `${modelId}-refined` };
  }

  return insight;
}

async function callGemini(
  apiKey: string,
  modelId: string,
  locale: "ko" | "en",
  context: TeamContext
): Promise<RecommendResponse> {
  const payload = buildLlmPayload(context);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildTroubleshootingSystemPrompt(locale) }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const completion = await response.json();
  const content = completion?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || typeof content !== "string") {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  const parsed = JSON.parse(content) as Partial<RecommendResponse>;
  const problem = typeof parsed.problem === "string" ? parsed.problem.trim() : "";
  const plan = typeof parsed.plan === "string" ? parsed.plan.trim() : "";
  if (!problem) {
    throw new Error("Gemini JSON에 problem이 없습니다.");
  }

  return {
    problem: truncateText(problem, 140),
    plan: plan ? truncateText(plan, 200) : "",
    rationale:
      typeof parsed.rationale === "string" ? truncateText(parsed.rationale, 80) : undefined,
    generated_at: new Date().toISOString(),
    model: modelId,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase Edge 환경 변수가 설정되지 않았습니다." }, 500);
  }

  try {
    const body = (await req.json()) as RecommendRequest;
    const teamId = body.teamId?.trim();
    if (!teamId) {
      return jsonResponse({ error: "teamId is required" }, 400);
    }

    const locale = body.locale === "en" ? "en" : "ko";
    const intent = body.intent === "progress-insight" ? "progress-insight" : "troubleshooting";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const geminiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    if (intent === "progress-insight") {
      const gathered = await gatherTeamContext(supabase, teamId, {
        maxSourceSnippets: MAX_SOURCE_SNIPPETS_PROGRESS,
        incrementalSourceOnly: true,
        alwaysSampleLatestFileCount: PROGRESS_ALWAYS_SAMPLE_LATEST_FILES,
      });
      const { deliverable_rows, memory, processed_deliverable_ids, ...context } = gathered;
      const sourceSignals = analyzeSourceCodeSignals(context.source_snippets);

      if (geminiKey) {
        const modelId = Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
        const rawInsight = await callGeminiProgressInsight(geminiKey, modelId, locale, context);
        const insight = normalizeProgressInsightForDisplay(rawInsight, sourceSignals);
        const nextAnalyzed = new Set(memory.analyzed_deliverable_ids);
        for (const id of processed_deliverable_ids) nextAnalyzed.add(id);
        for (const row of deliverable_rows) {
          if ((row.storage_path ?? "").startsWith("link://")) nextAnalyzed.add(row.id);
        }
        const memoryMarkdown = buildMemoryMarkdown(context.team.name, rawInsight);
        await saveTeamAiMemory(supabase, teamId, memoryMarkdown, nextAnalyzed, insight.summary);
        return jsonResponse({
          ...insight,
          used_memory: Boolean(memory.memory_markdown),
          new_deliverables_analyzed: processed_deliverable_ids.length,
          source_samples_count: countUsableSourceSnippets(context.source_snippets),
          detected_has_readme: sourceSignals.hasReadme,
        });
      }

      const rawHeuristic = buildHeuristicProgressInsight(context);
      const heuristic = normalizeProgressInsightForDisplay(rawHeuristic, sourceSignals);
      const nextAnalyzedHeuristic = new Set(memory.analyzed_deliverable_ids);
      for (const id of processed_deliverable_ids) nextAnalyzedHeuristic.add(id);
      for (const row of deliverable_rows) {
        if ((row.storage_path ?? "").startsWith("link://")) nextAnalyzedHeuristic.add(row.id);
      }
      const memoryMarkdownHeuristic = buildMemoryMarkdown(context.team.name, rawHeuristic);
      await saveTeamAiMemory(
        supabase,
        teamId,
        memoryMarkdownHeuristic,
        nextAnalyzedHeuristic,
        heuristic.summary
      );
      return jsonResponse({
        ...heuristic,
        used_memory: Boolean(memory.memory_markdown),
        new_deliverables_analyzed: processed_deliverable_ids.length,
        source_samples_count: countUsableSourceSnippets(context.source_snippets),
        detected_has_readme: sourceSignals.hasReadme,
      });
    }

    const gathered = await gatherTeamContext(supabase, teamId, {
      maxSourceSnippets: MAX_SOURCE_SNIPPETS_TROUBLESHOOT,
      incrementalSourceOnly: true,
      alwaysSampleLatestFileCount: TROUBLESHOOTING_ALWAYS_SAMPLE_LATEST_FILES,
    });
    if (geminiKey) {
      const modelId = Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
      const recommendation = await callGemini(geminiKey, modelId, locale, gathered);
      return jsonResponse(recommendation);
    }

    return jsonResponse(buildDraftRecommendation(gathered));
  } catch (error) {
    console.error("[recommend-troubleshooting]", error);
    const status =
      error && typeof error === "object" && "status" in error && error.status === 404
        ? 404
        : 500;
    return jsonResponse(
      { error: error instanceof Error ? error.message : "AI 추천 생성에 실패했습니다." },
      status
    );
  }
});
