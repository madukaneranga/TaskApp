-- Generic audit log: captures INSERT / UPDATE / DELETE on public business tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL,
  user_id uuid NULL,
  old_data jsonb NULL,
  new_data jsonb NULL,
  changed_fields text[] NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_operation_check CHECK (
    operation = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])
  )
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
  ON public.audit_logs USING btree (table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id
  ON public.audit_logs USING btree (record_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_operation
  ON public.audit_logs USING btree (operation);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
  ON public.audit_logs USING btree (table_name, record_id);

-- Returns column names whose JSON values differ between old and new rows.
CREATE OR REPLACE FUNCTION public.audit_jsonb_changed_fields(old_row jsonb, new_row jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    array_agg(n.key ORDER BY n.key),
    ARRAY[]::text[]
  )
  FROM jsonb_each(new_row) AS n(key, value)
  JOIN jsonb_each(old_row) AS o(key, value) ON n.key = o.key
  WHERE n.value IS DISTINCT FROM o.value;
$$;

-- Trigger function: writes one row to audit_logs per data change.
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_changed_fields text[];
  v_user_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'audit_logs' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id;
    v_new_data := to_jsonb(NEW);

    INSERT INTO public.audit_logs (
      table_name, record_id, operation, user_id, new_data
    ) VALUES (
      TG_TABLE_NAME, v_record_id, 'INSERT', v_user_id, v_new_data
    );

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_changed_fields := public.audit_jsonb_changed_fields(v_old_data, v_new_data);

    IF cardinality(v_changed_fields) = 0 THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.audit_logs (
      table_name, record_id, operation, user_id, old_data, new_data, changed_fields
    ) VALUES (
      TG_TABLE_NAME,
      v_record_id,
      'UPDATE',
      v_user_id,
      v_old_data,
      v_new_data,
      v_changed_fields
    );

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);

    INSERT INTO public.audit_logs (
      table_name, record_id, operation, user_id, old_data
    ) VALUES (
      TG_TABLE_NAME, v_record_id, 'DELETE', v_user_id, v_old_data
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Attach (or re-attach) the audit trigger on a single public table.
CREATE OR REPLACE FUNCTION public.attach_audit_log_trigger(p_table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table_name = 'audit_logs' THEN
    RAISE EXCEPTION 'Cannot attach audit trigger to audit_logs';
  END IF;

  IF to_regclass(format('public.%I', p_table_name)) IS NULL THEN
    RAISE EXCEPTION 'Table public.% does not exist', p_table_name;
  END IF;

  EXECUTE format(
    'DROP TRIGGER IF EXISTS audit_log_trigger ON public.%I;
     CREATE TRIGGER audit_log_trigger
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.audit_log_changes();',
    p_table_name,
    p_table_name
  );
END;
$$;

-- Enable auditing on all current business tables.
SELECT public.attach_audit_log_trigger(table_name)
FROM (
  VALUES
    ('users'),
    ('tasks'),
    ('task_members'),
    ('sessions'),
    ('session_segments'),
    ('notes'),
    ('status_history'),
    ('problem_reports')
) AS t(table_name);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
