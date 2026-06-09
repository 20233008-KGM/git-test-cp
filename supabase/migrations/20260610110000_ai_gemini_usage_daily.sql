-- Gemini API 일일 호출 예산 (무료 티어 RPM/RPD 완화)

CREATE TABLE IF NOT EXISTS public.ai_gemini_usage_daily (
  usage_date date PRIMARY KEY,
  call_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_gemini_usage_daily IS '프로젝트 단위 Gemini generateContent 일일 호출 수';

ALTER TABLE public.ai_gemini_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role ai_gemini_usage_daily" ON public.ai_gemini_usage_daily;
CREATE POLICY "Allow service role ai_gemini_usage_daily"
  ON public.ai_gemini_usage_daily
  FOR ALL
  USING (true)
  WITH CHECK (true);
