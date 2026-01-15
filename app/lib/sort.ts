import { AllocationResult } from "./types";

export function compareByYearDesc(a: AllocationResult, b: AllocationResult): number {
  const yearA = a.year ?? Number.NEGATIVE_INFINITY;
  const yearB = b.year ?? Number.NEGATIVE_INFINITY;
  if (yearA !== yearB) return yearB - yearA;
  return a.sku.localeCompare(b.sku);
}
