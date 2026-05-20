# 04 — 서비스 런칭 플로우

> **관련:** `03_development_roadmap.md` · `13_devops.md` · `22_security_notes.md`

## 런칭 준비 체크리스트

### A. 제품

- [ ] vision.md 기능 3축 모두 최소 동작 (네트워크·워크스페이스·마이페이지)
- [ ] 학생/교수/관리자 역할별 E2E 시나리오 통과
- [o] 목록·상세 Supabase 읽기
- [ ] CRUD 쓰기·Storage 완료 (프로덕션)

### B. 기술

- [ ] `.env` / 호스팅 시크릿 (Firebase, Supabase, AI API)
- [ ] Supabase RLS 전 테이블 검증
- [ ] CORS·도메인 설정
- [o] 빌드 `npm run build` 성공 (로컬·CI `build.yml`)
- [ ] Lighthouse 성능 기준 협의 (인간)

### C. 보안·법무

- [ ] 개인정보 처리방침·이용약관 (인간·법무)
- [ ] 학교 SSO 연동 여부 결정 (인간)
- [ ] API 키 로테이션 계획

### D. 운영

- [ ] 스테이징 환경
- [ ] 프로덕션 배포 승인 (인간)
- [ ] 모니터링·알림
- [ ] 롤백 절차

### E. 온보딩

- [ ] 교수·학생 사용 가이드 (`doc/for_human/`)
- [ ] 파일럿 수업 1개 테스트

## 배포 순서 (권장)

1. Supabase 프로덕션 프로젝트 + 마이그레이션
2. Firebase 프로덕션 (또는 Supabase Auth 통합 검토)
3. 프론트 정적 호스팅 + 환경변수 (`deploy_vercel_checklist.md`)
4. 스모크 테스트
5. 파일럿 → 전체 오픈 (인간 승인)

## 런칭 후 48시간

- 에러 로그 확인
- `15_known_issues.md` 업데이트
- `21_release_notes.md` 작성
