import { ProcessedOutput } from "./types";

const STORAGE_KEY = "weekly-allocation-outputs";

function getStore(): Record<string, ProcessedOutput> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read stored outputs", err);
    return {};
  }
}

export function loadProcessedOutput(weekId: string | undefined): ProcessedOutput | null {
  if (!weekId) return null;
  const store = getStore();
  return store[weekId] ?? null;
}

export function saveProcessedOutput(output: ProcessedOutput) {
  if (typeof window === "undefined") return;
  const store = getStore();
  store[output.weekId] = output;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listStoredWeeks(): string[] {
  if (typeof window === "undefined") return [];
  return Object.keys(getStore()).sort();
}

export function clearStoredOutputs() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function deleteStoredOutput(weekId: string) {
  if (typeof window === "undefined") return;
  const store = getStore();
  delete store[weekId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
