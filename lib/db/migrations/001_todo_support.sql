-- Migration: Add Todo List Support
-- Date: 2026-08-19
-- Description: Extends tasks table to support unscheduled todos alongside scheduled tasks
-- Changes:
--   1. Make time-related fields nullable (backwards compatible)
--   2. Add is_scheduled flag to distinguish todos from calendar tasks
--   3. Add category field for organizing todos
--   4. Add sort_order for manual todo list ordering
--   5. Add index for efficient unscheduled task queries

-- Make time fields and session_id nullable to support unscheduled todos
ALTER TABLE tasks
  ALTER COLUMN session_id DROP NOT NULL,
  ALTER COLUMN start_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL,
  ALTER COLUMN start_hour DROP NOT NULL,
  ALTER COLUMN duration DROP NOT NULL;

-- Add todo-specific fields
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS category VARCHAR(64),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Create index for efficient todo queries (partial index on unscheduled tasks only)
CREATE INDEX IF NOT EXISTS idx_tasks_unscheduled
  ON tasks(calendar_id, is_scheduled, sort_order)
  WHERE is_scheduled = FALSE;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_tasks_category
  ON tasks(calendar_id, category)
  WHERE category IS NOT NULL;

-- Update existing tasks to be explicitly marked as scheduled (for clarity)
UPDATE tasks
SET is_scheduled = TRUE
WHERE is_scheduled IS NULL;

-- Backfill sort_order for any future unscheduled tasks (auto-increment based on creation)
-- New todos will get sort_order assigned by application logic
