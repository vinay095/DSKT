-- Phase 5: idempotency, PostGIS entity sync tables, temp-assignment query support

CREATE TABLE idempotency_keys (
    id               bigserial PRIMARY KEY,
    idempotency_key  varchar(128) NOT NULL,
    actor_user_id    uuid,
    http_method      varchar(16) NOT NULL,
    request_path     varchar(512) NOT NULL,
    request_hash     varchar(64) NOT NULL,
    response_status  integer NOT NULL,
    response_body    jsonb,
    created_at       timestamptz NOT NULL DEFAULT now(),
    expires_at       timestamptz NOT NULL,
    CONSTRAINT uq_idempotency_keys_scope UNIQUE (idempotency_key, http_method, request_path)
);

CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys (expires_at);

-- Normalized entity footprints synced from floor_maps.document on publish (optional analytics / spatial queries)
CREATE TABLE floor_map_entities (
    id              bigserial PRIMARY KEY,
    floor_map_id    varchar(64) NOT NULL REFERENCES floor_maps (floor_map_id) ON DELETE CASCADE,
    object_id       varchar(128) NOT NULL,
    category        varchar(64) NOT NULL,
    element_type    varchar(128) NOT NULL,
    origin_col      integer NOT NULL,
    origin_row      integer NOT NULL,
    width_cells     integer NOT NULL,
    height_cells    integer NOT NULL,
    rotation        integer NOT NULL DEFAULT 0,
    place_level     varchar(16),
    label           varchar(255),
    outline         geometry(Polygon, 0),
    synced_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_floor_map_entities_object UNIQUE (floor_map_id, object_id)
);

CREATE INDEX idx_floor_map_entities_map ON floor_map_entities (floor_map_id);
CREATE INDEX idx_floor_map_entities_outline ON floor_map_entities USING GIST (outline);

CREATE TABLE floor_map_zones (
    id              bigserial PRIMARY KEY,
    floor_map_id    varchar(64) NOT NULL REFERENCES floor_maps (floor_map_id) ON DELETE CASCADE,
    zone_id         varchar(128) NOT NULL,
    label           varchar(255),
    color           varchar(64),
    origin_col      integer NOT NULL,
    origin_row      integer NOT NULL,
    width_cells     integer NOT NULL,
    height_cells    integer NOT NULL,
    outline         geometry(Polygon, 0),
    synced_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_floor_map_zones_zone UNIQUE (floor_map_id, zone_id)
);

CREATE INDEX idx_floor_map_zones_map ON floor_map_zones (floor_map_id);
CREATE INDEX idx_floor_map_zones_outline ON floor_map_zones USING GIST (outline);

CREATE TABLE floor_map_unusable (
    id              bigserial PRIMARY KEY,
    floor_map_id    varchar(64) NOT NULL REFERENCES floor_maps (floor_map_id) ON DELETE CASCADE,
    region_id       varchar(128) NOT NULL,
    label           varchar(255),
    origin_col      integer NOT NULL DEFAULT 0,
    origin_row      integer NOT NULL DEFAULT 0,
    width_cells     integer NOT NULL DEFAULT 1,
    height_cells    integer NOT NULL DEFAULT 1,
    outline         geometry(Polygon, 0),
    synced_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_floor_map_unusable_region UNIQUE (floor_map_id, region_id)
);

CREATE INDEX idx_floor_map_unusable_map ON floor_map_unusable (floor_map_id);
CREATE INDEX idx_floor_map_unusable_outline ON floor_map_unusable USING GIST (outline);

-- Speeds scheduled expiry of temporary assignments
CREATE INDEX idx_seat_assignments_temp_expiry
    ON seat_assignments (end_date)
    WHERE status = 'active' AND is_temporary = true;

UPDATE deskit_schema_meta
SET value = '5', updated_at = now()
WHERE key = 'phase';
