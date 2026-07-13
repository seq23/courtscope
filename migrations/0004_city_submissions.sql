PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS city_submissions (
  id TEXT PRIMARY KEY,
  city_slug TEXT NOT NULL,
  city_name TEXT NOT NULL,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  organization TEXT,
  submitter_role TEXT,
  source_agency TEXT NOT NULL,
  source_url TEXT,
  coverage_start TEXT NOT NULL,
  coverage_end TEXT NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'DEIDENTIFIED_REPO_READY',
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  review_note TEXT,
  workflow_receipt_id TEXT,
  request_fingerprint TEXT,
  retention_delete_at TEXT,
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_city_submissions_status ON city_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_submissions_city ON city_submissions(city_slug, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_submissions_rate ON city_submissions(request_fingerprint, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_submissions_retention ON city_submissions(retention_delete_at, status);
