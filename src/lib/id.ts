export function createId(prefix = "atlas"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function minutesBetween(start: string, end: string): number {
  return Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
