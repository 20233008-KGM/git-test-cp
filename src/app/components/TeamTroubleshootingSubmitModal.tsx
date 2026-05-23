import React, { useEffect, useState } from "react";
import AppModal from "./layout/AppModal";

export type TroubleshootingFormPayload = {
  problem: string;
  plan: string;
  solution: string;
};

type Props = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TroubleshootingFormPayload) => Promise<void>;
};

const emptyForm = (): TroubleshootingFormPayload => ({
  problem: "",
  plan: "",
  solution: "",
});

export default function TeamTroubleshootingSubmitModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TroubleshootingFormPayload>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const update = <K extends keyof TroubleshootingFormPayload>(
    key: K,
    value: TroubleshootingFormPayload[K]
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
      open={open}
      onClose={onClose}
      testId="team-trouble-modal-overlay"
      ariaLabel="트러블슈팅 기록"
      panelClassName="max-w-[520px] !p-0 flex max-h-[92vh] flex-col overflow-hidden"
    >
      <div className="flex w-full flex-col" data-testid="team-trouble-write-form">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#1c398e]">트러블슈팅 기록</h2>
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
            <label className="text-sm font-medium text-[#1e2939]" htmlFor="team-trouble-problem-input">
              문제 <span className="text-red-600">*</span>
            </label>
            <textarea
              id="team-trouble-problem-input"
              value={form.problem}
              onChange={(e) => update("problem", e.target.value)}
              data-testid="team-trouble-problem-input"
              placeholder="발견한 문제를 입력하세요."
              rows={3}
              className="w-full resize-none rounded-[8px] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]" htmlFor="team-trouble-plan-input">
              해결 계획
            </label>
            <input
              id="team-trouble-plan-input"
              type="text"
              value={form.plan}
              onChange={(e) => update("plan", e.target.value)}
              data-testid="team-trouble-plan-input"
              placeholder="해결 계획 (선택)"
              className="w-full rounded-[8px] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1e2939]" htmlFor="team-trouble-solution-input">
              해결 방법
            </label>
            <input
              id="team-trouble-solution-input"
              type="text"
              value={form.solution}
              onChange={(e) => update("solution", e.target.value)}
              data-testid="team-trouble-solution-input"
              placeholder="해결 방법 (입력 시 해결 완료로 저장)"
              className="w-full rounded-[8px] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-[8px] border border-gray-300 px-4 py-2 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            data-testid="team-trouble-submit"
            className="rounded-[8px] bg-[#155dfc] px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "등록 중..." : "기록 등록"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
