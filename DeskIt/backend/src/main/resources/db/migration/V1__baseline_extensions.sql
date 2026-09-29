-- Phase 0 baseline: required extensions only.
-- Domain tables land in Phase 1+.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Schema marker for ops / health visibility.
CREATE TABLE IF NOT EXISTS deskit_schema_meta (
    key         text PRIMARY KEY,
    value       text NOT NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO deskit_schema_meta (key, value)
VALUES ('phase', '0')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();
