import type { AiReportContext, AiReportGenerateResponse } from "../types/ai-report";

type Props = {
  context: AiReportContext;
  report: AiReportGenerateResponse;
};

export default function AiReportPrintView({ context, report }: Props) {
  const generatedLabel = new Date(report.generated_at).toLocaleString("ko-KR");

  return (
    <article className="ai-report-print mx-auto bg-white text-black">
      <header className="border-b-2 border-[#155dfc] pb-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
          CampusConnect · 팀 프로젝트 역량 리포트
        </p>
        <h1 className="mt-2 text-[22px] font-black">{context.userName}</h1>
        <p className="text-[11px] text-[#475569]">
          {context.email}
          {context.major ? ` · ${context.major}` : ""}
        </p>
        <p className="mt-1 text-[10px] text-[#64748b]">생성: {generatedLabel}</p>
      </header>

      <section className="mb-5">
        <h2 className="text-[13px] font-black text-[#155dfc] mb-2">요약</h2>
        <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{report.summary}</p>
      </section>

      <section className="mb-5">
        <h2 className="text-[13px] font-black text-[#155dfc] mb-2">역할·프로젝트</h2>
        <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{report.role_description}</p>
      </section>

      <section className="mb-5">
        <h2 className="text-[13px] font-black text-[#155dfc] mb-2">해결한 문제</h2>
        <ul className="list-disc pl-5 text-[11px] leading-relaxed space-y-1">
          {report.problems_solved.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mb-5">
        <h2 className="text-[13px] font-black text-[#155dfc] mb-2">기술·역량</h2>
        <p className="text-[11px]">{report.technologies.join(" · ")}</p>
      </section>

      {report.sections && report.sections.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[13px] font-black text-[#155dfc] mb-2">팀별 상세</h2>
          <div className="space-y-3">
            {report.sections.map((section) => (
              <div key={section.title} className="rounded border border-gray-200 p-3">
                <h3 className="text-[12px] font-bold">{section.title}</h3>
                <p className="mt-1 text-[10px] leading-relaxed whitespace-pre-wrap text-[#475569]">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-4">
        <h2 className="text-[13px] font-black text-[#155dfc] mb-2">성장 회고</h2>
        <p
          className="text-[11px] leading-relaxed whitespace-pre-wrap"
          data-testid="report-growth-reflection"
        >
          {report.growth_reflection}
        </p>
      </section>

      <footer className="border-t border-gray-200 pt-3 text-[9px] text-[#94a3b8]">
        {report.model === "draft-db-only"
          ? "DB 집계 초안 — AI 요약은 OpenAI 연동 후 제공됩니다."
          : `model: ${report.model ?? "unknown"}`}
      </footer>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .ai-report-print { width: 100%; max-width: none; box-shadow: none; }
        }
        .ai-report-print {
          width: 210mm;
          min-height: 297mm;
          padding: 14mm;
          box-sizing: border-box;
        }
      `}</style>
    </article>
  );
}
