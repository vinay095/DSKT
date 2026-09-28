import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/catalog';
import {
  getCategoryStyle,
  isSvgDataUrl,
  stylizeCatalogSvgMarkup,
  type ElementRenderState,
} from '../lib/categoryStyles';
import { FloorObjectRenderer } from './renderers';

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

    const styledMarkup = stylizeCatalogSvgMarkup(raw, style);
    const blob = new Blob([styledMarkup], { type: 'image/svg+xml;charset=utf-8' });
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
 * Prefer catalog / custom SVG when available.
 * Procedural FloorObjectRenderer is only the fallback (no asset, or load failure).
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

  if (href) {
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

  return (
    <FloorObjectRenderer
      width={width}
      height={height}
      category={category}
      elementType={elementType}
      color={entityColor}
      renderState={renderState}
    />
  );
}

export default StyledCatalogSvg;
