# Floor Plan Creator --- Agent Implementation Plan

## 1. Project Overview

The Floor Plan Creator is a web-based, grid-driven 2D workspace editor
for creating structured digital floor plans.

The application combines:

-   A mathematical-graph-style square grid
-   Adjustable floor dimensions
-   Adjustable grid precision
-   Pan and zoom
-   Grid snapping
-   Drawing and editing of geometric elements
-   Semantic element types such as rooms, desks, chairs, tables, sofas
    and plants
-   Human-readable labels
-   Configurable integer codes for semantic types
-   Weighted room/edge representation
-   Door placement
-   Shared/intersecting edge detection
-   Optional edge merging
-   Vector-based floor-plan persistence
-   Compilation of vector geometry into square matrices
-   Matrix preview and export
-   Backend integration

The core pipeline is:

``` text
User
  |
  v
React UI
  |
  v
React-Konva Canvas
  |
  v
Vector Floor Plan Model
  |
  +-------------------+
  |                   |
  v                   v
Geometry Engine    Semantic Engine
  |                   |
  +---------+---------+
            |
            v
     Spatial Relations
            |
            v
      Matrix Compiler
            |
            +----------------------+
            |          |           |
            v          v           v
       Semantic     Edge       Door/Occupancy
       Matrix       Matrix       Matrices
            |
            v
         Backend
```

## 2. Critical Architecture Principle

**The vector floor-plan model is the single source of truth.**

React-Konva is only the rendering and interaction layer.

The matrix is a **compiled representation**, not the source of truth.

Never design the system so that:

``` text
Canvas pixels -> matrix -> persisted floor plan
```

Instead:

``` text
Vector geometry -> semantic model -> matrix
```

This allows the floor plan to be edited accurately regardless of zoom
level and allows future features such as AI floor-plan recognition,
pathfinding, seat mapping and workspace analytics.

------------------------------------------------------------------------

# 3. Technology Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   React-Konva
-   Konva
-   Redux Toolkit
-   React Redux
-   Tailwind CSS

## Geometry

Initially evaluate/use:

-   Turf.js for common geometric operations
-   Custom TypeScript geometry utilities for application-specific
    operations

Potential operations:

-   point/line intersection
-   line overlap
-   polygon containment
-   bounding boxes
-   geometry validation
-   distance calculations

## Spatial Indexing

Use `rbush` only when profiling demonstrates a need for spatial
indexing.

Recommended architecture:

``` text
RBush
  |
  | broad-phase candidate search
  v
Exact geometry calculation
  |
  v
Intersection/relationship result
```

Do not prematurely optimize with RBush.

## IDs

Use `nanoid` or an equivalent collision-safe ID generator.

## Validation

Use `zod` for runtime validation of persisted/imported floor-plan data
where appropriate.

## Testing

-   Vitest
-   React Testing Library
-   Playwright

## Backend

The frontend should remain backend-agnostic but should be designed for:

-   Java
-   Spring Boot
-   REST APIs
-   PostgreSQL
-   Redis where required

------------------------------------------------------------------------

# 4. Agent Operating Rules

All coding agents working on this repository MUST follow these rules.

## Rule 1 --- Preserve the vector source of truth

Do not store the floor plan primarily as Konva nodes.

Do not derive persistent domain state from rendered canvas pixels.

## Rule 2 --- Domain code must be UI independent

The following must not import React or Konva:

``` text
src/domain/floorplan/
```

This includes:

-   geometry calculations
-   coordinate conversion
-   semantic definitions
-   edge extraction
-   intersection detection
-   rasterization
-   matrix compilation
-   validation

## Rule 3 --- Do not mix coordinate systems

The application has three coordinate spaces:

``` text
World coordinates
Grid coordinates
Screen coordinates
```

Screen coordinates must never be persisted as floor-plan geometry.

## Rule 4 --- Do not hard-code semantic codes in renderers

Bad:

``` typescript
if (type === "MEETING_ROOM") {
    value = 5;
}
```

Good:

``` typescript
semanticRegistry.get(type).matrixCode
```

## Rule 5 --- Normalize Konva transforms

Konva Transformer may modify `scaleX` and `scaleY`.

Before persistence, convert the transformation into domain-level:

``` text
width
height
position
rotation
```

Do not persist arbitrary Konva scale values as the domain geometry.

## Rule 6 --- Every user mutation must be undoable

Examples:

``` text
ADD_ELEMENT
DELETE_ELEMENT
MOVE_ELEMENT
RESIZE_ELEMENT
ROTATE_ELEMENT
CHANGE_TYPE
CHANGE_LABEL
ADD_DOOR
MOVE_DOOR
MERGE_EDGE
UNMERGE_EDGE
CHANGE_GRID
```

Transient pointer movement should not create hundreds of history
entries.

## Rule 7 --- Prefer pure functions

Geometry and compiler functions should be deterministic and side-effect
free.

## Rule 8 --- Do not introduce libraries unnecessarily

Before adding a dependency:

1.  Check whether an existing dependency can solve the problem.
2.  Check whether a small internal utility is sufficient.
3.  Add the dependency only if it materially improves correctness,
    maintainability or performance.

## Rule 9 --- Do not modify unrelated code

Agents must keep changes scoped to the requested phase.

## Rule 10 --- Never declare a phase complete with failing checks

Before completing a phase:

``` bash
npm run typecheck
npm run lint
npm test
npm run build
```

Use the project's actual scripts if these names differ.

Report any unavailable script instead of silently skipping validation.

------------------------------------------------------------------------

# 5. Recommended Directory Structure

Adapt this structure to the existing repository instead of destroying an
existing architecture.

``` text
src/
|
+-- app/
|   +-- store.ts
|   +-- hooks.ts
|
+-- components/
|   +-- floorplan/
|       |
|       +-- editor/
|       |   +-- FloorPlanEditor.tsx
|       |   +-- EditorToolbar.tsx
|       |   +-- EditorSidebar.tsx
|       |   +-- PropertiesPanel.tsx
|       |   +-- StatusBar.tsx
|       |   +-- MatrixPreview.tsx
|       |
|       +-- canvas/
|       |   +-- FloorPlanStage.tsx
|       |   +-- GridLayer.tsx
|       |   +-- FloorBoundary.tsx
|       |   +-- ElementsLayer.tsx
|       |   +-- EdgeLayer.tsx
|       |   +-- SelectionLayer.tsx
|       |   +-- GuidesLayer.tsx
|       |
|       +-- elements/
|       |   +-- ElementRenderer.tsx
|       |   +-- RectangleRenderer.tsx
|       |   +-- PolygonRenderer.tsx
|       |   +-- LineRenderer.tsx
|       |   +-- DoorRenderer.tsx
|       |   +-- LabelRenderer.tsx
|       |
|       +-- dialogs/
|           +-- ElementTypeDialog.tsx
|           +-- MergeEdgesDialog.tsx
|           +-- FloorPlanSettingsDialog.tsx
|
+-- domain/
|   +-- floorplan/
|       |
|       +-- models/
|       |   +-- floorPlan.ts
|       |   +-- element.ts
|       |   +-- geometry.ts
|       |   +-- grid.ts
|       |   +-- edge.ts
|       |   +-- door.ts
|       |   +-- semantic.ts
|       |
|       +-- geometry/
|       |   +-- coordinates.ts
|       |   +-- intersections.ts
|       |   +-- polygons.ts
|       |   +-- edges.ts
|       |   +-- bounds.ts
|       |   +-- transforms.ts
|       |
|       +-- grid/
|       |   +-- snapping.ts
|       |
|       +-- compiler/
|       |   +-- rasterizer.ts
|       |   +-- semanticCompiler.ts
|       |   +-- edgeCompiler.ts
|       |   +-- doorCompiler.ts
|       |   +-- conflictResolver.ts
|       |   +-- matrixCompiler.ts
|       |
|       +-- validation/
|           +-- geometryValidator.ts
|           +-- elementValidator.ts
|           +-- floorPlanValidator.ts
|
+-- store/
|   +-- floorplan/
|       +-- floorPlanSlice.ts
|       +-- selectionSlice.ts
|       +-- viewportSlice.ts
|       +-- historySlice.ts
|
+-- services/
|   +-- floorplan/
|       +-- floorPlanApi.ts
|
+-- utils/
    +-- ids.ts
```

------------------------------------------------------------------------

# 6. Domain Model

## 6.1 FloorPlan

``` typescript
interface FloorPlan {
  id: string;
  name: string;

  dimensions: {
    width: number;
    height: number;
    unit: "m" | "ft";
  };

  grid: GridConfig;

  elements: FloorElement[];

  doors: Door[];

  mergedEdges: MergedEdge[];

  metadata: FloorPlanMetadata;
}
```

## 6.2 GridConfig

``` typescript
interface GridConfig {
  rows: number;
  columns: number;

  cellSize: number;

  worldUnit: "m" | "ft";

  precision: number;

  snapToGrid: boolean;

  showCoordinates: boolean;
}
```

`cellSize` used for rendering must not be confused with physical
precision.

## 6.3 FloorElement

``` typescript
interface FloorElement {
  id: string;

  geometry: Geometry;

  semantic?: SemanticAssignment;

  style: ElementStyle;

  locked: boolean;

  visible: boolean;

  zIndex: number;
}
```

## 6.4 Geometry

Use a discriminated union:

``` typescript
type Geometry =
  | RectangleGeometry
  | PolygonGeometry
  | LineGeometry
  | CircleGeometry;
```

Rectangle:

``` typescript
interface RectangleGeometry {
  type: "RECTANGLE";

  x: number;
  y: number;

  width: number;
  height: number;

  rotation: number;
}
```

Polygon:

``` typescript
interface PolygonGeometry {
  type: "POLYGON";

  points: Point[];

  rotation: number;
}
```

Line:

``` typescript
interface LineGeometry {
  type: "LINE";

  start: Point;
  end: Point;
}
```

## 6.5 SemanticType

``` typescript
interface SemanticType {
  id: string;

  name: string;

  code: number;

  category:
    | "ROOM"
    | "FURNITURE"
    | "INFRASTRUCTURE"
    | "DECORATION";

  edgeWeight: number;

  priority: number;

  allowsDoor: boolean;
}
```

## 6.6 SemanticAssignment

Keep semantic type and human-readable label separate.

``` typescript
interface SemanticAssignment {
  typeId: string;

  code: number;

  label?: string;
}
```

Example:

``` text
Type: MEETING_ROOM
Code: 5
Label: Conference Room A
```

------------------------------------------------------------------------

# 7. Semantic Registry

Create a configurable semantic registry.

Example:

``` text
EMPTY
WALL
DESK
CHAIR
TABLE
MEETING_ROOM
CABIN
CONFERENCE_ROOM
OPEN_WORKSPACE
SOFA
PLANT
DOOR
WINDOW
STAIRS
KITCHEN
RECEPTION
STORAGE
RESTROOM
```

Each semantic type should contain:

``` text
id
display name
matrix code
category
edge weight
priority
door compatibility
default dimensions
```

Example:

``` typescript
MEETING_ROOM = {
  code: 5,
  category: "ROOM",
  edgeWeight: 10,
  priority: 80,
  allowsDoor: true
}
```

The exact codes and weights must be configurable rather than duplicated
throughout the application.

------------------------------------------------------------------------

# 8. Coordinate System

The application must maintain:

``` text
World coordinates
Grid coordinates
Screen coordinates
```

Required pure functions:

``` typescript
worldToGrid()
gridToWorld()
worldToScreen()
screenToWorld()
screenToGrid()
gridToScreen()
snapToGrid()
```

Example:

``` text
Precision = 0.5m

World:
12.37m

Snapped:
12.5m
```

All geometry should be stored in world coordinates.

------------------------------------------------------------------------

# 9. Precision vs Zoom

These are different concepts.

## Zoom

Changes visual magnification.

``` text
25%
50%
100%
200%
400%
```

## Precision

Changes the physical grid resolution.

``` text
1m
0.5m
0.25m
0.1m
0.05m
```

Changing zoom must never alter floor-plan geometry.

Changing precision must not arbitrarily resize the physical floor.

------------------------------------------------------------------------

# 10. Grid Requirements

The grid must support:

-   configurable rows
-   configurable columns
-   square cells
-   physical precision
-   snap-to-grid
-   coordinate labels
-   major/minor grid lines
-   zoom-aware rendering
-   pan
-   viewport culling where required

Do not create one React component per grid cell.

Render grid lines efficiently and only show coordinate labels at
appropriate zoom levels.

------------------------------------------------------------------------

# 11. React-Konva Canvas Architecture

Recommended stage:

``` tsx
<Stage>
  <Layer>
    <GridLayer />
  </Layer>

  <Layer>
    <FloorBoundary />
  </Layer>

  <Layer>
    <ElementsLayer />
  </Layer>

  <Layer>
    <EdgeLayer />
  </Layer>

  <Layer>
    <LabelLayer />
  </Layer>

  <Layer>
    <SelectionLayer />
  </Layer>
</Stage>
```

Static/noninteractive layers should not unnecessarily participate in
event handling.

------------------------------------------------------------------------

# 12. Editor Tools

Initial tools:

``` text
SELECT
PAN
RECTANGLE
POLYGON
LINE
DOOR
```

Future tools:

``` text
CIRCLE
WALL
WINDOW
STAIRS
TEXT
```

------------------------------------------------------------------------

# 13. Rectangle Drawing

Workflow:

``` text
Rectangle Tool
      |
      v
Pointer Down
      |
      v
Capture Start World Coordinate
      |
      v
Pointer Move
      |
      v
Preview Rectangle
      |
      v
Snap Coordinates
      |
      v
Pointer Up
      |
      v
Normalize Geometry
      |
      v
Create FloorElement
```

Requirements:

-   support dragging in all directions
-   normalize negative width/height
-   snap to grid
-   select newly created element
-   support immediate move/resize

------------------------------------------------------------------------

# 14. Polygon Drawing

Workflow:

``` text
Click -> Point 1
Click -> Point 2
Click -> Point 3
...
Double Click -> Close
```

Validate:

-   at least three points
-   valid polygon
-   no unacceptable self-intersection
-   coordinates inside permitted floor boundary where required

------------------------------------------------------------------------

# 15. Line Drawing

Requirements:

-   start/end points
-   grid snapping
-   move
-   resize
-   semantic assignment if applicable
-   edge extraction

------------------------------------------------------------------------

# 16. Selection and Transformation

Support:

-   single selection
-   multi-selection
-   deselection
-   drag
-   resize
-   rotation
-   duplicate
-   delete

Use Konva Transformer for interaction.

After transformation:

``` text
Konva scaleX/scaleY
        |
        v
Normalize
        |
        v
Domain width/height
        |
        v
Persist
```

Never persist unnormalized canvas transform state.

------------------------------------------------------------------------

# 17. Properties Panel

When an element is selected:

``` text
Type
Label
X
Y
Width
Height
Rotation
Matrix Code
Edge Weight
```

Dimensions must be editable numerically as well as through mouse
manipulation.

Example:

``` text
Type:
[ Meeting Room ]

Label:
[ Conference Room A ]

X:
[ 10.00 ]

Y:
[ 5.00 ]

Width:
[ 8.00 ]

Height:
[ 6.00 ]

Rotation:
[ 0° ]

Code:
5

Edge Weight:
10
```

------------------------------------------------------------------------

# 18. Element Templates

Create reusable templates.

``` typescript
interface ElementTemplate {
  id: string;
  semanticType: string;

  defaultWidth: number;
  defaultHeight: number;

  defaultStyle: ElementStyle;
}
```

Examples:

``` text
Desk
Chair
Table
Meeting Room
Cabin
Sofa
Plant
```

Dragging a template onto the canvas should create a correctly
initialized semantic element.

------------------------------------------------------------------------

# 19. Edge Model

All polygonal geometry must be convertible into explicit edges.

``` typescript
interface Edge {
  id: string;

  elementId: string;

  start: Point;

  end: Point;

  weight: number;

  semanticType: string;
}
```

Rectangle:

``` text
A -------- B
|          |
|          |
D -------- C
```

becomes:

``` text
AB
BC
CD
DA
```

------------------------------------------------------------------------

# 20. Edge Relationships

Classify edge pairs as:

``` text
NONE
TOUCHING
CROSSING
OVERLAPPING
COINCIDENT
```

These relationships must be tested accurately.

Examples:

``` text
A-------------B
       C-------------D

OVERLAPPING
```

versus:

``` text
       C
       |
       |
A------X------B
       |
       |
```

which is:

``` text
CROSSING
```

------------------------------------------------------------------------

# 21. Edge Merging

When shared/overlapping edges are detected, offer:

``` text
Merge Edges
Keep Separate
```

Merged edge model:

``` typescript
interface MergedEdge {
  id: string;

  sourceEdgeIds: string[];

  geometry: LineGeometry;

  weight: number;

  semanticOwnerIds: string[];
}
```

Merging must be undoable.

Unmerge must restore the original relationships.

------------------------------------------------------------------------

# 22. Room Semantics

Room-like elements should receive higher edge weights.

Example:

``` text
Meeting Room
Code = 5
Edge Weight = 10
```

The exact value must come from the semantic registry.

Room types may include:

``` text
Meeting Room
Cabin
Conference Room
Open Workspace
Reception
Kitchen
Storage
Server Room
Restroom
```

------------------------------------------------------------------------

# 23. Doors

Doors are separate semantic objects.

``` typescript
interface Door {
  id: string;

  hostElementId: string;

  position: number;

  width: number;

  orientation: "HORIZONTAL" | "VERTICAL";

  swing?: "LEFT" | "RIGHT" | "NONE";
}
```

Door workflow:

``` text
Select Door
    |
    v
Hover Room Boundary
    |
    v
Snap to Compatible Edge
    |
    v
Set Width
    |
    v
Set Orientation
    |
    v
Optional Swing
```

Invalid door placement should be rejected.

During matrix compilation, a door should override the corresponding
room/wall boundary representation where appropriate.

------------------------------------------------------------------------

# 24. Spatial Relationship Engine

The engine must support:

-   element intersection
-   edge intersection
-   edge overlap
-   containment
-   adjacency
-   shared boundary detection
-   door-to-room relationship

For MVP:

``` text
O(n²)
```

edge comparison is acceptable.

For larger plans:

``` text
RBush
  |
  v
candidate bounding boxes
  |
  v
exact geometry check
```

------------------------------------------------------------------------

# 25. Matrix Model

Do not create only one overloaded matrix.

Generate separate representations.

## Semantic Matrix

Contains element semantic codes.

Example:

``` text
0 0 0 0 0 0
0 5 5 5 5 0
0 5 2 2 5 0
0 5 3 3 5 0
0 5 5 9 5 0
0 0 0 0 0 0
```

Possible values:

``` text
0 = empty
2 = desk
3 = chair
4 = table
5 = meeting room
9 = door
```

## Edge Matrix

Contains edge weights.

Example:

``` text
10 10 10 10
10  0  0 10
10  0  0 10
10 10  0 10
```

## Door Matrix

Represents door cells/locations.

## Occupancy Matrix

Represents whether a cell is occupied.

## Connectivity Matrix

Represents movement/connectivity semantics where required.

------------------------------------------------------------------------

# 26. Matrix Compilation

The compiler pipeline is:

``` text
FloorPlan
    |
    v
Validate Geometry
    |
    v
Normalize Coordinates
    |
    v
Create B x B Grid
    |
    v
Rasterize Elements
    |
    v
Apply Semantic Codes
    |
    v
Extract Edges
    |
    v
Apply Edge Weights
    |
    v
Apply Merged Edges
    |
    v
Apply Doors
    |
    v
Resolve Conflicts
    |
    v
Generate Matrices
```

The compiler must be independent of React and Konva.

------------------------------------------------------------------------

# 27. Rasterization

Never rasterize from canvas pixels.

Use:

``` text
Vector geometry
    |
    v
World coordinates
    |
    v
Grid cell geometry
    |
    v
Intersection test
    |
    v
Matrix cell
```

For each relevant cell, determine whether the element geometry
intersects/occupies that cell.

------------------------------------------------------------------------

# 28. Cell Conflict Resolution

Multiple elements may affect the same cell.

Use explicit priorities.

Example:

``` text
DOOR          100
ROOM_EDGE      80
WALL           70
DESK           30
CHAIR          20
DECORATION     10
EMPTY           0
```

These are examples only.

The actual priority system must be configurable.

Do not silently resolve conflicts using array order.

------------------------------------------------------------------------

# 29. Compiler API

Recommended:

``` typescript
function compileFloorPlan(
  plan: FloorPlan
): CompiledFloorPlan
```

Where:

``` typescript
interface CompiledFloorPlan {
  semanticMatrix: Int16Array | number[][];
  edgeMatrix: Int16Array | number[][];
  doorMatrix: Int16Array | number[][];
  occupancyMatrix: Int16Array | number[][];
  connectivityMatrix?: Int16Array | number[][];
}
```

The implementation may internally use typed arrays for memory
efficiency.

------------------------------------------------------------------------

# 30. Matrix Preview

Provide a matrix preview UI.

Features:

-   semantic matrix
-   edge matrix
-   door matrix
-   occupancy matrix
-   connectivity matrix
-   row/column coordinates
-   dimensions
-   cell count
-   copy JSON
-   copy CSV
-   export

The preview must use compiler output.

It must not contain separate matrix-generation logic.

------------------------------------------------------------------------

# 31. Persistence

Persist the vector model:

``` text
FloorPlan
  |
  +-- configuration
  +-- elements
  +-- doors
  +-- mergedEdges
  +-- metadata
```

Compiled matrices are generated data.

Recommended API:

``` http
POST   /api/floor-plans
GET    /api/floor-plans/{id}
PUT    /api/floor-plans/{id}
POST   /api/floor-plans/{id}/compile
GET    /api/floor-plans/{id}/matrix
```

The exact API can be adapted to the existing backend conventions.

------------------------------------------------------------------------

# 32. Redux State

Recommended editor state:

``` typescript
interface FloorPlanEditorState {
  floorPlan: FloorPlan;

  selection: {
    selectedIds: string[];
  };

  viewport: Viewport;

  tool: EditorTool;

  history: HistoryState;

  ui: {
    showGrid: boolean;
    showCoordinates: boolean;
    showMatrixPreview: boolean;
    snapToGrid: boolean;
  };
}
```

Keep viewport state separate from domain geometry.

------------------------------------------------------------------------

# 33. Undo/Redo

Commands/actions:

``` text
ADD_ELEMENT
DELETE_ELEMENT
MOVE_ELEMENT
RESIZE_ELEMENT
ROTATE_ELEMENT
CHANGE_TYPE
CHANGE_LABEL
ADD_DOOR
MOVE_DOOR
DELETE_DOOR
MERGE_EDGE
UNMERGE_EDGE
CHANGE_GRID
```

Rules:

-   pointer preview is not history
-   completed user action is one history event
-   undo restores previous state
-   redo reapplies action
-   new mutation clears redo stack
-   history size should be configurable

------------------------------------------------------------------------

# 34. Keyboard Shortcuts

Implement:

``` text
Delete              Delete selected element
Ctrl + Z            Undo
Ctrl + Shift + Z    Redo
Ctrl + C            Copy
Ctrl + V            Paste
Ctrl + D            Duplicate
Ctrl + A            Select all
Esc                 Cancel operation
Space + Drag        Pan
+                   Zoom in
-                   Zoom out
R                   Rectangle
L                   Line
P                   Polygon
D                   Door
V                   Select
```

Avoid browser conflicts where necessary.

------------------------------------------------------------------------

# 35. Validation

Before saving/compiling:

``` text
Geometry valid
Coordinates valid
Dimensions > 0
Semantic type valid
Matrix code valid
Room/door relationship valid
Merged edges valid
Objects within floor boundary where required
No invalid polygons
```

Show user-facing warnings such as:

``` text
Meeting Room A has no door.
Desk 12 overlaps Desk 13.
Merged edge is invalid.
Element is outside the floor boundary.
```

Warnings should not necessarily block saving unless the rule is
explicitly fatal.

------------------------------------------------------------------------

# 36. Performance

Target a responsive editor for:

``` text
100 elements
500 elements
1,000 elements
5,000 elements
```

Do not optimize blindly.

Measure:

-   FPS
-   pointer latency
-   selection latency
-   transformation latency
-   matrix compilation time
-   memory consumption

Potential optimizations:

-   separate Konva layers
-   disable events on static layers
-   viewport culling
-   memoized renderers
-   batched state updates
-   spatial indexing
-   typed arrays for large matrices

------------------------------------------------------------------------

# 37. Testing Strategy

## Unit tests

Must cover:

### Coordinate system

``` text
world -> grid
grid -> world
world -> screen
screen -> world
precision
zoom
pan
snapping
round-trip conversions
```

### Geometry

``` text
rectangle
polygon
line
rotation
normalization
```

### Intersections

``` text
touching
crossing
partial overlap
complete overlap
parallel
non-overlap
coincident
```

### Rasterization

``` text
empty floor
single rectangle
multiple elements
rotated shapes
boundary cells
```

### Compiler

``` text
semantic matrix
edge matrix
door matrix
occupancy matrix
conflict resolution
merged edges
```

------------------------------------------------------------------------

# 38. Component Tests

Test:

``` text
draw rectangle
select element
move element
resize element
rotate element
change label
change semantic type
delete element
add door
merge edges
```

------------------------------------------------------------------------

# 39. End-to-End Tests

A minimum E2E flow:

``` text
Create Floor Plan
    |
    v
Set dimensions
    |
    v
Set precision
    |
    v
Draw room
    |
    v
Resize room
    |
    v
Assign Meeting Room
    |
    v
Enter label
    |
    v
Add door
    |
    v
Add desk
    |
    v
Compile
    |
    v
Verify matrix
    |
    v
Save
    |
    v
Reload
    |
    v
Verify state
```

------------------------------------------------------------------------

# 40. Implementation Phases

Agents MUST implement phases in order unless a documented dependency
requires otherwise.

## Phase 0 --- Repository Inspection

Before writing code:

1.  Inspect the existing project.
2.  Identify React/Vite version.
3.  Identify TypeScript configuration.
4.  Identify existing state management.
5.  Identify existing styling system.
6.  Identify existing component conventions.
7.  Identify existing API layer.
8.  Identify existing test setup.
9.  Do not replace working infrastructure without justification.

Deliver:

``` text
Repository assessment
Existing architecture
Relevant dependencies
Potential conflicts
Implementation approach
```

------------------------------------------------------------------------

## Phase 1 --- Domain Models

Implement:

-   FloorPlan
-   GridConfig
-   FloorElement
-   Geometry types
-   SemanticType
-   SemanticAssignment
-   Door
-   Edge
-   MergedEdge
-   CompiledFloorPlan

Also implement initial semantic registry.

No canvas implementation yet.

Acceptance:

``` text
TypeScript passes
Unit tests pass
No React/Konva imports in domain models
```

------------------------------------------------------------------------

## Phase 2 --- Redux State

Implement:

-   floor plan slice
-   selection slice
-   viewport slice
-   history foundation

Implement:

-   add element
-   remove element
-   update element
-   selection
-   viewport actions
-   grid configuration

Acceptance:

``` text
State updates correctly
Selectors work
Tests pass
```

------------------------------------------------------------------------

## Phase 3 --- Coordinate System

Implement:

``` text
worldToGrid
gridToWorld
worldToScreen
screenToWorld
screenToGrid
gridToScreen
snapToGrid
```

Add comprehensive unit tests.

Acceptance:

``` text
Round trips preserve expected coordinates
Zoom does not alter world geometry
Precision snapping works
```

------------------------------------------------------------------------

## Phase 4 --- Canvas Foundation

Implement:

-   Stage
-   viewport
-   grid layer
-   floor boundary
-   static layers
-   element layer
-   selection layer

Acceptance:

``` text
Grid visible
Pan works
Zoom works
Coordinates remain correct
No unnecessary per-cell React components
```

------------------------------------------------------------------------

## Phase 5 --- Rectangle Tool

Implement:

-   rectangle tool
-   pointer interaction
-   preview
-   snapping
-   normalized geometry
-   creation
-   selection
-   deletion
-   movement

Acceptance:

``` text
Rectangle can be drawn accurately
Rectangle persists in domain state
```

------------------------------------------------------------------------

## Phase 6 --- Selection and Transformations

Implement:

-   selection
-   multi-selection
-   Transformer
-   move
-   resize
-   rotate
-   transform normalization

Acceptance:

``` text
Domain geometry remains canonical
Konva-specific scale is not persisted
```

------------------------------------------------------------------------

## Phase 7 --- Properties and Semantic Assignment

Implement:

-   property panel
-   type selector
-   label input
-   dimensions
-   position
-   rotation
-   semantic code display
-   edge weight display

Acceptance:

``` text
Type and label are separate
Changing type updates code/weight from registry
```

------------------------------------------------------------------------

## Phase 8 --- Polygon and Line Tools

Implement:

-   polygon drawing
-   polygon validation
-   line drawing
-   line editing
-   snapping

Acceptance:

``` text
Geometry is valid
All geometry remains vector-based
```

------------------------------------------------------------------------

## Phase 9 --- Element Templates

Implement:

-   element library
-   room templates
-   furniture templates
-   infrastructure templates

Examples:

``` text
Meeting Room
Cabin
Desk
Chair
Table
Sofa
Plant
```

Acceptance:

``` text
Template creates correctly initialized element
```

------------------------------------------------------------------------

## Phase 10 --- Edge Extraction

Implement:

``` text
extractEdges(element)
extractAllEdges(plan)
```

Acceptance:

``` text
Rectangle -> 4 edges
Polygon -> N edges
Line -> 1 edge
Weights are derived from semantic registry
```

------------------------------------------------------------------------

## Phase 11 --- Edge Relationships

Implement:

``` text
NONE
TOUCHING
CROSSING
OVERLAPPING
COINCIDENT
```

Start with brute-force comparisons.

Acceptance:

``` text
All relationship unit tests pass
```

------------------------------------------------------------------------

## Phase 12 --- Edge Merge

Implement:

-   candidate detection
-   visual indication
-   merge action
-   merged edge model
-   unmerge
-   undo/redo

Acceptance:

``` text
Merged relationship persists
Original edge IDs remain traceable
```

------------------------------------------------------------------------

## Phase 13 --- Doors

Implement:

-   door tool
-   boundary snapping
-   room compatibility
-   width
-   orientation
-   swing
-   host room relationship

Acceptance:

``` text
Doors cannot be arbitrarily placed away from compatible boundaries
```

------------------------------------------------------------------------

## Phase 14 --- Rasterizer

Implement:

``` text
createEmptyMatrix
rasterizeElement
rasterizeEdges
rasterizeDoors
```

Acceptance:

``` text
Vector geometry produces deterministic grid representation
```

------------------------------------------------------------------------

## Phase 15 --- Matrix Compiler

Implement:

``` text
compileSemanticMatrix
compileEdgeMatrix
compileDoorMatrix
compileOccupancyMatrix
compileConnectivityMatrix
compileFloorPlan
```

Acceptance:

``` text
Compiler has no UI dependencies
Compiler is deterministic
Compiler tests pass
```

------------------------------------------------------------------------

## Phase 16 --- Matrix Preview

Implement:

-   matrix tabs
-   coordinates
-   dimensions
-   cell count
-   JSON export
-   CSV export

Acceptance:

``` text
Preview exactly matches compiler output
```

------------------------------------------------------------------------

## Phase 17 --- Validation

Implement:

-   geometry validation
-   semantic validation
-   door validation
-   merged-edge validation
-   floor boundary validation
-   compilation validation

Acceptance:

``` text
Invalid plans produce useful messages
```

------------------------------------------------------------------------

## Phase 18 --- Persistence

Implement:

-   save
-   load
-   update
-   dirty state
-   autosave
-   versioning
-   API service

Acceptance:

``` text
Reload produces identical vector floor plan
```

------------------------------------------------------------------------

## Phase 19 --- Undo/Redo Completion

Ensure all mutations are covered.

Acceptance:

``` text
Every user-visible mutation can be undone
```

------------------------------------------------------------------------

## Phase 20 --- Performance

Profile:

``` text
100
500
1,000
5,000
```

elements.

Only then introduce:

-   viewport culling
-   RBush
-   memoization
-   rendering optimizations
-   typed arrays

Acceptance:

``` text
No major interaction degradation at target scale
```

------------------------------------------------------------------------

## Phase 21 --- E2E Testing

Implement complete workflows.

Acceptance:

``` text
Create -> Edit -> Semantic Assignment -> Door -> Merge -> Compile -> Save -> Reload
```

------------------------------------------------------------------------

# 41. Agent Prompt Template

Every implementation task should follow this structure:

``` text
TASK:
<specific phase/task>

CONTEXT:
Read README.md and all relevant existing files before coding.

REQUIREMENTS:
<requirements>

CONSTRAINTS:
- Preserve vector source of truth.
- Keep domain independent of React/Konva.
- Reuse existing project conventions.
- Do not modify unrelated files.
- Add tests.

IMPLEMENTATION:
Implement only this phase.

VALIDATION:
Run:
- typecheck
- lint
- unit tests
- build

REPORT:
At the end report:
1. What changed
2. Files modified
3. Tests added
4. Commands executed
5. Test/build results
6. Known limitations
7. Suggested next phase
```

------------------------------------------------------------------------

# 42. Example Agent Task --- Phase 1

``` text
Read README.md first.

Implement Phase 1 only: Floor Plan Domain Models.

Inspect the existing repository before changing anything.

Create or adapt the domain models for:

- FloorPlan
- GridConfig
- FloorElement
- Geometry
- SemanticType
- SemanticAssignment
- Edge
- Door
- MergedEdge
- CompiledFloorPlan

Create the initial semantic registry.

Rules:

- strict TypeScript
- no React imports
- no Konva imports
- no screen coordinates in persisted geometry
- semantic type and human-readable label must be separate
- matrix codes must come from the semantic registry
- do not hard-code semantic codes in rendering logic

Add unit tests.

Do not implement the canvas yet.

Run typecheck, lint, tests and build.

Report modified files and results.
```

------------------------------------------------------------------------

# 43. Example Agent Task --- Matrix Compiler

``` text
Read README.md and inspect the current domain model.

Implement only the Matrix Compiler phase.

The compiler must accept a FloorPlan and produce:

- semanticMatrix
- edgeMatrix
- doorMatrix
- occupancyMatrix
- connectivityMatrix where supported

Pipeline:

validate
-> normalize
-> rasterize elements
-> apply semantic codes
-> extract/rasterize edges
-> apply edge weights
-> apply merged edges
-> apply doors
-> resolve conflicts
-> generate output

Rules:

- no React
- no Konva
- deterministic output
- pure functions where possible
- no canvas pixel sampling
- use world/grid geometry
- semantic values come from semantic registry
- conflict resolution must be explicit

Add comprehensive unit tests.

Do not implement UI in this task.
```

------------------------------------------------------------------------

# 44. Example Agent Task --- React-Konva Canvas

``` text
Read README.md and inspect current domain/state implementation.

Implement only the Canvas Foundation phase.

Use react-konva.

Create:

- FloorPlanStage
- GridLayer
- FloorBoundary
- ElementsLayer
- SelectionLayer

Requirements:

- grid rendered efficiently
- pan
- zoom
- mathematical coordinate alignment
- Redux state integration
- no floor-plan state stored inside Konva nodes
- static layers should not unnecessarily receive events
- screen coordinates must be converted through centralized coordinate utilities

Do not implement matrix compilation.

Run all available validation commands and report results.
```

------------------------------------------------------------------------

# 45. Definition of Done

A phase is complete only when:

``` text
[ ] Requirement implemented
[ ] Existing architecture preserved
[ ] Domain boundaries respected
[ ] TypeScript passes
[ ] Lint passes
[ ] Unit tests pass
[ ] Existing tests pass
[ ] Build passes
[ ] No unrelated files modified
[ ] Error handling implemented
[ ] Undo/redo considered
[ ] Performance impact considered
[ ] Files changed reported
[ ] Known limitations reported
```

------------------------------------------------------------------------

# 46. Final Editor Feature Set

The completed MVP should support:

``` text
GRID
[ ] Square grid
[ ] Adjustable rows
[ ] Adjustable columns
[ ] Adjustable physical dimensions
[ ] Adjustable precision
[ ] Snap to grid
[ ] Coordinate labels
[ ] Major/minor grid
[ ] Zoom
[ ] Pan

DRAWING
[ ] Rectangle
[ ] Polygon
[ ] Line
[ ] Door

EDITING
[ ] Select
[ ] Multi-select
[ ] Move
[ ] Resize
[ ] Rotate
[ ] Duplicate
[ ] Delete
[ ] Numeric dimensions
[ ] Numeric position

SEMANTICS
[ ] Predefined types
[ ] Human-readable labels
[ ] Integer matrix codes
[ ] Edge weights
[ ] Categories
[ ] Priorities

SPATIAL
[ ] Edge extraction
[ ] Edge intersection
[ ] Edge overlap
[ ] Shared edges
[ ] Edge merging
[ ] Edge unmerging
[ ] Room/door relationships

COMPILATION
[ ] Semantic matrix
[ ] Edge matrix
[ ] Door matrix
[ ] Occupancy matrix
[ ] Connectivity matrix
[ ] Conflict resolution
[ ] Matrix preview
[ ] JSON export
[ ] CSV export

STATE
[ ] Undo
[ ] Redo
[ ] Save
[ ] Load
[ ] Autosave
[ ] Versioning

QUALITY
[ ] Unit tests
[ ] Component tests
[ ] E2E tests
[ ] Validation
[ ] Performance profiling
```

------------------------------------------------------------------------

# 47. Future Extensions

The architecture should leave room for:

## Floor Plan Import

``` text
PNG/PDF/CAD
    |
    v
Recognition
    |
    v
Detected geometry
    |
    v
FloorElement[]
    |
    v
Manual correction
    |
    v
Matrix
```

## AI-Assisted Recognition

Potential future pipeline:

``` text
Uploaded floor plan
      |
      v
Vision model
      |
      v
Rooms / walls / furniture
      |
      v
Vector geometry
      |
      v
User verification
      |
      v
Semantic assignment
      |
      v
Matrix
```

## Workspace Management

Eventually:

``` text
Company
  |
  +-- Building
       |
       +-- Floor
            |
            +-- Floor Plan
                 |
                 +-- Rooms
                 +-- Teams
                 +-- Employees
                 +-- Seats
                 +-- Furniture
```

## Navigation

The compiled representation can later support:

``` text
Employee A
   |
   v
Desk
   |
   v
Room
   |
   v
Door
   |
   v
Corridor
   |
   v
Meeting Room
```

## Analytics

Potential future features:

-   occupancy
-   desk utilization
-   room utilization
-   team distribution
-   workspace density
-   pathfinding
-   nearest available desk
-   nearest meeting room
-   floor navigation

------------------------------------------------------------------------

# 48. Architectural Summary

The final system must follow this architecture:

``` text
                    USER
                      |
                      v
               React Application
                      |
                      v
              React-Konva Canvas
                      |
                      v
                Redux State
                      |
                      v
              FloorPlan Model
                      |
          +-----------+-----------+
          |                       |
          v                       v
   Geometry Engine          Semantic Engine
          |                       |
          +-----------+-----------+
                      |
                      v
             Spatial Relationship
                   Engine
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Edges       Doors       Relations
          |           |           |
          +-----------+-----------+
                      |
                      v
                Matrix Compiler
                      |
       +--------------+--------------+
       |              |              |
       v              v              v
 Semantic Matrix   Edge Matrix   Door Matrix
       |              |              |
       +--------------+--------------+
                      |
                      v
                   Backend
```

The most important invariant is:

``` text
VECTOR MODEL = SOURCE OF TRUTH
MATRIX = COMPILED OUTPUT
CANVAS = VIEW + INTERACTION
```

Do not violate this invariant.

------------------------------------------------------------------------

# 49. Recommended Implementation Sequence

Agents should follow this exact sequence for the first implementation:

``` text
01. Repository inspection
02. Domain models
03. Semantic registry
04. Redux state
05. Coordinate system
06. Grid rendering
07. Viewport/pan/zoom
08. Rectangle drawing
09. Selection
10. Move
11. Resize
12. Rotate
13. Snapping
14. Properties panel
15. Semantic assignment
16. Labels
17. Polygon
18. Line
19. Element templates
20. Edge extraction
21. Edge relationship detection
22. Edge merge/unmerge
23. Doors
24. Rasterization
25. Matrix compiler
26. Matrix preview
27. Validation
28. Persistence
29. Undo/redo completion
30. Performance profiling
31. E2E tests
32. Final cleanup/documentation
```

Do not skip directly from canvas implementation to matrix
implementation. The domain model, geometry engine and semantic layer
must exist first.

------------------------------------------------------------------------

# 50. Agent Handoff Protocol

At the end of every phase, the agent must leave the repository in a
usable state.

The handoff must contain:

``` text
PHASE:
<phase number and name>

STATUS:
COMPLETE / BLOCKED / PARTIAL

IMPLEMENTED:
- ...

FILES MODIFIED:
- ...

FILES CREATED:
- ...

TESTS:
- ...

VALIDATION:
Typecheck: PASS/FAIL
Lint: PASS/FAIL
Tests: PASS/FAIL
Build: PASS/FAIL

KNOWN ISSUES:
- ...

ARCHITECTURAL NOTES:
- ...

NEXT PHASE:
<phase number>
```

Agents must not hide failures or silently work around failing tests.

------------------------------------------------------------------------

# 51. Completion Criteria

The Floor Plan Creator MVP is considered complete when a user can:

``` text
1. Create a floor plan.
2. Configure its dimensions.
3. Configure grid precision.
4. Navigate using pan/zoom.
5. Draw rooms and objects.
6. Move/resize/rotate objects.
7. Snap objects to the grid.
8. Assign semantic types.
9. Enter human-readable labels.
10. Automatically obtain semantic integer codes.
11. Create high-weight room boundaries.
12. Add doors to room boundaries.
13. Detect intersecting/shared edges.
14. Merge compatible edges.
15. Compile the complete plan.
16. Generate square matrices.
17. Preview the matrices.
18. Save the vector floor plan.
19. Reload it without geometry loss.
20. Undo and redo editing operations.
```

The resulting architecture must remain extensible for automatic
floor-plan conversion, workspace mapping, employee seating, navigation
and workspace analytics.
