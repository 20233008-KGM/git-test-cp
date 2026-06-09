-- 학생별 AI 정성평가·리포트용 압축 컨텍스트 (Compaction Agent 저장소)

CREATE TABLE IF NOT EXISTS public.ai_user_ai_context (
  user_id uuid PRIMARY KEY REFERENCES public.ai_users (id) ON DELETE CASCADE,
  context_markdown text NOT NULL DEFAULT '',
  report_excerpt text,
  analyzed_sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_compact_model text,
  compact_version int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_user_ai_context_updated_at_idx
  ON public.ai_user_ai_context (updated_at DESC);

COMMENT ON TABLE public.ai_user_ai_context IS '학생별 AI 정성평가·마이페이지 리포트용 압축 컨텍스트';
COMMENT ON COLUMN public.ai_user_ai_context.report_excerpt IS '마이페이지 PAGE01 주입용 1~2문단 요약';

ALTER TABLE public.ai_user_ai_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_user_ai_context" ON public.ai_user_ai_context;
CREATE POLICY "Allow public read ai_user_ai_context"
  ON public.ai_user_ai_context
  FOR SELECT
  USING (true);
