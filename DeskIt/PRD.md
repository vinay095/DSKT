# DeskIt (DSKT) — Product Requirements Document (PRD)

| Field | Value |
|-------|--------|
| Product | DeskIt (DSKT) |
| Domain | Office workspace mapping & seating management |
| Document type | Product Requirements Document |
| Status | Living document (aligned to current prototype + planned production) |
| Last updated | 29 September 2026 |
| Related | [README.md](./README.md), [Implementation Plan PDF](./DeskIt-Implementation-Plan.pdf), parent AI Handoff Specification |

---

## 1. Problem statement

Organizations need a single place to:

- Map physical office floors accurately.
- Publish approved layouts to the business.
- Assign people to seats (permanent or temporary).
- Help employees find colleagues and understand where teams sit.
- Track layout and seating changes over time.

Today many teams rely on static drawings, spreadsheets, or disconnected tools. That causes stale maps, unclear ownership of seats, and slow HR/admin workflows.

---

## 2. Product vision

Build an **office workspace mapping and seating-management platform** with a visual interaction model inspired by Figma/Canva-style editors and office seating planners (e.g. Pudone, Arcada-style tools).

**Core principle**

> The mapper creates a logical spatial model. The backend persists that model. The viewer renders that model.

The foundation is a **mathematical, hierarchical, discrete spatial grid** — not pixel drawings as the source of truth.

---

## 3. Goals & non-goals

### 3.1 Goals

- Define office dimensions using a base spatial unit `a`.
- Build floor plans on a hierarchical grid.
- Place furniture, zones, and structural/unusable regions.
- Zoom, pan, snap, move, resize, and rotate objects by 90°.
- Save drafts, export, and publish approved plans.
- Support multi-office / multi-floor.
- Let HR assign employees to seats and manage seating requests.
- Let employees view maps and find people.
- Support Admin draft → review → publish workflows.
- Persist layout and seating history in production.

### 3.2 Non-goals (current horizon)

- 3D / BIM authoring.
- Real-time collaborative multiplayer editing (Google Docs–style).
- Full facilities / IoT sensor platform.
- Payroll, HRIS replacement, or badge-access control systems.
- Microservices-heavy architecture for v1.

---

## 4. Users & roles

| Role | Primary jobs |
|------|----------------|
| **Admin** | Create/edit floor geometry; manage drafts; publish/clone floors; handle floor-change requests |
| **HR** | Allocate seats; manage people/teams; approve seat requests; request floor layout changes |
| **Employee** | View published maps; find colleagues; see own/team seating context |

### 4.1 Permission summary

| Capability | Employee | HR | Admin |
|------------|:--------:|:--:|:-----:|
| View published floor maps | Yes | Yes | Yes |
| Find people / locate seats | Yes | Yes | Limited |
| People & teams directory | No | Yes | No |
| Allocate / reassign seats | No | Yes | No (routine) |
| Approve seat requests | No | Yes | No |
| Submit floor-change request | No | Yes | No |
| Manage floor-change requests | No | No | Yes |
| Edit floor plan geometry | No | No | Yes |
| Publish / clone / drafts | No | No | Yes |

Frontend permissions are for UX and defense-in-depth; **the backend must be authoritative** once present.

---

## 5. Product architecture (logical)

```text
                 DESKIT / WORKSPACE MANAGEMENT
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      FRONTEND 1                  FRONTEND 2
   Workspace Mapper              Workspace Viewer
    (Creator / Editor)             / Manager
              │                         │
              │ FloorDocument JSON      │ consumes published JSON
              └────────────┬────────────┘
                           ▼
                        BACKEND
                           │
                           ▼
                       DATABASE
```

| Component | Location (repo) | Responsibility |
|-----------|-----------------|----------------|
| Mapper | `creator/grid-ui` | Author logical `FloorDocument` |
| Viewer / Manager | `frontend` | Role-based seating & map UX |
| Assets | `assets/` | SVG furniture / structure catalog |
| Backend (planned) | not yet in repo | Persist model, auth, APIs |
| DB (planned) | PostgreSQL (handoff) | System of record |

**Separation rule:** Backend stores logical world coordinates/cells. It must not depend on browser pixels, zoom, pan, selection, or hover state.

---

## 6. Functional requirements

### 6.1 Mapper (Admin — Creator)

| ID | Requirement | Priority | Prototype status |
|----|-------------|----------|------------------|
| M-01 | First-quadrant Y-up world with hierarchical grid (`2a` / `a` / `a/4` / `a/16`) | P0 | Done |
| M-02 | Cursor-anchored zoom, pan, Fit, adaptive grid density | P0 | Done |
| M-03 | Catalog library; place / move / resize / 90° rotate; snap | P0 | Done |
| M-04 | Custom polygons → zones, unusable regions, or custom library | P0 | Done |
| M-05 | Named zones and labeled unusable regions that block overlap | P0 | Done |
| M-06 | Undo/redo; draft save/load (`FloorDocument` v2) | P0 | Done |
| M-07 | Export PNG / SVG / PDF; JSON import/export | P1 | Done |
| M-08 | Import geometry hints from floor-plan image | P1 | Done |
| M-09 | Publish document to DeskIt (bridge) | P0 | Done (client) |
| M-10 | Wall/door polyline model with openings | P1 | Partial / future |
| M-11 | Configurable hierarchy levels (beyond fixed ladder) | P2 | Future |
| M-12 | Real-world units (meters/feet) display | P2 | Future |

### 6.2 Viewer / Manager (DeskIt frontend)

| ID | Requirement | Priority | Prototype status |
|----|-------------|----------|------------------|
| V-01 | Role-based shell (Employee / HR / Admin) | P0 | Done (demo auth) |
| V-02 | Multi-office / multi-floor selection | P0 | Done (mock) |
| V-03 | Render published `FloorDocument` as interactive map | P0 | Done |
| V-04 | Employee: Home, Floor Maps, Find People | P0 | Done |
| V-05 | HR: seat allocation (permanent/temporary), team area assign | P0 | Done (local) |
| V-06 | HR: people & teams directory; seat requests | P0 | Done (mock) |
| V-07 | HR → Admin floor-change requests | P1 | Done (local) |
| V-08 | Admin: embed Creator; drafts; publish; clone | P0 | Done (local) |
| V-09 | Version / live / draft indicators | P1 | Done (client labels) |
| V-10 | Presence / occupancy status visualization | P2 | Done (mock) |
| V-11 | Deep-linkable URL routes (floor, person, tab) | P1 | Future |
| V-12 | Movement / seating change history | P1 | Future |

### 6.3 Backend & platform (production)

| ID | Requirement | Priority | Prototype status |
|----|-------------|----------|------------------|
| B-01 | Persist offices, floors, `FloorDocument`, versions | P0 | Not started |
| B-02 | Persist employees, teams, seat assignments | P0 | Not started |
| B-03 | Persist seat requests & floor-change requests | P0 | Not started |
| B-04 | Real SSO + server-side role enforcement | P0 | Demo only |
| B-05 | REST (or equivalent) API consumed by both frontends | P0 | Not started |
| B-06 | Audit / MovementHistory | P1 | Not started |
| B-07 | Version history restore for published plans | P1 | Not started |

**Target stack (handoff):** Java, Spring Boot, Spring Security, Spring Data JPA, PostgreSQL.  
**Current prototype persistence:** browser `localStorage` + mock data; optional Supabase client stubs without production wiring.

---

## 7. Data model (conceptual)

```text
Organization
  └── Office
        └── Floor
              └── FloorPlan / FloorDocument (draft | live versions)
                    └── Elements / Entities
                          └── Seats / Desks

Employee ──► Team
Employee ──► SeatAssignment ──► Desk/Seat

SeatAssignmentRequest
FloorChangeRequest
MovementHistory (planned)
```

**Interchange document:** `FloorDocument` v2 — entities, zones, custom library, unusable regions, viewport, theme. Storage coordinates use finest cells (`a/16`).

---

## 8. User journeys

### 8.1 Admin publishes a floor

1. Admin opens Floor Plan Editor (Creator).
2. Sets floor size; places desks, rooms, zones, unusable areas.
3. Saves draft; optionally exports for review.
4. Publishes → Live version for HR and Employees.
5. Can clone floors or manage drafts/versions.

### 8.2 HR assigns seating

1. HR opens Seat Allocation / Floor Maps for a published floor.
2. Selects desk(s) or area; assigns employee or team.
3. Chooses permanent or temporary assignment.
4. Optionally processes seat requests (approve/reject).
5. May submit a floor-change request when geometry changes are needed.

### 8.3 Employee finds a colleague

1. Employee opens Find People or Floor Maps.
2. Searches by name/team.
3. Sees seat highlighted on the published map.
4. Views presence/status if available.

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Correctness | Geometry round-trip: save → load → save preserves logical cells |
| Performance | Interactive pan/zoom on large floors; publish payloads remain manageable |
| Security | Role-based access; SSO in production; no trusting client role alone |
| Reliability | Server is system of record; drafts/live versions recoverable |
| Usability | CAD-like zoom/pan; clear role navigation; publish vs draft clarity |
| Maintainability | Mapper and viewer share document contract; presentation state stays out of DB |
| Accessibility | Keyboard where practical; readable labels on maps; theme support |

---

## 10. Success metrics

| Metric | Intent |
|--------|--------|
| Time to publish first floor plan | Admin can map & publish a real floor without engineering help |
| % seats assigned via DeskIt | HR uses DeskIt as primary seating tool |
| Find-colleague success | Employees locate a person on the map in under 30 seconds |
| Stale-map incidents | Reduction in “wrong floor plan” support tickets |
| Version restore usage | Admins can recover prior live layouts when needed |

---

## 11. Current vs target state

| Layer | Current (prototype) | Target (production) |
|-------|---------------------|---------------------|
| Mapper | SVG Creator with rich editing | Same contract; wall/door polish |
| Viewer | Full role UX on mocks | Same UX on live APIs |
| Auth | Demo SSO + role switch | Enterprise SSO + server roles |
| Persistence | `localStorage` / mocks | PostgreSQL (+ API) |
| History | Version labels | Full version + movement history |
| Routing | In-app tabs | Deep links |

---

## 12. Release roadmap (requirements view)

| Phase | Theme | Outcome |
|-------|--------|---------|
| **0** | Foundation | Vision, two-frontend split, catalog |
| **1** | Mapper milestone | Correct grid, edit, serialize (`FloorDocument`) |
| **2** | Publish bridge | Creator → DeskIt published maps |
| **3** | Role UX | Employee / HR / Admin workflows (prototype) |
| **4** | Production platform | Backend, DB, real SSO *(next priority)* |
| **5** | Durable workflows | Requests, audit, movement history |
| **6** | Geometry polish | Walls/doors; editor cleanup |
| **7** | Hardening | Routing, performance, docs, ops |

Phases 0–3 are substantially reflected in the current prototype. Phases 4–7 are the forward product plan.

---

## 13. Open decisions

1. **Backend choice:** Spring Boot + PostgreSQL (handoff default) vs finishing optional Supabase path.
2. **Grid configurability:** Keep fixed level ladder vs fully configurable hierarchy.
3. **Rendering stack:** Keep shipped SVG approach vs re-align to Konva/Zustand from original handoff.
4. **Units:** Remain in abstract `a` vs expose meters/feet in UI.
5. **Hosting:** How Creator and DeskIt are deployed together (same origin vs hardened cross-origin iframe).

---

## 14. Out-of-scope assumptions & constraints

- Prototype may reset when browser storage is cleared.
- ~999 employees and teams in the demo are mock data.
- Handoff Milestone 1 intentionally excluded full employee/team product scope; that scope is now in the DeskIt frontend prototype and must be backed by a real server for production.

---

## 15. Acceptance criteria (production-ready product)

The product is production-ready when:

1. Admin can create, draft, and publish a floor plan that survives logout/new device.
2. HR can assign and reassign seats with durable assignments visible to Employees.
3. Employees can search and locate colleagues on the correct published map.
4. Roles are enforced server-side via real SSO.
5. Floor and seating history can be audited and (for layouts) restored.
6. Logical geometry remains independent of any specific frontend renderer.

---

## 16. Document ownership

| Artifact | Purpose |
|----------|---------|
| This PRD | Product requirements & acceptance |
| [README.md](./README.md) | Project overview & how to run |
| `creator/document.md` | Mapper technical geometry details |
| `creator/grid-ui/FEATURES.txt` | Mapper capability checklist |
| Parent handoff specification | Deep architecture / math reference |
| `DeskIt-Implementation-Plan.pdf` | Progress & future implementation plan |

Changes to scope should update this PRD and the README summary in the same change set (docs only unless implementation is intended).
