"use client";

import { useMemo, useState } from "react";
import { useWeeklyDataContext } from "../providers/WeeklyDataProvider";
import { ExportButton } from "../components/ExportButton";
import { ResultsTable } from "../components/ResultsTable";
import { buildStyleGroupKey } from "../lib/sku";
import { AllocationResult } from "../lib/types";

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
  const lowStockRecords = useMemo(() => records.filter((r) => r.lowStock), [records]);
  const reallocationGroupKeys = useMemo(() => {
    const keys = new Set<string>();
    records.forEach((record) => {
      if (record.allocationChanged) {
        keys.add(buildStyleGroupKey(record.sku, record.year));
      }
    });
    return keys;
  }, [records]);
  const reallocationRecords = useMemo(
    () => records.filter((record) => reallocationGroupKeys.has(buildStyleGroupKey(record.sku, record.year))),
    [records, reallocationGroupKeys]
  );
  const reallocationExportBaseColumns = useMemo(
    () => [
      { key: "sku", label: "sku", get: (r: AllocationResult) => r.sku },
      { key: "name", label: "name", get: (r: AllocationResult) => r.name ?? "" },
      { key: "year", label: "year", get: (r: AllocationResult) => r.year ?? "" },
      { key: "allocatable", label: "allocatable", get: (r: AllocationResult) => r.allocatable },
      { key: "xhsListing", label: "xhsListing", get: (r: AllocationResult) => r.xhsListing },
      { key: "tbListing", label: "tbListing", get: (r: AllocationResult) => r.tbListing },
      { key: "yzListing", label: "yzListing", get: (r: AllocationResult) => r.yzListing },
      { key: "lowStock", label: "lowStock", get: (r: AllocationResult) => r.lowStock },
      { key: "reasons", label: "reasons", get: (r: AllocationResult) => r.reasons.join("; ") }
    ],
    []
  );
  const reallocationExportWithStockColumns = useMemo(
    () => [
      { key: "totalStock", label: "totalStock", get: (r: AllocationResult) => r.totalStock },
      { key: "platformFulfillment", label: "platformFulfillment", get: (r: AllocationResult) => r.platformFulfillment },
      { key: "realStock", label: "realStock", get: (r: AllocationResult) => r.realStock },
      { key: "xhsPending", label: "xhsPending", get: (r: AllocationResult) => r.xhsPending },
      { key: "tbPending", label: "tbPending", get: (r: AllocationResult) => r.tbPending },
      { key: "yzPending", label: "yzPending", get: (r: AllocationResult) => r.yzPending }
    ],
    []
  );
  const reallocationExportColumns = useMemo(
    () => [...reallocationExportBaseColumns, ...reallocationExportWithStockColumns],
    [reallocationExportBaseColumns, reallocationExportWithStockColumns]
  );
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.sku.localeCompare(b.sku)),
    [records]
  );

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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        <ExportButton weekId={selectedWeek || lastWeekId || ""} records={sortedRecords} label="全部结果" />
        <ExportButton
          weekId={selectedWeek || lastWeekId || ""}
          records={reallocationRecords}
          label="重新分配结果（隐藏库存/待发）"
          filenamePrefix="reallocated"
          columns={reallocationExportBaseColumns}
        />
        <ExportButton
          weekId={selectedWeek || lastWeekId || ""}
          records={reallocationRecords}
          label="重新分配结果（含库存/待发）"
          filenamePrefix="reallocated_with_stock"
          columns={reallocationExportColumns}
        />
      </div>
      <ResultsTable records={records} />
    </main>
  );
}
