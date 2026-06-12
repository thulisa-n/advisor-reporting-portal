-- Run this once in the Vercel Postgres dashboard (Storage → your DB → Query tab)
-- or via: psql $POSTGRES_URL -f schema.sql

CREATE TABLE IF NOT EXISTS clients (
  id         TEXT PRIMARY KEY,
  data       JSONB        NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id         TEXT PRIMARY KEY,
  client_id  TEXT         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  year       INTEGER      NOT NULL,
  quarter    TEXT         NOT NULL,
  data       JSONB        NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_client_id_idx ON reports(client_id);
