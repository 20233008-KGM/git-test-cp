import type { AiReportContext, AiReportGenerateResponse } from "../types/ai-report";
import { reportTextToBullets, ReportCallout, ReportSectionTitle } from "./StudentReportA4Sheet";

type Props = {
  context: AiReportContext;
  report: AiReportGenerateResponse;
  /** 화면에 항상 노출할 때 true — 인쇄 전용 숨김 해제 */
  inline?: boolean;
};

export default function AiReportPrintView({ context, report, inline = false }: Props) {
  const generatedLabel = new Date(report.generated_at).toLocaleString("ko-KR");
  const summaryBullets = reportTextToBullets(report.summary, 5);
  const roleBullets = reportTextToBullets(report.role_description, 4);
  const growthBullets = reportTextToBullets(report.growth_reflection, 4);

  return (
    <article
      className={`ai-report-print mx-auto bg-white text-[#0f172a] ${inline ? "" : "hidden print:block"}`}
      data-testid="report-print-view"
    >
      <header className="border-b-2 border-[#155dfc] pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
          CampusConnect · 팀 프로젝트 역량 리포트
        </p>
        <h1 className="mt-2 text-[20px] font-black leading-tight">{context.userName}</h1>
        <p className="mt-1 text-[11px] text-[#475569]">
          {context.email}
          {context.major ? ` · ${context.major}` : ""}
        </p>
        <p className="mt-2 text-[10px] text-[#64748b]">생성: {generatedLabel}</p>
        <p
          className="mt-3 rounded-md bg-[#eff6ff] px-3 py-2 text-[10px] font-medium text-[#1e40af]"
          data-testid="report-activity-summary"
        >
          집계: 트러블슈팅 {context.totalTroubleshootingLogs}건 · 산출물{" "}
          {context.totalDeliverables}건 · 피드백 {context.totalFeedbacksSubmitted} · 회고{" "}
          {context.totalRetrospectivesSubmitted} · 동료평가 {context.totalPeerReviewsSubmitted} ·
          교수평가 {context.totalProfessorStudentEvalsReceived}/
          {context.totalProfessorProjectEvalsReceived}팀
        </p>
      </header>

      <section className="mt-5">
        <ReportSectionTitle kicker="Executive summary" title="핵심 요약" />
        {summaryBullets.length > 1 ? (
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-[1.65] text-[#334155]">
            {summaryBullets.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        ) : (
          <ReportCallout>
            <p className="whitespace-pre-wrap">{report.summary}</p>
          </ReportCallout>
        )}
      </section>

      <section className="mt-5">
        <ReportSectionTitle kicker="Role & projects" title="역할·프로젝트" />
        {roleBullets.length > 1 ? (
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-[1.65] text-[#334155]">
            {roleBullets.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="max-w-prose text-[11px] leading-[1.65] text-[#334155]">{report.role_description}</p>
        )}
      </section>

      <section className="mt-5">
        <ReportSectionTitle kicker="Impact" title="해결한 문제" />
        <ul
          className="grid list-none gap-2 p-0"
          data-testid="report-problems-solved"
        >
          {report.problems_solved.map((item, i) => (
            <li
              key={`${i}-${item.slice(0, 24)}`}
              className="rounded-md border-l-[3px] border-[#155dfc] bg-[#f8fafc] px-3 py-2 text-[11px] leading-snug text-[#334155]"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <ReportSectionTitle kicker="Skills" title="기술·역량" />
        <div className="flex flex-wrap gap-1.5" data-testid="report-technologies">
          {report.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[10px] font-bold text-[#155dfc]"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {report.sections && report.sections.length > 0 && (
        <section className="mt-5" data-testid="report-team-sections">
          <ReportSectionTitle kicker="Teams" title="팀별 하이라이트" />
          <div className="space-y-2">
            {report.sections.map((section) => {
              const bodyBullets = reportTextToBullets(section.body, 3);
              return (
                <div key={section.title} className="rounded-lg border border-[#e2e8f0] p-3">
                  <h3 className="text-[12px] font-black text-[#0f172a]">{section.title}</h3>
                  {bodyBullets.length > 1 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] leading-[1.6] text-[#475569]">
                      {bodyBullets.map((b) => (
                        <li key={b.slice(0, 30)}>{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 line-clamp-4 text-[10px] leading-[1.6] text-[#475569]">
                      {section.body}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-5">
        <ReportSectionTitle kicker="Growth" title="성장 회고" />
        {growthBullets.length > 1 ? (
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-[1.65] text-[#334155]">
            {growthBullets.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        ) : (
          <p
            className="max-w-prose text-[11px] leading-[1.65] text-[#334155]"
            data-testid="report-growth-reflection"
          >
            {report.growth_reflection}
          </p>
        )}
      </section>

      <footer className="mt-6 border-t border-[#e2e8f0] pt-3 text-[9px] text-[#94a3b8]">
        {report.model === "draft-db-only"
          ? "DB 집계 초안 · Gemini Secret 설정 시 AI 문단으로 갱신됩니다."
          : `AI model: ${report.model ?? "unknown"}`}
      </footer>

      <style>{`
        .ai-report-print {
          width: min(210mm, 100%);
          min-height: 297mm;
          padding: 14mm 16mm;
          box-sizing: border-box;
        }
        @media print {
          .ai-report-print {
            width: 100%;
            max-width: none;
            min-height: auto;
            padding: 0;
          }
        }
      `}</style>
    </article>
  );
}
