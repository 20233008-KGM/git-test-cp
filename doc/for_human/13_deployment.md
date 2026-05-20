# 배포 — 인터넷에 올리기

> **관련:** `doc/for_agent/13_devops.md` · `doc/for_human/28_human_action_items.md` (H-005)

**배포** = 내 컴퓨터에서만 돌던 사이트를 **인터넷 주소**로 공개하는 것.

## 지금

- `pnpm dev` → 내 PC에서만 접속 (localhost)
- 공개 URL **없음**
- 배포 설정 파일 **`vercel.json`** 은 준비됨 (아직 Vercel에 연결 안 함)

## 목표 구조

| 부분 | 올리는 곳 (예시) |
|------|------------------|
| 화면(React) | Vercel, Netlify |
| DB | Supabase 클라우드 |
| 로그인 | Firebase |

## 당신이 필요한 순간

1. **도메인** 살지 말지 (school-project.com 등)  
2. **언제 공개할지** 최종 OK  
3. Supabase/Firebase **유료 한도** (무료 티어로 시작 가능)  

## 대략적 순서

1. Supabase: RLS(H-001), 피드백 SQL(H-007), (선택) Edge AI(H-002)  
2. Firebase: 로그인 도메인에 Vercel URL 추가  
3. 로컬 `npm run build` 성공  
4. Vercel: GitHub 연결 → **Environment Variables**에 `VITE_*` 8~9개  
5. Deploy → 스모크(로그인·수업·팀·마이페이지)  
6. 파일럿 수업 테스트  

> 상세 체크리스트: `doc/for_agent/deploy_vercel_checklist.md`  
> 공개 GO: `28_human_action_items.md` **H-005**

## AI에게 맡기면

기술 설정은 AI·개발자가 하고, **“공개해도 된다”**는 말만 당신이 하면 됩니다.

상세: `doc/for_agent/13_devops.md`, `03_service_launch_journey.md`
