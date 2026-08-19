CREATE TABLE IF NOT EXISTS calendars (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'My Weekly Schedule',
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  passcode_hash VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id VARCHAR(64) NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calendar_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  calendar_id VARCHAR(64) NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- Nullable for global unscheduled todos
  name TEXT NOT NULL,
  start_time VARCHAR(32),      -- Nullable for unscheduled todos
  end_time VARCHAR(32),        -- Nullable for unscheduled todos
  start_hour NUMERIC,          -- Nullable for unscheduled todos
  duration NUMERIC,            -- Nullable for unscheduled todos
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_days TEXT[] NOT NULL DEFAULT '{}',
  days TEXT[] NOT NULL DEFAULT '{}',
  color VARCHAR(64) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Todo list support fields (added 2026-08-19)
  is_scheduled BOOLEAN NOT NULL DEFAULT TRUE,  -- false = unscheduled todo, true = scheduled task
  category VARCHAR(64),                        -- Category/tag for organizing todos
  sort_order INTEGER                           -- Manual ordering in todo list
);

CREATE INDEX IF NOT EXISTS idx_sessions_calendar_id ON sessions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_id ON tasks(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendars_last_accessed ON calendars(last_accessed_at);
-- Todo list indexes (added 2026-08-19)
CREATE INDEX IF NOT EXISTS idx_tasks_unscheduled ON tasks(calendar_id, is_scheduled, sort_order) WHERE is_scheduled = FALSE;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(calendar_id, category) WHERE category IS NOT NULL;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  calendar_id VARCHAR(64) REFERENCES calendars(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_calendar_id ON push_subscriptions(calendar_id);
