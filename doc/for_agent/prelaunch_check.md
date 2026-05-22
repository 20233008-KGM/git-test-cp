# 런칭 전 자동 점검 (에이전트·CI)

> 인간 키·승인 없이 실행 가능한 최소 게이트

## 명령

```bash
npm run prelaunch:check
npm run prelaunch:check:json
```

## 포함 단계

| 단계 | 조건 | 실패 시 |
|------|------|---------|
| `npm run build` | 항상 | TypeScript/Vite 오류 |
| `verify:archived-kim` | `.env`에 `VITE_SUPABASE_*` | 시드·평가 테이블 미준비 |
| `verify:bundle:preflight` | 항상 | 리포트 경로·보관 정책 경고(strict 시 실패) |

## 인간 게이트 (별도)

- `28_human_action_items.md` — H-001~011 `[o]` 후 `npm run human:verify`
- H-002 Edge — **완료** (재배포·Secret만 [30](../for_human/30_edge_ai_report.md))

## 관련

- `deploy_vercel_checklist.md` (H-005)
- `00_pre_launch_order.md` (인간)
