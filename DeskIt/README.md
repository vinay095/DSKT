# DeskIt (DSKT)

Office **workspace mapping** and **seating management** platform.

Admins design floors as a logical spatial model; HR assigns seats; employees view maps and find people.

> **Core idea:** The mapper creates a logical spatial model. The backend persists that model. The viewer renders that model.

---

## Product docs

| Document | Description |
|----------|-------------|
| **[PRD.md](./PRD.md)** | Product Requirements Document — vision, roles, requirements, roadmap |
| **[DeskIt-Implementation-Plan.pdf](./DeskIt-Implementation-Plan.pdf)** | What is built vs planned (downloadable plan) |
| [creator/document.md](./creator/document.md) | Mapper technical geometry / `FloorDocument` details |
| [creator/grid-ui/FEATURES.txt](./creator/grid-ui/FEATURES.txt) | Floor planner capability checklist |

For deep architecture and grid math, see the parent repo handoff specification:  
`Workspace Management System — Complete AI Handoff Specification.md`

---

## Repository layout

```text
DeskIt/
├── PRD.md                 # Product requirements
├── README.md              # This file
├── frontend/              # DeskIt Viewer / Manager (Employee, HR, Admin)
├── creator/
│   └── grid-ui/           # Floor Creator / Mapper (Admin editor)
└── assets/                # SVG furniture & catalog
```

| App | Path | Stack |
|-----|------|--------|
| **Mapper (Creator)** | `creator/grid-ui` | React 19, TypeScript, Vite, SVG, Vitest, jsPDF |
| **Viewer / Manager** | `frontend` | React 18, TypeScript, Vite, Tailwind, Lucide |
| **Backend** | — | Planned (Spring Boot + PostgreSQL per handoff) |

---

## Current status

**Prototype (frontend-complete, backend pending)**

- Floor Creator: hierarchical grid, catalog, zones, unusable regions, drafts, export, publish bridge.
- DeskIt app: role-based UX for Employee / HR / Admin; seat allocation; find people; drafts/publish (client-side).
- Persistence today: browser `localStorage` + mock data (optional Supabase client not production-wired).
- Auth today: demo SSO / role switch — not enterprise SSO.

See [PRD.md](./PRD.md) §11–12 and the implementation plan PDF for the full done vs future breakdown.

---

## Roles (summary)

| Role | Can do |
|------|--------|
| **Employee** | View maps, find colleagues |
| **HR** | Allocate seats, manage requests, people & teams |
| **Admin** | Edit/publish/clone floor plans, manage change requests |

---

## Getting started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (or compatible package manager)

### Run the DeskIt app (Viewer / Manager)

```bash
cd frontend
npm install
npm run dev
```

### Run the Floor Creator (Mapper)

```bash
cd creator/grid-ui
npm install
npm run dev
```

Admin in the DeskIt app can embed/open the Creator for editing and publishing floors.

### Useful scripts

| App | Command | Purpose |
|-----|---------|---------|
| `frontend` | `npm run dev` | Local development |
| `frontend` | `npm run build` | Production build |
| `creator/grid-ui` | `npm run dev` | Local planner |
| `creator/grid-ui` | `npm run test` | Geometry / unit tests |
| `creator/grid-ui` | `npm run build` | Production build |

---

## Data contract

Published floors use **`FloorDocument` v2** (JSON): entities, zones, custom library, unusable regions, viewport, theme.  
Coordinates are stored in finest grid cells (`a/16`). Details: [creator/document.md](./creator/document.md).

Conceptual domain model:

```text
Organization → Office → Floor → FloorDocument / FloorPlan → Elements → Seats
Employee → Team → SeatAssignment → Desk
```

---

## Roadmap (high level)

1. **Done (prototype):** Mapper, publish bridge, role UX, mock seating/people workflows.  
2. **Next:** Backend + database + real SSO as system of record.  
3. **Then:** Durable requests/history, wall/door geometry polish, routing & hardening.

Full requirements and acceptance criteria: **[PRD.md](./PRD.md)**.

---

## Contributing notes

- Prefer changing the logical `FloorDocument` over baking presentation state into persistence.
- Keep Creator as the geometry editor; do not extend legacy unused editors.
- Update **PRD.md** when product scope changes; keep this README in sync for status and run instructions.
