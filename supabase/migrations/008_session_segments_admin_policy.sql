-- Allow admins to manage session segments on any user's session (force pause, reassignment handoff).

DROP POLICY IF EXISTS "Manage segments" ON public.session_segments;

CREATE POLICY "Manage segments" ON public.session_segments
  FOR ALL USING (
    public.is_active_user()
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_segments.session_id
      AND (s.user_id = auth.uid() OR public.has_admin_role())
    )
  );
