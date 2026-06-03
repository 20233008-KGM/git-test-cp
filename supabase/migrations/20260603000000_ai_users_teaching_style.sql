ALTER TABLE public.ai_users
  ADD COLUMN IF NOT EXISTS teaching_style text;
