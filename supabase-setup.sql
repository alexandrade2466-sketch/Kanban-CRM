-- Kanban CRM - Supabase Setup
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste and Run
-- If you get "policy already exists" errors, your tables may already be set up.

-- Pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Stages table
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES stages(id) ON DELETE SET NULL,
  title text,
  value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notes table (attached to deals, like GHL contact notes)
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (your app uses the anon key)
-- Replace with auth policies if you add user login later
DROP POLICY IF EXISTS "Allow all pipelines" ON pipelines;
DROP POLICY IF EXISTS "Allow all stages" ON stages;
DROP POLICY IF EXISTS "Allow all deals" ON deals;
DROP POLICY IF EXISTS "Allow all notes" ON notes;

CREATE POLICY "Allow all pipelines" ON pipelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all stages" ON stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deals" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all notes" ON notes FOR ALL USING (true) WITH CHECK (true);
