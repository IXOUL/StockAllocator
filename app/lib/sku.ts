export function extractSkuParts(sku: string): { yearHint?: string; block?: string; style: string } {
  const compact = sku.replace(/\s+/g, "");
  const match = compact.match(/^([A-Za-z]\d{2})(\d{3})([A-Za-z0-9]{2})/);
  if (match) {
    return { yearHint: match[1], block: match[2], style: match[3] };
  }
  const yearHint = compact.match(/^([A-Za-z]\d{2})/)?.[1];
  const styleFallback = compact.match(/^[A-Za-z0-9]{2}/)?.[0] ?? compact;
  return { yearHint, style: styleFallback };
}

export function buildStyleGroupKey(sku: string, year?: number): string {
  const { yearHint, block, style } = extractSkuParts(sku);
  const yearKey = year !== undefined ? String(year) : yearHint ?? "unknown";
  const blockKey = block ?? "unknown";
  return `${yearKey}-${blockKey}-${style}`;
}
