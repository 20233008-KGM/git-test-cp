import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** 화면·인쇄 공통 A4 용지 프레임 (210×297mm) */
export default function StudentReportA4Sheet({ children, className = "" }: Props) {
  return (
    <article
      data-testid="mypage-a4-report-sheet"
      className={`student-report-a4-sheet mx-auto box-border w-full max-w-[210mm] min-h-[297mm] overflow-hidden rounded-sm border border-[#cbd5e1] bg-white text-[#0f172a] shadow-[0_20px_50px_rgba(15,23,42,0.12)] ${className}`}
    >
      {children}
      <style>{`
        .student-report-a4-sheet {
          width: min(210mm, 100%);
        }
        @media print {
          @page { size: A4; margin: 12mm; }
          .student-report-a4-sheet {
            width: 100%;
            max-width: none;
            min-height: auto;
            box-shadow: none;
            border: none;
            border-radius: 0;
          }
        }
      `}</style>
    </article>
  );
}

/** 긴 문단을 2~4개 불릿으로 나눠 스캔 가능하게 */
export function reportTextToBullets(text: string, max = 4): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  if (parts.length <= 1 && trimmed.length > 120) {
    const mid = Math.floor(trimmed.length / 2);
    const breakAt = trimmed.indexOf(" ", mid);
    if (breakAt > 40) {
      return [trimmed.slice(0, breakAt).trim(), trimmed.slice(breakAt).trim()].filter(Boolean);
    }
  }
  return parts.slice(0, max);
}

export function ReportSectionTitle({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div className="mb-4 border-b border-[#e2e8f0] pb-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#155dfc]">{kicker}</p>
      <h3 className="mt-1 text-[17px] font-black leading-snug text-[#0f172a]">{title}</h3>
    </div>
  );
}

export function ReportCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#dbeafe] bg-[#f8fafc] px-4 py-3 text-[11px] leading-[1.65] text-[#334155]">
      {children}
    </div>
  );
}

export function ReportLabeledGrid({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-[#e2e8f0] bg-white px-3 py-2">
          <dt className="text-[9px] font-bold uppercase tracking-wide text-[#64748b]">{item.label}</dt>
          <dd className="mt-1 text-[11px] font-medium leading-snug text-[#1e293b]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
