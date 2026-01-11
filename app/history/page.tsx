"use client";

import { useState } from "react";
import { useWeeklyDataContext } from "../providers/WeeklyDataProvider";
import { ExportButton } from "../components/ExportButton";
import { ResultsTable } from "../components/ResultsTable";

export default function HistoryPage() {
  const {
    storedWeeks,
    loadStoredWeek,
    hydrateFromOutput,
    records,
    lastWeekId,
    clearStored,
    refreshStoredWeeks,
    deleteStored
  } = useWeeklyDataContext();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();

  const handleLoadHistory = (id: string) => {
    setSelectedWeek(id);
    const output = loadStoredWeek(id);
    if (output) {
      hydrateFromOutput(output);
    }
  };

  return (
    <main>
      <h1>历史数据</h1>
      <p className="lead">点击周次查看已保存的结果，可导出或清空。</p>

      <div className="card" style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="tag">已保存周次</span>
        {storedWeeks.length === 0 && <span className="pill muted">暂无</span>}
        {storedWeeks.map((w) => (
          <div key={w} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="secondary" onClick={() => handleLoadHistory(w)}>
              {w}
            </button>
            <button
              className="secondary"
              onClick={() => {
                if (confirm(`删除周次 ${w} 的数据？`)) {
                  deleteStored(w);
                  if (selectedWeek === w) setSelectedWeek(undefined);
                }
              }}
              style={{ padding: "6px 8px" }}
            >
              删除
            </button>
          </div>
        ))}
        {storedWeeks.length > 0 && (
          <button
            className="secondary"
            onClick={() => {
              if (confirm("确认清空所有已保存的数据？")) {
                clearStored();
                refreshStoredWeeks();
                setSelectedWeek(undefined);
              }
            }}
          >
            清空历史
          </button>
        )}
      </div>

      <ExportButton weekId={selectedWeek || lastWeekId || ""} records={records} />
      <ResultsTable records={records} />
    </main>
  );
}
