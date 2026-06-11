CREATE TYPE problem_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE public.problem_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status problem_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problem_reports_user_id ON public.problem_reports(user_id);
CREATE INDEX idx_problem_reports_status ON public.problem_reports(status);

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read problem reports" ON public.problem_reports
  FOR SELECT USING (
    public.is_active_user()
    AND (user_id = auth.uid() OR public.is_admin())
  );

CREATE POLICY "Create problem reports" ON public.problem_reports
  FOR INSERT WITH CHECK (
    public.is_active_user()
    AND user_id = auth.uid()
  );

CREATE POLICY "Admins update problem reports" ON public.problem_reports
  FOR UPDATE USING (public.is_admin());
