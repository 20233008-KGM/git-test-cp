-- 팀 산출물 버킷 업로드 한도: 50MB → 500MB (앱 TEAM_DELIVERABLE_MAX_BYTES와 동일)
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'ai_team_deliverables';
