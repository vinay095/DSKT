import React from 'react';
import type { OutlineVertex } from '../types/geometry';
import { FINEST_PER_A } from '../geometry/grid';
import { outlineToSvgPath } from '../geometry/shapeStorage';

interface PlacePreviewProps {
  origin: { col: number; row: number };
  widthCells: number;
  heightCells: number;
  outline?: OutlineVertex[];
  fits: boolean;
  a: number;
  color?: string;
}

/** Ghost footprint while a library item is armed for placement. */
const PlacePreview: React.FC<PlacePreviewProps> = ({
  origin,
  widthCells,
  heightCells,
  outline,
  fits,
  a,
  color = '#3b82f6',
}) => {
  const f = a / FINEST_PER_A;
  const x = origin.col * f;
  const y = origin.row * f;
  const w = widthCells * f;
  const h = heightCells * f;
  const fill = fits ? color : '#ef4444';
  const opacity = fits ? 0.22 : 0.28;
  const pathD =
    outline && outline.length >= 3 ? outlineToSvgPath(outline) : null;

  return (
    <g id="place-preview" pointerEvents="none">
      {pathD ? (
        <g transform={`translate(${x}, ${y}) scale(${f})`}>
          <path
            d={pathD}
            fill={fill}
            fillOpacity={opacity}
            stroke={fill}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ) : (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={fill}
          fillOpacity={opacity}
          stroke={fill}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
};

export default PlacePreview;
