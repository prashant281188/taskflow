CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT NULL CHECK (description IS NULL OR length(description) <= 5000),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
