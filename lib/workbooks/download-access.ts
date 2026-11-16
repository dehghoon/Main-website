// The site records an approval timestamp in trusted Auth app_metadata.
export function hasActiveWorkbookTrial(approvedAt: unknown, now = Date.now()): boolean {
  if (typeof approvedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(approvedAt)) return false;
  const start = new Date(approvedAt);
  if (!Number.isFinite(start.getTime()) || start.toISOString() !== approvedAt || start.getTime() > now) return false;

  const end = new Date(start);
  const day = start.getUTCDate();
  end.setUTCMonth(start.getUTCMonth() + 3, 1);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return now < end.getTime();
}
