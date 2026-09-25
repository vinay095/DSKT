import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/catalog';
import {
  getCategoryStyle,
  isSvgDataUrl,
  stylizeCatalogSvgMarkup,
  type ElementRenderState,
} from '../lib/categoryStyles';

const urlCache = new Map<string, string>();

async function loadStyledSvgUrl(
  filenameOrData: string,
  category?: string,
  elementType?: string,
  entityColor?: string,
  state: ElementRenderState = 'default',
): Promise<string | null> {
  const style = getCategoryStyle(category, elementType, entityColor, state);
  const cacheKey = `${filenameOrData}|${style.fill}|${style.stroke}|${state}`;
  if (urlCache.has(cacheKey)) return urlCache.get(cacheKey)!;

  try {
    let raw: string;
    if (isSvgDataUrl(filenameOrData)) {
      raw = decodeURIComponent(filenameOrData.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
    } else if (filenameOrData.trim().startsWith('<svg') || filenameOrData.trim().startsWith('<?xml')) {
      raw = filenameOrData;
    } else {
      const url = assetUrl(filenameOrData);
      if (!url) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      raw = await res.text();
    }

    const styled = stylizeCatalogSvgMarkup(raw, style);
    const blob = new Blob([styled], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    urlCache.set(cacheKey, objectUrl);
    return objectUrl;
  } catch {
    return null;
  }
}

interface StyledCatalogSvgProps {
  svgFile?: string;
  /** Inline / generated SVG markup (custom shapes). */
  svgMarkup?: string;
  category?: string;
  elementType?: string;
  entityColor?: string;
  width: number;
  height: number;
  renderState?: ElementRenderState;
}

/**
 * Loads a catalog or generated SVG, applies category/state colors at render time.
 * Original asset files are never modified on disk.
 */
export function StyledCatalogSvg({
  svgFile,
  svgMarkup,
  category,
  elementType,
  entityColor,
  width,
  height,
  renderState = 'default',
}: StyledCatalogSvgProps) {
  const [href, setHref] = useState<string | null>(null);
  const style = getCategoryStyle(category, elementType, entityColor, renderState);
  const source = svgMarkup || svgFile;

  useEffect(() => {
    let cancelled = false;
    if (!source) {
      setHref(null);
      return;
    }
    void loadStyledSvgUrl(source, category, elementType, entityColor, renderState).then((u) => {
      if (!cancelled) setHref(u);
    });
    return () => {
      cancelled = true;
    };
  }, [source, category, elementType, entityColor, renderState]);

  if (!href) {
    return (
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={Math.min(width, height) * 0.08}
        fill={style.fill}
        fillOpacity={style.fillOpacity}
        stroke={style.stroke}
        strokeWidth={Math.max(width, height) * 0.015}
      />
    );
  }

  return (
    <image
      href={href}
      x={0}
      y={0}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

export default StyledCatalogSvg;
