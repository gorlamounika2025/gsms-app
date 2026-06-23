/** Default list date range when the API rejects empty fdt/tdt. */
export function defaultListDateFilters(apiPath: string): { fdt: string; tdt: string } {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 5);

  if (apiPath === 'samples' || apiPath === 'results') {
    return { fdt: toIsoDate(start), tdt: toIsoDate(end) };
  }
  return { fdt: toUsDate(start), tdt: toUsDate(end) };
}

/** Merge tab list filters with required date defaults. */
export function withListDateFilters(
  apiPath: string,
  filters?: Record<string, string | number>
): Record<string, string | number> {
  const dates = defaultListDateFilters(apiPath);
  const merged = { ...(filters ?? {}) };
  if (!merged['fdt']) merged['fdt'] = dates.fdt;
  if (!merged['tdt']) merged['tdt'] = dates.tdt;
  return merged;
}

export function toUsDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
