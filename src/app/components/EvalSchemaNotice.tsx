import React from "react";

type Props = {
  missingTables: string[];
  legacyPeerDisplayTable?: boolean;
};

/** 평가 테이블(bundle v2) 미적용 시 조회 페이지 상단 안내 */
export default function EvalSchemaNotice({ missingTables, legacyPeerDisplayTable }: Props) {
  if (missingTables.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      data-testid="eval-schema-missing-banner"
    >
      <p className="font-bold">평가 DB 테이블이 아직 준비되지 않았습니다.</p>
      <p className="mt-1">
        누락: {missingTables.join(", ")}
        {legacyPeerDisplayTable ? (
          <>
            {" "}
            · 팀 상세용 <code className="rounded bg-white px-1 text-xs">peer_review_students</code> 테이블만
            있고, 조회 API용 평가 테이블은 없습니다.
          </>
        ) : null}
      </p>
      <p className="mt-2">
        Supabase SQL Editor에서 한 번에 실행 (권장):{" "}
        <code className="rounded bg-white px-1 text-xs">supabase/apply_remote_full.sql</code>
        <span className="text-xs text-amber-800"> (생성: npm run supabase:apply-remote-full)</span>
      </p>
      <p className="mt-2 text-xs text-amber-800">
        로컬 점검: <code>npm run verify:archived-kim</code> · 가이드:{" "}
        doc/for_human/38_archived_kim_student_setup.md
      </p>
    </div>
  );
}
