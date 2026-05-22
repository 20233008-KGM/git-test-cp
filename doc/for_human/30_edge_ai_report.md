# 마이페이지 AI 리포트 — Edge + Gemini (10분)

> **상태:** **H-002 완료** (2026-05-22) — 런칭 체크리스트에서 제외. Secret 재설정·401·문단 미생성 시에만 이 문서 사용.  
> **관련:** `28_human_action_items.md` · 기술: `supabase/functions/generate-report/README.md`

마이페이지 **리포트 1·2·3페이지**는 로그인 후 **자동으로** Edge `generate-report`를 호출해 AI 문단을 채웁니다.  
별도 「AI 리포트 생성」버튼은 없습니다.

## 준비물

- Supabase 프로젝트 관리자 권한
- [Google AI Studio](https://aistudio.google.com/) Gemini API Key (카드 없이 발급 가능)
- (선택) [Supabase CLI](https://supabase.com/docs/guides/cli)

## 1. Gemini API Key

1. https://aistudio.google.com/apikey
2. **Create API key** → `AIza...` 복사

## 2. Supabase Secret (이름 정확히)

**Project Settings** → **Edge Functions** → **Secrets**

| Name | Value |
|------|--------|
| **`GEMINI_API_KEY`** | `AIza...` |
| `GEMINI_MODEL` (선택) | `gemini-2.5-flash` |

`Gemini API Key1` 같은 표시 이름은 **안 됩니다.** Name은 `GEMINI_API_KEY`만 인식합니다.

## 3. Edge 배포 + 401 방지

프로젝트에 `supabase/config.toml` (`verify_jwt = false`)이 있어야 합니다.

```bash
supabase functions deploy generate-report
```

Vercel **Environment Variables**: `VITE_SUPABASE_ANON_KEY` = publishable 키 (`sb_publishable_...`)

## 4. 동작 확인

1. CampusConnect 로그인 (학생) → **마이페이지**
2. 잠시 후 리포트 박스 문장이 채워짐 (로딩: 「AI가 리포트 문단을 작성하는 중」)
3. 하단: `리포트 문단을 AI로 채웠습니다. (gemini-2.5-flash)` 또는 DB 초안 안내
4. **A4 인쇄 / PDF** — 용지 위 툴바 버튼(브라우저 인쇄)

## 5. AI에게 알리기

**「H-002 완료 (Gemini)」**

## 비용·주의

- Gemini 무료 티어 한도 있음
- API Key는 Edge Secret만 — `VITE_*` 금지
- H-006 학교 AI 정책 확인
