-- Phase 4: seat assignments, workflow requests, audit log

CREATE TABLE seat_assignments (
    assignment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id         varchar(64) NOT NULL REFERENCES floors (id),
    floor_map_id     varchar(64) REFERENCES floor_maps (floor_map_id),
    desk_code        varchar(128) NOT NULL,
    desk_object_id   varchar(128),
    emp_id           varchar(64) NOT NULL REFERENCES employees (emp_id),
    assignment_type  varchar(32) NOT NULL DEFAULT 'permanent',
    is_temporary     boolean NOT NULL DEFAULT false,
    start_date       timestamptz,
    end_date         timestamptz,
    notes            text,
    status           varchar(32) NOT NULL DEFAULT 'active',
    assigned_by      varchar(64),
    assigned_at      timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT seat_assignments_type_check CHECK (assignment_type IN ('permanent', 'temporary')),
    CONSTRAINT seat_assignments_status_check CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX idx_seat_assignments_floor_id ON seat_assignments (floor_id);
CREATE INDEX idx_seat_assignments_emp_id ON seat_assignments (emp_id);
CREATE INDEX idx_seat_assignments_status ON seat_assignments (status);
CREATE UNIQUE INDEX uq_seat_assignments_active_desk
    ON seat_assignments (floor_id, desk_code)
    WHERE status = 'active';

CREATE TABLE seat_requests (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_id             varchar(64) NOT NULL REFERENCES employees (emp_id),
    requested_desk_id  varchar(128),
    floor_id           varchar(64) REFERENCES floors (id),
    office_id          varchar(64) REFERENCES offices (id),
    status             varchar(32) NOT NULL DEFAULT 'pending',
    notes              text,
    reviewed_by        varchar(64),
    reviewed_at        timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT seat_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_seat_requests_status ON seat_requests (status);
CREATE INDEX idx_seat_requests_emp_id ON seat_requests (emp_id);

CREATE TABLE floor_change_requests (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by_emp_id  varchar(64) NOT NULL REFERENCES employees (emp_id),
    request_type         varchar(32) NOT NULL,
    element_description  varchar(512) NOT NULL,
    details              text NOT NULL,
    floor_id             varchar(64) REFERENCES floors (id),
    status               varchar(32) NOT NULL DEFAULT 'pending',
    reviewed_by          varchar(64),
    reviewed_at          timestamptz,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT floor_change_requests_type_check CHECK (request_type IN ('add', 'remove', 'modify')),
    CONSTRAINT floor_change_requests_status_check CHECK (
        status IN ('pending', 'acknowledged', 'done', 'rejected')
    )
);

CREATE INDEX idx_floor_change_requests_status ON floor_change_requests (status);
CREATE INDEX idx_floor_change_requests_floor_id ON floor_change_requests (floor_id);

CREATE TABLE audit_events (
    id            bigserial PRIMARY KEY,
    actor_user_id uuid,
    actor_emp_id  varchar(64),
    action        varchar(64) NOT NULL,
    entity_type   varchar(64) NOT NULL,
    entity_id     varchar(128),
    before_state  jsonb,
    after_state   jsonb,
    ip_address    varchar(64),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_entity ON audit_events (entity_type, entity_id);
CREATE INDEX idx_audit_events_created_at ON audit_events (created_at DESC);
CREATE INDEX idx_audit_events_actor ON audit_events (actor_emp_id);

-- Sample pending seat request for HR queue demos
INSERT INTO seat_requests (id, emp_id, requested_desk_id, floor_id, office_id, status, notes)
VALUES (
    '33333333-3333-3333-3333-333333333301',
    'EMP-1401',
    'A-104',
    'floor-4',
    'office-noida',
    'pending',
    'Prefer near Frontend Core zone'
);

UPDATE deskit_schema_meta
SET value = '4', updated_at = now()
WHERE key = 'phase';
