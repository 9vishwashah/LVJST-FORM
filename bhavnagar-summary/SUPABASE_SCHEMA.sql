-- ============================================
-- BHAVNAGAR SUMMARY - SUPABASE TABLE SCHEMA
-- ============================================

-- TABLE 1: bhavnagar_team_summary
-- Stores captain information and team overview
CREATE TABLE bhavnagar_team_summary (
    id BIGSERIAL PRIMARY KEY,
    captain_name VARCHAR(255) NOT NULL,
    captain_number VARCHAR(20) NOT NULL,
    team_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ALTER COMMANDS - ADD NEW COLUMNS
-- ============================================

-- Add selected_day column (Day 1 or Day 2)
ALTER TABLE bhavnagar_team_summary
ADD COLUMN selected_day VARCHAR(10) NOT NULL DEFAULT 'Day 1';

-- Add total_surveys column
ALTER TABLE bhavnagar_team_summary
ADD COLUMN total_surveys INTEGER NOT NULL DEFAULT 0;

-- Enable RLS (Row Level Security) on bhavnagar_team_summary
ALTER TABLE bhavnagar_team_summary ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for form submission)
CREATE POLICY "Allow public insert on bhavnagar_team_summary"
    ON bhavnagar_team_summary FOR INSERT
    WITH CHECK (TRUE);

-- Allow public select (optional, for viewing submissions)
CREATE POLICY "Allow public select on bhavnagar_team_summary"
    ON bhavnagar_team_summary FOR SELECT
    USING (TRUE);


-- TABLE 2: team_members
-- Stores individual team member details and tasks
CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    summary_id BIGINT NOT NULL REFERENCES bhavnagar_team_summary(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    member_contact VARCHAR(20) NOT NULL,
    task_done VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security) on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for form submission)
CREATE POLICY "Allow public insert on team_members"
    ON team_members FOR INSERT
    WITH CHECK (TRUE);

-- Allow public select (optional, for viewing submissions)
CREATE POLICY "Allow public select on team_members"
    ON team_members FOR SELECT
    USING (TRUE);


-- ============================================
-- INDEXES (For better performance)
-- ============================================

-- Index on summary_id for faster lookups
CREATE INDEX idx_team_members_summary_id ON team_members(summary_id);

-- Index on created_at for sorting/filtering by date
CREATE INDEX idx_bhavnagar_team_summary_created_at ON bhavnagar_team_summary(created_at DESC);
CREATE INDEX idx_team_members_created_at ON team_members(created_at DESC);


-- ============================================
-- TABLE STRUCTURE SUMMARY
-- ============================================

/*
TABLE: bhavnagar_team_summary
- id: Unique identifier (auto-increment)
- captain_name: Captain's full name (required)
- captain_number: Captain's mobile number (required)
- team_count: Number of team members (required)
- selected_day: Selected day (Day 1 or Day 2) (required)
- total_surveys: Total number of surveys completed (required)
- created_at: Timestamp when record created
- updated_at: Timestamp when record updated

TABLE: team_members
- id: Unique identifier (auto-increment)
- summary_id: Foreign key reference to bhavnagar_team_summary
- member_name: Team member's name (required)
- member_contact: Team member's contact number (required)
- task_done: Task completed by member
  Possible values:
  - "Measuring Pratima"
  - "Form Filling"
  - "Photo/Video Capture"
  - "Other" or custom description
- created_at: Timestamp when record created
- updated_at: Timestamp when record updated

RELATIONSHIPS:
- One bhavnagar_team_summary can have many team_members
- Deleting a summary cascades delete to all related members
*/
