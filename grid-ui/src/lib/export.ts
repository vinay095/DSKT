import { jsPDF } from 'jspdf';

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function serializeSvg(svg: SVGSVGElement, includeGrid: boolean): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!includeGrid) {
    clone.querySelector('#grid')?.remove();
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serializer = new XMLSerializer();
  return serializer.serializeToString(clone);
}

export function exportSvg(svg: SVGSVGElement, filename: string, includeGrid: boolean): void {
  const xml = serializeSvg(svg, includeGrid);
  downloadBlob(filename, new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
}

function svgToPngDataUrl(svg: SVGSVGElement, includeGrid: boolean): Promise<string> {
  const xml = serializeSvg(svg, includeGrid);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const width = svg.width.baseVal.value || svg.clientWidth;
  const height = svg.height.baseVal.value || svg.clientHeight;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG'));
    };
    img.src = url;
  });
}

export async function exportPng(
  svg: SVGSVGElement,
  filename: string,
  includeGrid: boolean,
): Promise<void> {
  const dataUrl = await svgToPngDataUrl(svg, includeGrid);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportPdf(
  svg: SVGSVGElement,
  filename: string,
  includeGrid: boolean,
): Promise<void> {
  const dataUrl = await svgToPngDataUrl(svg, includeGrid);
  const width = svg.width.baseVal.value || svg.clientWidth;
  const height = svg.height.baseVal.value || svg.clientHeight;
  const orientation = width >= height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const scale = Math.min((pageW - margin * 2) / width, (pageH - margin * 2) / height);
  const drawW = width * scale;
  const drawH = height * scale;
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  pdf.addImage(dataUrl, 'PNG', x, y, drawW, drawH);
  pdf.save(filename);
}
