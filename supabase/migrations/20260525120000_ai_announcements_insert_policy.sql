-- vision #87 — 교수 공지 등록: RLS INSERT·DELETE (SELECT만 있어 클라이언트 insert 실패)

ALTER TABLE public.ai_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert ai_announcements" ON public.ai_announcements;
CREATE POLICY "Allow public insert ai_announcements"
  ON public.ai_announcements FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete ai_announcements" ON public.ai_announcements;
CREATE POLICY "Allow public delete ai_announcements"
  ON public.ai_announcements FOR DELETE
  USING (true);
