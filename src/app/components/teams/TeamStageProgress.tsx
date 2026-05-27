import React, { useMemo } from "react";

type TeamStageProgressProps = {
  completedStages: number;
  stages: string[];
  /** 팀 카드: 진행 바 + 이전·현재·다음 3단계 · 팀 관리: 전체 단계 */
  variant?: "card" | "detailed";
};

type StageWindowItem = {
  index: number;
  role: "prev" | "current" | "next";
  name: string;
};

function getStageWindow(completedStages: number, stages: string[]): StageWindowItem[] {
  const total = stages.length;
  if (total === 0) return [];

  const currentIndex =
    completedStages >= total ? total - 1 : Math.max(0, Math.min(completedStages, total - 1));

  const items: StageWindowItem[] = [];
  if (currentIndex > 0) {
    items.push({ index: currentIndex - 1, role: "prev", name: stages[currentIndex - 1] });
  }
  items.push({ index: currentIndex, role: "current", name: stages[currentIndex] });
  if (currentIndex < total - 1) {
    items.push({ index: currentIndex + 1, role: "next", name: stages[currentIndex + 1] });
  }
  return items;
}

function stageStatus(index: number, completedStages: number, total: number) {
  const isDone = index < completedStages;
  const isCurrent =
    completedStages >= total ? index === total - 1 && isDone : index === completedStages;
  return { isDone, isCurrent };
}

function TeamCardProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div className="mb-3" data-testid="team-card-progress-bar">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#5372b2]">
          팀플 진행률
        </span>
        <span className="text-xs font-extrabold text-[#155dfc]">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e8efff]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3676ff] via-[#155dfc] to-[#4f8bff] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TeamCardStageWindow({
  completedStages,
  windowItems,
  total,
}: {
  completedStages: number;
  windowItems: StageWindowItem[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-testid="team-stage-progress-window">
      {windowItems.map((item, i) => {
        const { isDone, isCurrent } = stageStatus(item.index, completedStages, total);
        const isPrev = item.role === "prev";
        const isNext = item.role === "next";

        const rowClass = isCurrent
          ? "border-[#9fc0ff] bg-gradient-to-r from-[#eef4ff] to-white shadow-sm ring-1 ring-[#bfd6ff]/80"
          : isPrev
            ? "border-transparent bg-gradient-to-r from-[#f1f5f9]/90 to-[#eef4ff]/50 opacity-70"
            : "border-transparent bg-gradient-to-r from-[#eef4ff]/50 to-[#f8fafc]/90 opacity-65";

        const dotClass = isDone
          ? "bg-[#155dfc] text-white"
          : isCurrent
            ? "bg-[#155dfc] ring-2 ring-[#bfdbfe] text-white"
            : "bg-[#cbd5e1] text-[#64748b]";

        const labelClass = isCurrent
          ? "text-[12px] font-bold text-[#153e99]"
          : isPrev
            ? "text-[11px] font-medium text-[#64748b]"
            : "text-[11px] font-medium text-[#94a3b8]";

        const badgeClass = isCurrent
          ? "bg-[#dce9ff] text-[#1d4dbc]"
          : isPrev
            ? "bg-[#f1f5f9] text-[#64748b]"
            : "bg-[#f8fafc] text-[#94a3b8]";

        const badgeText = isDone ? "완료" : isCurrent ? "진행중" : "다음";

        return (
          <div key={`${item.index}-${item.role}`}>
            <div
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${rowClass} ${
                isCurrent ? "scale-100" : "scale-[0.98]"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${dotClass}`}
                aria-hidden
              >
                {isDone ? "✓" : item.index + 1}
              </div>
              <p className={`min-w-0 flex-1 truncate ${labelClass}`}>{item.name}</p>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${badgeClass}`}>
                {badgeText}
              </span>
            </div>
            {i < windowItems.length - 1 && (
              <div
                className="ml-[10px] h-1.5 w-px bg-gradient-to-b from-[#93c5fd]/80 to-[#cbd5e1]/40"
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 팀 카드·팀 관리에서 공통 — completedStages개 단계까지 완료로 표시 */
export function TeamStageProgress({
  completedStages,
  stages,
  variant = "detailed",
}: TeamStageProgressProps) {
  const progress =
    stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

  const windowItems = useMemo(
    () => getStageWindow(completedStages, stages),
    [completedStages, stages]
  );

  if (stages.length === 0) {
    return (
      <p className="text-sm text-[#6a7282]" data-testid="team-stage-progress-empty">
        이 수업에 등록된 팀플 스테이지가 없습니다. 교수가 수업 설정에서 스테이지를 등록하면 여기에 표시됩니다.
      </p>
    );
  }

  if (variant === "card") {
    return (
      <div data-testid="team-stage-progress">
        <TeamCardProgressBar progress={progress} />
        <TeamCardStageWindow
          completedStages={completedStages}
          windowItems={windowItems}
          total={stages.length}
        />
      </div>
    );
  }

  const stageList = (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const isDone = i < completedStages;
        const isCurrent = i === completedStages;
        return (
          <div
            key={`${stage}-${i}`}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
              isDone
                ? "border-[#c9ddff] bg-[#eef4ff]"
                : isCurrent
                  ? "border-[#9fc0ff] bg-[#f5f9ff]"
                  : "border-gray-200 bg-white"
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                isDone
                  ? "bg-[#155dfc] text-white"
                  : isCurrent
                    ? "bg-[#dbe7ff] text-[#155dfc]"
                    : "bg-gray-200 text-gray-600"
              }`}
              aria-hidden
            >
              {isDone ? "✓" : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-semibold ${
                  isDone ? "text-[#153e99]" : isCurrent ? "text-[#1f4ea3]" : "text-[#374151]"
                }`}
              >
                {stage}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isDone
                  ? "bg-[#dce9ff] text-[#1d4dbc]"
                  : isCurrent
                    ? "bg-[#eaf2ff] text-[#3562be]"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {isDone ? "완료" : isCurrent ? "진행중" : "대기"}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3" data-testid="team-stage-progress">
      <div className="rounded-2xl border border-[#dbe7ff] bg-gradient-to-br from-[#f8fbff] to-white p-4 shadow-[0_8px_24px_rgba(21,93,252,0.08)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-[#5372b2]">TEAM STAGE PROGRESS</span>
          <span className="rounded-full bg-[#e7efff] px-2.5 py-1 text-xs font-bold text-[#2153c4]">
            {progress}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#dbe7ff]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#155dfc] to-[#4f8bff] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {stageList}
    </div>
  );
}

export function TeamStageProgressEditor({
  completedStages,
  stages,
  disabled = false,
  saving = false,
  onChange,
  testIdPrefix = "team-manage-stage",
}: {
  completedStages: number;
  stages: string[];
  disabled?: boolean;
  saving?: boolean;
  onChange: (next: number) => void;
  testIdPrefix?: string;
}) {
  if (stages.length === 0) {
    return (
      <p className="text-sm text-[#6a7282]" data-testid="team-manage-stage-editor-empty">
        교수가 수업에 팀플 스테이지를 등록하면 여기서 진행 상황을 표시할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="team-manage-stage-editor">
      <TeamStageProgress completedStages={completedStages} stages={stages} variant="detailed" />
      <div className="rounded-2xl border border-[#dbe7ff] bg-white/95 p-3 shadow-[0_6px_18px_rgba(17,24,39,0.06)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[#101828]" data-testid={`${testIdPrefix}-label`}>
            완료 {completedStages} / {stages.length} 단계
            {saving ? " · 저장 중…" : ""}
          </p>
          <p className="text-[11px] font-medium text-[#6a7282]">팀장만 수정 가능</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            data-testid={`${testIdPrefix}-decrease`}
            disabled={disabled || saving || completedStages <= 0}
            onClick={() => onChange(completedStages - 1)}
            className="inline-flex min-h-9 min-w-24 items-center justify-center rounded-xl border border-[#bfd6ff] bg-[#f4f8ff] px-3 py-2 text-sm font-extrabold text-[#2456c6] transition hover:bg-[#eaf2ff] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="완료 단계 줄이기"
          >
            단계 되돌리기
          </button>
          <button
            type="button"
            data-testid={`${testIdPrefix}-increase`}
            disabled={disabled || saving || completedStages >= stages.length}
            onClick={() => onChange(completedStages + 1)}
            className="inline-flex min-h-9 min-w-24 items-center justify-center rounded-xl bg-gradient-to-r from-[#155dfc] to-[#3c7dff] px-3 py-2 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(21,93,252,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="완료 단계 늘리기"
          >
            다음 단계 완료
          </button>
        </div>
      </div>
      <p className="text-xs text-[#6a7282]">
        변경 내용은 팀 목록 카드에도 동일하게 반영됩니다.
      </p>
    </div>
  );
}
