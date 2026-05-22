-- 학생 학교명 (마이페이지·프로필 수정)
ALTER TABLE public.ai_users
  ADD COLUMN IF NOT EXISTS school text;

COMMENT ON COLUMN public.ai_users.school IS 'Student school / university name';

UPDATE public.ai_users
SET school = '숭실대학교'
WHERE role = 'student'
  AND (school IS NULL OR btrim(school) = '');
