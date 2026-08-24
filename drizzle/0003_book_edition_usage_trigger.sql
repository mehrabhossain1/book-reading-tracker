-- book_edition.usage_count is the ranking key for catalogue suggestions, so it
-- has to be fast (indexed) — but maintaining it from application code leaves a
-- hole: deleting a *user* cascades to their books at the database level and
-- never runs any application path, so the counter drifts upward forever.
--
-- Making it the database's job closes that hole for every path, present and
-- future: cascades, bulk SQL, admin deletes, backfills.

CREATE OR REPLACE FUNCTION book_edition_usage_sync() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.edition_id IS NOT NULL THEN
      UPDATE book_edition SET usage_count = usage_count + 1 WHERE id = NEW.edition_id;
    END IF;

  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.edition_id IS NOT NULL THEN
      -- greatest(...) is a floor, not optimism: a negative count would sort
      -- real books below unused ones.
      UPDATE book_edition SET usage_count = greatest(usage_count - 1, 0)
      WHERE id = OLD.edition_id;
    END IF;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- IS DISTINCT FROM, not <>, so a NULL on either side is handled.
    IF OLD.edition_id IS DISTINCT FROM NEW.edition_id THEN
      IF OLD.edition_id IS NOT NULL THEN
        UPDATE book_edition SET usage_count = greatest(usage_count - 1, 0)
        WHERE id = OLD.edition_id;
      END IF;
      IF NEW.edition_id IS NOT NULL THEN
        UPDATE book_edition SET usage_count = usage_count + 1 WHERE id = NEW.edition_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS book_edition_usage_sync_trigger ON book;--> statement-breakpoint

CREATE TRIGGER book_edition_usage_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON book
FOR EACH ROW EXECUTE FUNCTION book_edition_usage_sync();
--> statement-breakpoint

-- Reconcile whatever the application-maintained counter left behind.
UPDATE book_edition e
SET usage_count = COALESCE(c.n, 0)
FROM (
  SELECT edition_id, COUNT(*)::int AS n
  FROM book WHERE edition_id IS NOT NULL
  GROUP BY edition_id
) c
WHERE e.id = c.edition_id;--> statement-breakpoint

UPDATE book_edition SET usage_count = 0
WHERE id NOT IN (SELECT edition_id FROM book WHERE edition_id IS NOT NULL);
