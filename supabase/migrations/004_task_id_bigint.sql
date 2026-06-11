-- task_id is numeric so ORDER BY task_id DESC sorts 545456 before 54547
ALTER TABLE public.tasks DROP COLUMN IF EXISTS task_id_numeric;

ALTER TABLE public.tasks
  ALTER COLUMN task_id TYPE BIGINT USING (task_id::bigint);
