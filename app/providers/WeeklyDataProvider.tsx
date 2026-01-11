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
  const ctxValue: WeeklyDataContextValue = {
    records: value.records,
    loading: value.loading,
    error: value.error,
    baselineMissing: value.baselineMissing,
    prevWeekUsed: value.prevWeekUsed,
    lastWeekId: value.lastWeekId,
    processFile: value.processFile,
    processDefault: value.processDefault,
    resetError: value.resetError,
    hydrateFromOutput: value.hydrateFromOutput,
    clearData: value.clearData,
    storedWeeks,
    loadStoredWeek,
    refreshStoredWeeks,
    clearStored,
    deleteStored
  };
  return <WeeklyDataContext.Provider value={ctxValue}>{children}</WeeklyDataContext.Provider>;
}

export function useWeeklyDataContext() {
  const ctx = useContext(WeeklyDataContext);
  if (!ctx) {
    return {
      records: [],
      loading: false,
      error: undefined,
      baselineMissing: false,
      prevWeekUsed: undefined,
      lastWeekId: undefined,
      processFile: async () => {},
      processDefault: async () => {},
      resetError: () => {},
      hydrateFromOutput: () => {},
      clearData: () => {},
      storedWeeks: [],
      loadStoredWeek: () => null,
      refreshStoredWeeks: () => {},
      clearStored: () => {},
      deleteStored: () => {}
    } as WeeklyDataContextValue;
  }
  return ctx;
}
