/** Indian rupee formatting with lakh/crore grouping, e.g. ₹1,23,456. */
export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Millimetres to feet and inches, e.g. 2100 → 6′ 11″ (mirrors the original `ft`). */
export function feetInches(mm: number): string {
  const t = Math.round(mm / 25.4);
  return `${Math.floor(t / 12)}′ ${t % 12}″`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
