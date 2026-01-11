"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useWeeklyData } from "../hooks/useWeeklyData";
import { AllocationResult, ProcessedOutput } from "../lib/types";
import { clearStoredOutputs, deleteStoredOutput, listStoredWeeks, loadProcessedOutput } from "../lib/storage";

interface WeeklyDataContextValue {
  records: AllocationResult[];
  loading: boolean;
  error?: string;
  baselineMissing: boolean;
  prevWeekUsed?: string;
  lastWeekId?: string;
  processFile: ReturnType<typeof useWeeklyData>["processFile"];
  processDefault: ReturnType<typeof useWeeklyData>["processDefault"];
  resetError: ReturnType<typeof useWeeklyData>["resetError"];
  hydrateFromOutput: ReturnType<typeof useWeeklyData>["hydrateFromOutput"];
  clearData: ReturnType<typeof useWeeklyData>["clearData"];
  storedWeeks: string[];
  loadStoredWeek: (weekId: string) => ProcessedOutput | null;
  refreshStoredWeeks: () => void;
  clearStored: () => void;
  deleteStored: (weekId: string) => void;
}

const WeeklyDataContext = createContext<WeeklyDataContextValue | null>(null);

export function WeeklyDataProvider({ children }: { children: React.ReactNode }) {
  const value = useWeeklyData();
  const [storedWeeks, setStoredWeeks] = useState<string[]>([]);
  const refreshStoredWeeks = () => setStoredWeeks(listStoredWeeks());
  useEffect(() => {
    refreshStoredWeeks();
  }, []);
  const loadStoredWeek = (weekId: string) => loadProcessedOutput(weekId);
  const clearStored = () => {
    clearStoredOutputs();
    setStoredWeeks([]);
    value.clearData();
  };
  const deleteStored = (weekId: string) => {
    deleteStoredOutput(weekId);
    refreshStoredWeeks();
    if (value.lastWeekId === weekId) {
      value.clearData();
    }
  };
  return (
    <WeeklyDataContext.Provider
      value={{ ...value, storedWeeks, loadStoredWeek, refreshStoredWeeks, clearStored, deleteStored }}
    >
      {children}
    </WeeklyDataContext.Provider>
  );
}

export function useWeeklyDataContext() {
  const ctx = useContext(WeeklyDataContext);
  if (!ctx) {
    throw new Error("useWeeklyDataContext must be used within WeeklyDataProvider");
  }
  return ctx;
}
