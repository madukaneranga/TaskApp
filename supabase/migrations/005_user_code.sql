-- Per-user display identifier (shown in tasks, reports, dashboard, etc.)
ALTER TABLE public.users ADD COLUMN user_code TEXT;

UPDATE public.users
SET user_code = 'user-' || substr(id::text, 1, 8)
WHERE user_code IS NULL;

ALTER TABLE public.users ALTER COLUMN user_code SET NOT NULL;

CREATE UNIQUE INDEX users_user_code_unique ON public.users (user_code);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, user_code, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'user_code'), ''),
      'user-' || substr(NEW.id::text, 1, 8)
    ),
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
