import React, { useMemo } from 'react';
import { Layer, Line, Rect } from 'react-konva';
import { getAdaptiveGridSteps, PIXELS_PER_UNIT } from '@/utils/coordinates';

interface GridLayerProps {
  floorWidth: number;
  floorHeight: number;
  gridSize: number;
  zoom: number;
  visible: boolean;
}

export const GridLayer: React.FC<GridLayerProps> = ({
  floorWidth,
  floorHeight,
  gridSize,
  zoom,
  visible,
}) => {
  const lines = useMemo(() => {
    if (!visible) return { minor: [] as number[][], major: [] as number[][] };
    const { minor, major } = getAdaptiveGridSteps(gridSize, zoom);
    const w = floorWidth * PIXELS_PER_UNIT;
    const h = floorHeight * PIXELS_PER_UNIT;
    const minorLines: number[][] = [];
    const majorLines: number[][] = [];

    const pushV = (worldX: number, isMajor: boolean) => {
      const x = worldX * PIXELS_PER_UNIT;
      const pts = [x, 0, x, h];
      (isMajor ? majorLines : minorLines).push(pts);
    };
    const pushH = (worldY: number, isMajor: boolean) => {
      const y = worldY * PIXELS_PER_UNIT;
      const pts = [0, y, w, y];
      (isMajor ? majorLines : minorLines).push(pts);
    };

    for (let x = 0; x <= floorWidth + 1e-6; x += minor) {
      const isMajor = Math.abs(x / major - Math.round(x / major)) < 1e-6;
      pushV(x, isMajor);
    }
    for (let y = 0; y <= floorHeight + 1e-6; y += minor) {
      const isMajor = Math.abs(y / major - Math.round(y / major)) < 1e-6;
      pushH(y, isMajor);
    }
    return { minor: minorLines, major: majorLines };
  }, [floorWidth, floorHeight, gridSize, zoom, visible]);

  if (!visible) return null;

  return (
    <Layer listening={false}>
      <Rect
        x={0}
        y={0}
        width={floorWidth * PIXELS_PER_UNIT}
        height={floorHeight * PIXELS_PER_UNIT}
        fill="#f7f8fa"
      />
      {lines.minor.map((pts, i) => (
        <Line
          key={`m-${i}`}
          points={pts}
          stroke="#e2e6ed"
          strokeWidth={1}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
      {lines.major.map((pts, i) => (
        <Line
          key={`M-${i}`}
          points={pts}
          stroke="#cdd3de"
          strokeWidth={1}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Layer>
  );
};
