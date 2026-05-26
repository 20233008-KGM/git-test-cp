import React from "react";

/** 팀 카드·팀 관리에서 공통 — completedStages개 단계까지 완료로 표시 */
export function TeamStageProgress({
  completedStages,
  stages,
}: {
  completedStages: number;
  stages: string[];
}) {
  if (stages.length === 0) {
    return (
      <p className="text-xs text-[var(--cc-on-surface-variant)]">
        이 수업에 등록된 팀플 스테이지가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col" data-testid="team-stage-progress">
      {stages.map((stage, i) => {
        const isDone = i < completedStages;
        const isLineBlue = i < completedStages - 1;
        return (
          <div key={`${stage}-${i}`}>
            <div className="flex items-center gap-2">
              <div
                className={`h-[18px] w-[18px] shrink-0 rounded-full ${
                  isDone ? "bg-[var(--cc-primary)]" : "bg-[var(--cc-on-surface)]"
                }`}
                aria-hidden
              />
              <div className="flex-1 rounded-[5px] border border-[var(--cc-primary-border)] bg-[var(--cc-accent-subtle)] px-2 py-[3px]">
                <span className="text-[11px] font-medium text-[var(--cc-on-surface)]">{stage}</span>
              </div>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`ml-[5.5px] h-[10px] w-[7px] rounded-sm ${
                  isLineBlue ? "bg-[var(--cc-primary)]" : "bg-[var(--cc-outline-variant)]"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
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
      <p className="text-sm text-[var(--cc-on-surface-variant)]">
        교수가 수업에 팀플 스테이지를 등록하면 여기서 진행 상황을 표시할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="team-manage-stage-editor">
      <TeamStageProgress completedStages={completedStages} stages={stages} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          data-testid={`${testIdPrefix}-decrease`}
          disabled={disabled || saving || completedStages <= 0}
          onClick={() => onChange(completedStages - 1)}
          className="m3-btn m3-btn--outlined !min-h-0 px-3 py-1.5 text-sm font-bold disabled:opacity-40"
          aria-label="완료 단계 줄이기"
        >
          −
        </button>
        <span
          className="text-sm font-bold text-[var(--cc-on-surface-variant)]"
          data-testid={`${testIdPrefix}-label`}
        >
          완료 {completedStages} / {stages.length} 단계
          {saving ? " · 저장 중…" : ""}
        </span>
        <button
          type="button"
          data-testid={`${testIdPrefix}-increase`}
          disabled={disabled || saving || completedStages >= stages.length}
          onClick={() => onChange(completedStages + 1)}
          className="m3-btn m3-btn--outlined !min-h-0 px-3 py-1.5 text-sm font-bold disabled:opacity-40"
          aria-label="완료 단계 늘리기"
        >
          +
        </button>
      </div>
      <p className="text-xs text-[var(--cc-on-surface-variant)]">
        「+」를 누르면 다음 스테이지까지 완료로 표시됩니다. 팀 목록 카드에도 동일하게 반영됩니다.
      </p>
    </div>
  );
}
