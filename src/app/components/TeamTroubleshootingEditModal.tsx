import React, { useEffect, useState } from "react";
import AppModal from "./layout/AppModal";
import type { TroubleshootingLog } from "../types";

export type TroubleshootingEditPayload = {
  problem: string;
  plan: string;
  solution: string;
};

type Props = {
  open: boolean;
  log: TroubleshootingLog | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TroubleshootingEditPayload) => Promise<void>;
};

export default function TeamTroubleshootingEditModal({
  open,
  log,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TroubleshootingEditPayload>({
    problem: "",
    plan: "",
    solution: "",
  });

  useEffect(() => {
    if (!open || !log) return;
    setForm({
      problem: log.problem,
      plan: log.plan ?? "",
      solution: log.solution ?? "",
    });
  }, [open, log]);

  const update = <K extends keyof TroubleshootingEditPayload>(
    key: K,
    value: TroubleshootingEditPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.problem.trim()) {
      alert("문제 내용을 입력해주세요.");
      return;
    }
    await onSubmit({
      problem: form.problem.trim(),
      plan: form.plan.trim(),
      solution: form.solution.trim(),
    });
  };

  return (
    <AppModal
      open={open && Boolean(log)}
      onClose={onClose}
      testId="team-trouble-edit-modal-overlay"
      ariaLabel="트러블슈팅 수정"
      panelClassName="max-w-[520px] !p-0 flex max-h-[92vh] flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-[var(--cc-outline-variant)] px-6 py-4">
        <h2 className="text-lg font-bold text-[var(--cc-on-surface)]">트러블슈팅 수정</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <div className="space-y-1.5">
          <label className="cc-label" htmlFor="team-trouble-edit-problem">
            문제 <span className="text-red-600">*</span>
          </label>
          <textarea
            id="team-trouble-edit-problem"
            value={form.problem}
            onChange={(e) => update("problem", e.target.value)}
            rows={3}
            className="cc-input w-full resize-none text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="cc-label" htmlFor="team-trouble-edit-plan">
            해결 계획
          </label>
          <input
            id="team-trouble-edit-plan"
            type="text"
            value={form.plan}
            onChange={(e) => update("plan", e.target.value)}
            className="cc-input w-full text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="cc-label" htmlFor="team-trouble-edit-solution">
            해결 방법
          </label>
          <input
            id="team-trouble-edit-solution"
            type="text"
            value={form.solution}
            onChange={(e) => update("solution", e.target.value)}
            className="cc-input w-full text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--cc-outline-variant)] px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="m3-btn m3-btn--outlined px-4 py-2 text-sm"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          data-testid="team-trouble-edit-submit"
          className="m3-btn m3-btn--filled px-5 py-2 text-sm font-bold"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
      </div>
    </AppModal>
  );
}
