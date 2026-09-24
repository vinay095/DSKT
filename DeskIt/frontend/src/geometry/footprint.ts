import { CellCoord } from '../types/geometry';

interface DirectedEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
}

/**
 * Extracts outer boundary perimeter loops and generates an SVG path string (M...Z)
 * for an arbitrary collection of finest grid cells (including irregular/L-shaped polygons).
 *
 * Algorithm:
 * 1. Generate 4 directed boundary edges for each cell.
 * 2. Cancel matching internal edges (A->B cancels B->A).
 * 3. Connect remaining outer edges into closed boundary paths.
 * 4. Build SVG path string "M x y L x y ... Z".
 */
export function generatePerimeterPathSvg(
  cells: CellCoord[],
  cellSizeWorld: number = 4
): string {
  if (!cells || cells.length === 0) return '';

  const edgeCountMap = new Map<string, DirectedEdge>();

  const makeKey = (x1: number, y1: number, x2: number, y2: number) => `${x1},${y1}->${x2},${y2}`;

  // Step 1 & 2: Generate directed edges for each cell
  for (const cell of cells) {
    const x0 = cell.col * cellSizeWorld;
    const y0 = cell.row * cellSizeWorld;
    const x1 = x0 + cellSizeWorld;
    const y1 = y0 + cellSizeWorld;

    // 4 directed edges (CCW winding)
    const edges: [number, number, number, number][] = [
      [x0, y0, x1, y0], // Bottom
      [x1, y0, x1, y1], // Right
      [x1, y1, x0, y1], // Top
      [x0, y1, x0, y0], // Left
    ];

    for (const [ex1, ey1, ex2, ey2] of edges) {
      const key = makeKey(ex1, ey1, ex2, ey2);
      const reverseKey = makeKey(ex2, ey2, ex1, ey1);

      if (edgeCountMap.has(reverseKey)) {
        // Internal shared edge found! Cancel both.
        edgeCountMap.delete(reverseKey);
      } else {
        edgeCountMap.set(key, { x1: ex1, y1: ey1, x2: ex2, y2: ey2, key });
      }
    }
  }

  // Remaining edges are outer boundary edges
  const boundaryEdges = Array.from(edgeCountMap.values());
  if (boundaryEdges.length === 0) return '';

  // Step 3: Chain edges into closed loop(s)
  const nextEdgeMap = new Map<string, DirectedEdge>();
  for (const edge of boundaryEdges) {
    nextEdgeMap.set(`${edge.x1},${edge.y1}`, edge);
  }

  const visitedKeys = new Set<string>();
  const pathsSvg: string[] = [];

  for (const startEdge of boundaryEdges) {
    if (visitedKeys.has(startEdge.key)) continue;

    let current: DirectedEdge | undefined = startEdge;
    const loopPoints: [number, number][] = [];

    while (current && !visitedKeys.has(current.key)) {
      visitedKeys.add(current.key);
      loopPoints.push([current.x1, current.y1]);
      const nextKey = `${current.x2},${current.y2}`;
      current = nextEdgeMap.get(nextKey);
    }

    if (loopPoints.length > 0) {
      const pathCommands = loopPoints
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
        .join(' ');
      pathsSvg.push(`${pathCommands} Z`);
    }
  }

  return pathsSvg.join(' ');
}
