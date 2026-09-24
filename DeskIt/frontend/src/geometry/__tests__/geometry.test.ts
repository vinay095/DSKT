import {
  worldToScreen,
  screenToWorld,
  getSvgTransformMatrix,
  calculateZoomAroundPoint,
} from '../coordinates';
import {
  DEFAULT_FLOOR_CONFIG,
  getFloorWorldDimensions,
  getGridStep,
  worldToFinestCell,
  finestCellToWorld,
  worldToPlacementCell,
  placementCellToWorld,
} from '../grid';
import {
  snapWorldToPlacementGrid,
  snapWorldToFinestGrid,
} from '../snapping';
import {
  getRotatedDimensions,
  getEntityFootprint,
  checkCellCollision,
  checkEntityVsFloorBoundary,
  checkEntityVsUnusableCollision,
} from '../entities';
import { generatePerimeterPathSvg } from '../footprint';
import { Viewport, WorldPoint, CellCoord } from '../../types/geometry';

export function runGeometryTestSuite(): { passed: number; failed: number; log: string[] } {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      logs.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      logs.push(`❌ FAIL: ${testName}`);
    }
  }

  // --- Test A: World -> Screen -> World Round Trip & SVG Transform ---
  const testViewport: Viewport = { panX: 150, panY: 400, zoom: 1.5 };
  const originalWorldPoint: WorldPoint = { worldX: 128, worldY: 256 };
  const screenPt = worldToScreen(originalWorldPoint, testViewport);
  const roundTripWorldPt = screenToWorld(screenPt, testViewport);
  const transformStr = getSvgTransformMatrix(testViewport);

  const cursorScreen = { screenX: 200, screenY: 300 };
  const zoomedViewport = calculateZoomAroundPoint(cursorScreen, testViewport, 2.0);

  assert(
    Math.abs(roundTripWorldPt.worldX - originalWorldPoint.worldX) < 1e-5 &&
    Math.abs(roundTripWorldPt.worldY - originalWorldPoint.worldY) < 1e-5 &&
    transformStr.includes('translate(150, 400) scale(1.5, -1.5)') &&
    zoomedViewport.zoom === 2.0,
    'A. World -> Screen -> World Round Trip & Viewport Matrix'
  );

  // --- Test B: Y-Axis Inversion ---
  const worldPt1: WorldPoint = { worldX: 100, worldY: 50 };
  const worldPt2: WorldPoint = { worldX: 100, worldY: 150 }; // +Y upward
  const screenPt1 = worldToScreen(worldPt1, testViewport);
  const screenPt2 = worldToScreen(worldPt2, testViewport);
  assert(
    screenPt2.screenY < screenPt1.screenY,
    'B. Y-Axis Inversion (+Y upward in world produces smaller Y on screen)'
  );

  // --- Test C: Multi-Level Grid & Snapping ---
  const dims = getFloorWorldDimensions(DEFAULT_FLOOR_CONFIG);
  const stepA = getGridStep('a', DEFAULT_FLOOR_CONFIG);
  const finestCell = worldToFinestCell({ worldX: 16, worldY: 16 }, DEFAULT_FLOOR_CONFIG);
  const worldFromFinest = finestCellToWorld(finestCell, DEFAULT_FLOOR_CONFIG);
  const placementCell = worldToPlacementCell({ worldX: 32, worldY: 32 }, DEFAULT_FLOOR_CONFIG);
  const worldFromPlacement = placementCellToWorld(placementCell, DEFAULT_FLOOR_CONFIG);

  const rawWorldPt: WorldPoint = { worldX: 17.8, worldY: 30.2 };
  const snappedPlacement = snapWorldToPlacementGrid(rawWorldPt, DEFAULT_FLOOR_CONFIG);
  const snappedFinest = snapWorldToFinestGrid(rawWorldPt, DEFAULT_FLOOR_CONFIG);

  assert(
    dims.width === 1280 && dims.height === 896 && stepA === 64 &&
    worldFromFinest.worldX === 16 && worldFromPlacement.worldX === 32 &&
    snappedPlacement.worldX === 16 && snappedFinest.worldX === 16,
    'C. Multi-Level Grid Conversions & World Snapping'
  );

  // --- Test D: Rotation ---
  const dims0 = getRotatedDimensions(10, 4, 0);
  const dims90 = getRotatedDimensions(10, 4, 90);
  assert(
    dims0.width === 10 && dims0.height === 4 && dims90.width === 4 && dims90.height === 10,
    'D. Rotation (90° CCW swaps width and height)'
  );

  // --- Test E: Collision Detection ---
  const footprintA = getEntityFootprint({ col: 0, row: 0 }, 4, 4, 0);
  const footprintB = getEntityFootprint({ col: 2, row: 2 }, 4, 4, 0); // Overlaps A
  const footprintC = getEntityFootprint({ col: 10, row: 10 }, 4, 4, 0); // No overlap
  const unusableCells: CellCoord[] = [{ col: 10, row: 10 }];

  assert(
    checkCellCollision(footprintA.occupiedFinestCells, footprintB.occupiedFinestCells) === true &&
    checkCellCollision(footprintA.occupiedFinestCells, footprintC.occupiedFinestCells) === false &&
    checkEntityVsUnusableCollision(footprintC.occupiedFinestCells, unusableCells) === true,
    'E. Collision Detection (overlapping cells detected, non-overlapping clean, unusable collision checked)'
  );

  // --- Test F: Floor Boundary Validation ---
  const insideCells: CellCoord[] = [{ col: 5, row: 5 }, { col: 10, row: 10 }];
  const outsideCells: CellCoord[] = [{ col: -1, row: 5 }, { col: 500, row: 5 }];

  assert(
    checkEntityVsFloorBoundary(insideCells, DEFAULT_FLOOR_CONFIG) === true &&
    checkEntityVsFloorBoundary(outsideCells, DEFAULT_FLOOR_CONFIG) === false,
    'F. Floor Boundary Validation (valid inside, invalid outside)'
  );

  // --- Test G: Footprint Perimeter SVG Generation ---
  // Simple 2x2 rectangle cells
  const rectCells: CellCoord[] = [
    { col: 0, row: 0 }, { col: 1, row: 0 },
    { col: 0, row: 1 }, { col: 1, row: 1 }
  ];
  const rectSvg = generatePerimeterPathSvg(rectCells, 4);

  // L-shaped cells (3 cells)
  const lShapeCells: CellCoord[] = [
    { col: 0, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 0 }
  ];
  const lShapeSvg = generatePerimeterPathSvg(lShapeCells, 4);

  assert(
    rectSvg.includes('M') && rectSvg.includes('Z') && lShapeSvg.includes('M') && lShapeSvg.includes('Z'),
    'G. Footprint SVG Perimeter Path Generation (Rectangle & L-Shape SVG path generated)'
  );

  return { passed, failed, log: logs };
}
