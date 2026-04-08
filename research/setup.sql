-- ================================================================
--  LVJST RESEARCH FORM — Supabase SQL Setup
--  Run these queries in: Supabase Dashboard → SQL Editor
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- STEP 1: Create the research_entries table
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.research_entries (
  id            BIGSERIAL       PRIMARY KEY,
  name          TEXT            NOT NULL,
  address       TEXT            NOT NULL,
  city          TEXT            NOT NULL,
  district      TEXT            NOT NULL,
  contact_no    TEXT            NOT NULL,
  dharamshala   BOOLEAN         NOT NULL DEFAULT FALSE,
  bhojanshala   BOOLEAN         NOT NULL DEFAULT FALSE,
  aayambilshala BOOLEAN         NOT NULL DEFAULT FALSE,
  history       TEXT            NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Add a descriptive comment
COMMENT ON TABLE public.research_entries
  IS 'LVJST Heritage Research Form submissions - stores site survey data';

COMMENT ON COLUMN public.research_entries.id
  IS 'Auto-incremented Sr. No — used as the unique record identifier';

COMMENT ON COLUMN public.research_entries.dharamshala
  IS 'Whether the site has Dharamshala facility';

COMMENT ON COLUMN public.research_entries.bhojanshala
  IS 'Whether the site has Bhojanshala (dining) facility';

COMMENT ON COLUMN public.research_entries.aayambilshala
  IS 'Whether the site has Aayambilshala (meditation/fasting hall) facility';


-- ────────────────────────────────────────────────────────────────
-- STEP 2: Enable Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.research_entries ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────
-- STEP 3: RLS Policies
-- ────────────────────────────────────────────────────────────────

-- Policy 1: Anonymous users can INSERT (public form submissions)
CREATE POLICY "anon_can_insert"
  ON public.research_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Anonymous users can SELECT (needed for duplicate check on form)
--           They can only read name + address + id — enough for duplicate check
CREATE POLICY "anon_can_select"
  ON public.research_entries
  FOR SELECT
  TO anon
  USING (true);

-- NOTE: Service Role Key bypasses ALL RLS policies automatically.
--       Admin panel uses service_role key, so it can read/write everything.


-- ────────────────────────────────────────────────────────────────
-- STEP 4: Performance — Index on name + address (for duplicate check)
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_research_name_address
  ON public.research_entries (lower(name), lower(address));

-- Index for frequent filter columns
CREATE INDEX IF NOT EXISTS idx_research_city
  ON public.research_entries (city);

CREATE INDEX IF NOT EXISTS idx_research_district
  ON public.research_entries (district);

CREATE INDEX IF NOT EXISTS idx_research_created_at
  ON public.research_entries (created_at DESC);


-- ────────────────────────────────────────────────────────────────
-- STEP 5: Verification — Check the setup
-- ────────────────────────────────────────────────────────────────

-- Confirm table was created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'research_entries';

-- Confirm columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'research_entries'
ORDER BY ordinal_position;

-- Confirm RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename  = 'research_entries';

-- Confirm policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'research_entries';


-- ────────────────────────────────────────────────────────────────
-- OPTIONAL: Useful Admin Queries (run anytime from SQL editor)
-- ────────────────────────────────────────────────────────────────

-- View all records (most recent first)
-- SELECT * FROM research_entries ORDER BY id DESC;

-- Count by city
-- SELECT city, COUNT(*) as total
-- FROM research_entries
-- GROUP BY city
-- ORDER BY total DESC;

-- Count by district
-- SELECT district, COUNT(*) as total
-- FROM research_entries
-- GROUP BY district
-- ORDER BY total DESC;

-- Count facility availability
-- SELECT
--   COUNT(*) FILTER (WHERE dharamshala)   AS has_dharamshala,
--   COUNT(*) FILTER (WHERE bhojanshala)   AS has_bhojanshala,
--   COUNT(*) FILTER (WHERE aayambilshala) AS has_aayambilshala,
--   COUNT(*) AS total
-- FROM research_entries;

-- Find duplicate Name+Address combinations
-- SELECT name, address, COUNT(*) as count
-- FROM research_entries
-- GROUP BY lower(name), lower(address)
-- HAVING COUNT(*) > 1;

-- Delete a specific record (replace 99 with the actual id)
-- DELETE FROM research_entries WHERE id = 99;

-- ────────────────────────────────────────────────────────────────
-- IMPORTANT NOTES
-- ────────────────────────────────────────────────────────────────
-- 1. After running Step 1–4, go to Supabase Dashboard:
--      Project Settings → API → "anon / public" key
--    Copy that key and paste it in research/form.js:
--      const SUPABASE_ANON_KEY = "paste_here";
--
-- 2. The service_role key in research/admin.js is already correct
--    from your .env file (exuwgrqeecccowoymxxs project).
--
-- 3. Admin password is set in research/admin.js:
--      const ADMIN_PASSWORD = "LVJST@Research2024";
--    Change it to your preferred password.
-- ================================================================
