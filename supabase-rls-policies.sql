-- Fix "new row violates row-level security policy" when adding stages/deals/etc.
-- Run in Supabase → SQL Editor. Safe to run more than once.

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all pipelines" ON pipelines;
DROP POLICY IF EXISTS "Allow all stages" ON stages;
DROP POLICY IF EXISTS "Allow all deals" ON deals;
DROP POLICY IF EXISTS "Allow all notes" ON notes;

CREATE POLICY "Allow all pipelines" ON pipelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all stages" ON stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deals" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all notes" ON notes FOR ALL USING (true) WITH CHECK (true);
