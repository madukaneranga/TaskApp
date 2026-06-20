-- Manual Table Editor / SQL updates have no JWT, so auth.uid() is NULL.
-- Fall back to assigned_to or created_by for status_history.changed_by.

CREATE OR REPLACE FUNCTION public.log_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_by uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_changed_by := COALESCE(auth.uid(), NEW.assigned_to, NEW.created_by);

    IF v_changed_by IS NOT NULL THEN
      INSERT INTO public.status_history (task_id, old_status, new_status, changed_by)
      VALUES (NEW.id, OLD.status, NEW.status, v_changed_by);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
