"use client";

import { WeeklyDataProvider } from "./providers/WeeklyDataProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <WeeklyDataProvider>{children}</WeeklyDataProvider>;
}
