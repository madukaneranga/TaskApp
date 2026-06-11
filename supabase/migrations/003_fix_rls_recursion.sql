-- Helper functions bypass RLS to avoid infinite recursion in users policies
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

-- Users policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can read active colleagues" ON public.users;

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Users can read active colleagues" ON public.users
  FOR SELECT USING (status = 'active');

-- Tasks policies
DROP POLICY IF EXISTS "Active users can read relevant tasks" ON public.tasks;
DROP POLICY IF EXISTS "Active users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Active users can update relevant tasks" ON public.tasks;

CREATE POLICY "Active users can read relevant tasks" ON public.tasks
  FOR SELECT USING (
    public.is_active_user()
    AND (
      assigned_to = auth.uid()
      OR created_by = auth.uid()
      OR public.has_admin_role()
      OR EXISTS (SELECT 1 FROM public.task_members WHERE task_id = tasks.id AND user_id = auth.uid())
    )
  );

CREATE POLICY "Active users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can update relevant tasks" ON public.tasks
  FOR UPDATE USING (
    public.is_active_user()
    AND (assigned_to = auth.uid() OR public.has_admin_role())
  );

-- Task members
DROP POLICY IF EXISTS "Read task members" ON public.task_members;
DROP POLICY IF EXISTS "Manage task members" ON public.task_members;

CREATE POLICY "Read task members" ON public.task_members
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Manage task members" ON public.task_members
  FOR ALL USING (public.is_admin());

-- Sessions
DROP POLICY IF EXISTS "Read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Manage own sessions" ON public.sessions;

CREATE POLICY "Read sessions" ON public.sessions
  FOR SELECT USING (
    public.is_active_user()
    AND (user_id = auth.uid() OR public.has_admin_role())
  );

CREATE POLICY "Manage own sessions" ON public.sessions
  FOR ALL USING (
    public.is_active_user()
    AND (user_id = auth.uid() OR public.has_admin_role())
  );

-- Session segments
DROP POLICY IF EXISTS "Read segments" ON public.session_segments;
DROP POLICY IF EXISTS "Manage segments" ON public.session_segments;

CREATE POLICY "Read segments" ON public.session_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_segments.session_id
      AND (s.user_id = auth.uid() OR public.has_admin_role())
    )
  );

CREATE POLICY "Manage segments" ON public.session_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_segments.session_id
      AND s.user_id = auth.uid()
    )
    AND public.is_active_user()
  );

-- Notes
DROP POLICY IF EXISTS "Read notes" ON public.notes;
DROP POLICY IF EXISTS "Create notes" ON public.notes;

CREATE POLICY "Read notes" ON public.notes
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Create notes" ON public.notes
  FOR INSERT WITH CHECK (public.is_active_user() AND user_id = auth.uid());

-- Status history
DROP POLICY IF EXISTS "Read status history" ON public.status_history;

CREATE POLICY "Read status history" ON public.status_history
  FOR SELECT USING (public.is_active_user());
