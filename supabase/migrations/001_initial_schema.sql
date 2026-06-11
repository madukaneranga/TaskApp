-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'paused', 'completed');
CREATE TYPE segment_type AS ENUM ('work', 'pause');

-- Users profile table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id BIGINT NOT NULL UNIQUE,
  task_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  total_images_count INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  status task_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Task members (collaborators)
CREATE TABLE public.task_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  UNIQUE(task_id, user_id)
);

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER DEFAULT 0,
  edited_images_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);

-- Session segments (work/pause tracking)
CREATE TABLE public.session_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  type segment_type NOT NULL DEFAULT 'work'
);

CREATE INDEX idx_session_segments_session_id ON public.session_segments(session_id);

-- Notes / remarks
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  role user_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_task_id ON public.notes(task_id);

-- Status history
CREATE TABLE public.status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  old_status task_status,
  new_status task_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_history_task_id ON public.status_history(task_id);

-- Helper: log status changes
CREATE OR REPLACE FUNCTION public.log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_history (task_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_status_change_trigger
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_status_change();

-- Auto-create user profile on auth signup (for admin-created users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role,
      'user'::user_role
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'status', '')::user_status,
      'pending'::user_status
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Users can read active colleagues" ON public.users
  FOR SELECT USING (status = 'active');


-- Tasks policies
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
CREATE POLICY "Read task members" ON public.task_members
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Manage task members" ON public.task_members
  FOR ALL USING (public.is_admin());

-- Sessions
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
CREATE POLICY "Read notes" ON public.notes
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Create notes" ON public.notes
  FOR INSERT WITH CHECK (public.is_active_user() AND user_id = auth.uid());

-- Status history
CREATE POLICY "Read status history" ON public.status_history
  FOR SELECT USING (public.is_active_user());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_segments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
