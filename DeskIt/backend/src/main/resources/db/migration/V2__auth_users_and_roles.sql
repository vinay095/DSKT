-- Phase 1: identity, employees (auth-linked), app users, roles

CREATE TABLE organizations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(255) NOT NULL,
    slug        varchar(100) NOT NULL UNIQUE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE employees (
    emp_id          varchar(64) PRIMARY KEY,
    org_id          uuid NOT NULL REFERENCES organizations (id),
    name            varchar(255) NOT NULL,
    email           varchar(320) NOT NULL UNIQUE,
    team            varchar(255),
    manager_emp_id  varchar(64) REFERENCES employees (emp_id),
    department      varchar(255),
    locations       text[] NOT NULL DEFAULT '{}',
    status          varchar(32) NOT NULL DEFAULT 'white',
    avatar          text,
    title           varchar(255),
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT employees_status_check CHECK (
        status IN ('white', 'green', 'yellow', 'red', 'blue', 'orange', 'purple', 'teal')
    )
);

CREATE INDEX idx_employees_org_id ON employees (org_id);
CREATE INDEX idx_employees_department ON employees (department);

CREATE TABLE app_users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_id          varchar(64) REFERENCES employees (emp_id),
    email           varchar(320) NOT NULL UNIQUE,
    idp_subject     varchar(512),
    idp_issuer      varchar(512),
    display_name    varchar(255) NOT NULL,
    last_login_at   timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT app_users_idp_unique UNIQUE (idp_issuer, idp_subject)
);

CREATE INDEX idx_app_users_emp_id ON app_users (emp_id);

CREATE TABLE user_roles (
    id          bigserial PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
    role        varchar(32) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK (role IN ('EMPLOYEE', 'HR', 'ADMIN')),
    CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);

-- Seed demo org + SSO personas (matches frontend MOCK_USERS)
INSERT INTO organizations (id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'DeskIt Demo', 'deskit-demo');

INSERT INTO employees (
    emp_id, org_id, name, email, team, department, locations, status, avatar, title
) VALUES
(
    'EMP-1304',
    '11111111-1111-1111-1111-111111111111',
    'Alex Rivera',
    'alex.rivera@deskit.io',
    'Frontend Core',
    'Engineering',
    ARRAY['Noida 4th Floor'],
    'green',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Senior Frontend Engineer'
),
(
    'EMP-1305',
    '11111111-1111-1111-1111-111111111111',
    'Sarah Jenkins',
    'sarah.jenkins@deskit.io',
    'Workplace Ops',
    'People & Culture',
    ARRAY['Noida 4th Floor'],
    'green',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'Head of Workplace Operations'
),
(
    'EMP-1306',
    '11111111-1111-1111-1111-111111111111',
    'Marcus Vance',
    'marcus.vance@deskit.io',
    'Workplace Ops',
    'Facilities & Infrastructure',
    ARRAY['Noida 4th Floor'],
    'green',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'Global Facilities Admin'
);

INSERT INTO app_users (id, emp_id, email, display_name, idp_subject, idp_issuer)
VALUES
(
    '22222222-2222-2222-2222-222222222201',
    'EMP-1304',
    'alex.rivera@deskit.io',
    'Alex Rivera',
    'dev|EMP-1304',
    'deskit-dev'
),
(
    '22222222-2222-2222-2222-222222222202',
    'EMP-1305',
    'sarah.jenkins@deskit.io',
    'Sarah Jenkins',
    'dev|EMP-1305',
    'deskit-dev'
),
(
    '22222222-2222-2222-2222-222222222203',
    'EMP-1306',
    'marcus.vance@deskit.io',
    'Marcus Vance',
    'dev|EMP-1306',
    'deskit-dev'
);

INSERT INTO user_roles (user_id, role) VALUES
('22222222-2222-2222-2222-222222222201', 'EMPLOYEE'),
('22222222-2222-2222-2222-222222222202', 'HR'),
('22222222-2222-2222-2222-222222222203', 'ADMIN');

UPDATE deskit_schema_meta
SET value = '1', updated_at = now()
WHERE key = 'phase';
