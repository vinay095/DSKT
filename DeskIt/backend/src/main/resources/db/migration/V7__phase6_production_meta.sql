-- Phase 6 marker: production hardening (rate limits, observability, security)

UPDATE deskit_schema_meta
SET value = '6', updated_at = now()
WHERE key = 'phase';

INSERT INTO deskit_schema_meta (key, value)
VALUES ('api_source_of_truth', 'spring-boot')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();
