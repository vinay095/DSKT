-- Phase 2: offices / floors hierarchy + extra directory seed data

CREATE TABLE offices (
    id          varchar(64) PRIMARY KEY,
    org_id      uuid NOT NULL REFERENCES organizations (id),
    name        varchar(255) NOT NULL,
    city        varchar(255) NOT NULL,
    country     varchar(255) NOT NULL,
    timezone    varchar(64) NOT NULL DEFAULT 'UTC',
    is_active   boolean NOT NULL DEFAULT true,
    deleted_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_offices_org_id ON offices (org_id);

CREATE TABLE floors (
    id                      varchar(64) PRIMARY KEY,
    office_id               varchar(64) NOT NULL REFERENCES offices (id),
    label                   varchar(255) NOT NULL,
    short_label             varchar(128) NOT NULL,
    location_label          varchar(255) NOT NULL,
    block                   varchar(128),
    building                varchar(128),
    cloned_from_id          varchar(64) REFERENCES floors (id),
    is_custom               boolean NOT NULL DEFAULT false,
    active_published_map_id varchar(64),
    scale                   double precision,
    is_active               boolean NOT NULL DEFAULT true,
    deleted_at              timestamptz,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_floors_office_id ON floors (office_id);
CREATE INDEX idx_floors_location_label ON floors (location_label);

CREATE INDEX idx_employees_team ON employees (team);
CREATE INDEX idx_employees_status ON employees (status);
CREATE INDEX idx_employees_name ON employees (name);

-- Seed offices (matches frontend OFFICES)
INSERT INTO offices (id, org_id, name, city, country, timezone) VALUES
('office-noida',     '11111111-1111-1111-1111-111111111111', 'Noida HQ',  'Noida',     'India',   'Asia/Kolkata'),
('office-hyderabad', '11111111-1111-1111-1111-111111111111', 'Hyderabad', 'Hyderabad', 'India',   'Asia/Kolkata'),
('office-kolkata',   '11111111-1111-1111-1111-111111111111', 'Kolkata',   'Kolkata',   'India',   'Asia/Kolkata'),
('office-dubai',     '11111111-1111-1111-1111-111111111111', 'Dubai',     'Dubai',     'UAE',     'Asia/Dubai'),
('office-romania',   '11111111-1111-1111-1111-111111111111', 'Romania',   'Bucharest', 'Romania', 'Europe/Bucharest');

-- Seed floors (matches frontend SEED_FLOORS)
INSERT INTO floors (id, office_id, label, short_label, location_label, building, is_custom) VALUES
('floor-4',     'office-noida',     '4th Floor — Tech & Product Hub', '4th Floor', 'Noida 4th Floor',  'Noida HQ', false),
('floor-5',     'office-noida',     '6th Floor — Engineering',        '6th Floor', 'Noida 6th Floor',  'Noida HQ', false),
('floor-3',     'office-noida',     '3rd Floor — Global Operations',  '3rd Floor', 'Noida 3rd Floor',  'Noida HQ', false),
('floor-hyd-1', 'office-hyderabad', 'Floor 1 — Main Campus',          'Floor 1',   'Hyderabad Office', 'Hyderabad', false),
('floor-kol-1', 'office-kolkata',   'Floor 1 — Delivery Center',      'Floor 1',   'Kolkata Office',   'Kolkata', false),
('floor-dxb-1', 'office-dubai',     'Floor 1 — Regional Hub',         'Floor 1',   'Dubai Office',     'Dubai', false),
('floor-ro-1',  'office-romania',   'Floor 1 — Bucharest',            'Floor 1',   'Romania Office',   'Bucharest', false);

-- Extra directory employees for search / People views
INSERT INTO employees (
    emp_id, org_id, name, email, team, department, locations, status, avatar, title
) VALUES
(
    'EMP-1401',
    '11111111-1111-1111-1111-111111111111',
    'Priya Sharma',
    'priya.sharma@deskit.io',
    'Backend Platform',
    'Engineering',
    ARRAY['Noida 6th Floor'],
    'green',
    NULL,
    'Staff Engineer'
),
(
    'EMP-1402',
    '11111111-1111-1111-1111-111111111111',
    'James Okonkwo',
    'james.okonkwo@deskit.io',
    'Design Systems',
    'Design',
    ARRAY['Noida 4th Floor'],
    'blue',
    NULL,
    'Product Designer'
),
(
    'EMP-1403',
    '11111111-1111-1111-1111-111111111111',
    'Ananya Reddy',
    'ananya.reddy@deskit.io',
    'Talent Ops',
    'People & Culture',
    ARRAY['Hyderabad Office'],
    'yellow',
    NULL,
    'HR Business Partner'
),
(
    'EMP-1404',
    '11111111-1111-1111-1111-111111111111',
    'Daniel Costa',
    'daniel.costa@deskit.io',
    'Cloud Infra',
    'Engineering',
    ARRAY['Romania Office'],
    'green',
    NULL,
    'SRE'
),
(
    'EMP-1405',
    '11111111-1111-1111-1111-111111111111',
    'Mei Lin',
    'mei.lin@deskit.io',
    'Growth',
    'Marketing',
    ARRAY['Dubai Office'],
    'orange',
    NULL,
    'Marketing Manager'
);

UPDATE deskit_schema_meta
SET value = '2', updated_at = now()
WHERE key = 'phase';
