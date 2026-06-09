-- ai_user_learning_profiles: portfolio_file 저장용 INSERT/UPDATE (기존 SELECT 정책 유지)

DROP POLICY IF EXISTS "Allow public insert ai_user_learning_profiles" ON public.ai_user_learning_profiles;
CREATE POLICY "Allow public insert ai_user_learning_profiles"
  ON public.ai_user_learning_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_user_learning_profiles" ON public.ai_user_learning_profiles;
CREATE POLICY "Allow public update ai_user_learning_profiles"
  ON public.ai_user_learning_profiles FOR UPDATE USING (true) WITH CHECK (true);
