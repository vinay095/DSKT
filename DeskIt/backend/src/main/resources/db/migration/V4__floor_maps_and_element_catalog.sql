-- Phase 3: hybrid floor maps (jsonb documents) + element catalog tables

CREATE TABLE floor_maps (
    floor_map_id      varchar(64) PRIMARY KEY,
    floor_id          varchar(64) NOT NULL REFERENCES floors (id),
    channel           varchar(16) NOT NULL,
    schema_version    integer NOT NULL DEFAULT 2,
    release_version   integer NOT NULL DEFAULT 0,
    name              varchar(255) NOT NULL,
    is_published      boolean NOT NULL DEFAULT false,
    published_at      timestamptz,
    last_modified     timestamptz NOT NULL DEFAULT now(),
    document          jsonb NOT NULL,
    floor_config      jsonb NOT NULL DEFAULT '{}'::jsonb,
    plan_document     jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT floor_maps_channel_check CHECK (channel IN ('draft', 'published')),
    CONSTRAINT floor_maps_floor_channel_unique UNIQUE (floor_id, channel)
);

CREATE INDEX idx_floor_maps_floor_id ON floor_maps (floor_id);
CREATE INDEX idx_floor_maps_published ON floor_maps (floor_id, is_published);

CREATE TABLE element_types (
    id              bigserial PRIMARY KEY,
    element_id      varchar(128) NOT NULL UNIQUE,
    element_name    varchar(255) NOT NULL,
    category        varchar(64) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_element_types_category ON element_types (category);

CREATE TABLE predefined_element_types (
    id                  bigserial PRIMARY KEY,
    element_type_id     bigint NOT NULL UNIQUE REFERENCES element_types (id) ON DELETE CASCADE,
    width_cells         integer NOT NULL,
    height_cells        integer NOT NULL,
    color               varchar(32),
    svg_asset_path      text,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE custom_element_types (
    id                  bigserial PRIMARY KEY,
    org_id              uuid REFERENCES organizations (id),
    element_type_id     bigint UNIQUE REFERENCES element_types (id) ON DELETE CASCADE,
    element_id          varchar(128) NOT NULL UNIQUE,
    label               varchar(255) NOT NULL,
    category            varchar(64) NOT NULL,
    width_cells         integer NOT NULL,
    height_cells        integer NOT NULL,
    outline             jsonb,
    svg_storage_path    text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Empty draft FloorDocument v2 for each seeded floor
INSERT INTO floor_maps (floor_map_id, floor_id, channel, schema_version, release_version, name, is_published, document, floor_config)
SELECT
    'fmap-draft-' || f.id,
    f.id,
    'draft',
    2,
    0,
    f.label,
    false,
    jsonb_build_object(
        'version', 2,
        'name', f.label,
        'a', 1,
        'floor', jsonb_build_object('cols', 12, 'rows', 12, 'a', 1),
        'entities', '[]'::jsonb,
        'zones', '[]'::jsonb,
        'customLibrary', '[]'::jsonb,
        'unusableRegions', '[]'::jsonb
    ),
    jsonb_build_object('cols', 12, 'rows', 12, 'a', 1)
FROM floors f
WHERE f.deleted_at IS NULL;

UPDATE deskit_schema_meta
SET value = '3', updated_at = now()
WHERE key = 'phase';
