"use client";

import { useMemo, useState } from "react";
import { useWeeklyDataContext } from "../providers/WeeklyDataProvider";
import { ExportButton } from "../components/ExportButton";
import { ResultsTable } from "../components/ResultsTable";
import { buildStyleGroupKey } from "../lib/sku";
import { compareByYearDesc } from "../lib/sort";
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
    () =>
      records.filter((record) => {
        if (record.realStock < 0) return true;
        return reallocationGroupKeys.has(buildStyleGroupKey(record.sku, record.year));
      }),
    [records, reallocationGroupKeys]
  );
  const reallocationExportBaseColumns = useMemo(
    () => [
      { key: "sku", label: "SKU", get: (r: AllocationResult) => r.sku },
      { key: "name", label: "名称", get: (r: AllocationResult) => r.name ?? "" },
      { key: "year", label: "年份", get: (r: AllocationResult) => r.year ?? "" },
      { key: "allocatable", label: "可分配库存", get: (r: AllocationResult) => r.allocatable },
      { key: "xhsListing", label: "小红书", get: (r: AllocationResult) => r.xhsListing },
      { key: "tbListing", label: "淘宝", get: (r: AllocationResult) => r.tbListing },
      { key: "yzListing", label: "有赞", get: (r: AllocationResult) => r.yzListing },
      { key: "lowStock", label: "低库存", get: (r: AllocationResult) => r.lowStock },
      { key: "reasons", label: "原因", get: (r: AllocationResult) => r.reasons.join("; ") }
    ],
    []
  );
  const reallocationExportWithStockColumns = useMemo(
    () => [
      { key: "totalStock", label: "总库存", get: (r: AllocationResult) => r.totalStock },
      { key: "platformFulfillment", label: "平台履约", get: (r: AllocationResult) => r.platformFulfillment },
      { key: "realStock", label: "真实库存", get: (r: AllocationResult) => r.realStock },
      { key: "xhsPending", label: "小红书待发", get: (r: AllocationResult) => r.xhsPending },
      { key: "tbPending", label: "淘宝待发", get: (r: AllocationResult) => r.tbPending },
      { key: "yzPending", label: "有赞待发", get: (r: AllocationResult) => r.yzPending }
    ],
    []
  );
  const reallocationExportColumns = useMemo(
    () => [...reallocationExportBaseColumns, ...reallocationExportWithStockColumns],
    [reallocationExportBaseColumns, reallocationExportWithStockColumns]
  );
  const sortedRecords = useMemo(() => [...records].sort(compareByYearDesc), [records]);
  const sortedReallocationRecords = useMemo(
    () => [...reallocationRecords].sort(compareByYearDesc),
    [reallocationRecords]
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
      <div className="page-header">
        <div className="page-brand">
          <img src="/logo.png" alt="logo" />
          <div>
            <div className="page-brand-title">Stock Distribution Manager</div>
          </div>
        </div>
        <nav className="page-nav">
          <a href="/">数据总览</a>
          <a href="/history">查看历史</a>
        </nav>
      </div>
      <div className="card" style={{ padding: "32px 48px" }}>
        <div className="history-heading">
          <h1>历史数据</h1>
          <p className="lead">点击周次查看已保存的结果，可导出或清空。</p>
        </div>
        <div className="history-actions">
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
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        <ExportButton weekId={selectedWeek || lastWeekId || ""} records={sortedRecords} label="全部结果" />
        <ExportButton
          weekId={selectedWeek || lastWeekId || ""}
          records={sortedReallocationRecords}
          label="重新分配结果（隐藏库存/待发）"
          filenamePrefix="reallocated"
          columns={reallocationExportBaseColumns}
        />
        <ExportButton
          weekId={selectedWeek || lastWeekId || ""}
          records={sortedReallocationRecords}
          label="重新分配结果（含库存/待发）"
          filenamePrefix="reallocated_with_stock"
          columns={reallocationExportColumns}
        />
      </div>
      <ResultsTable records={records} />
    </main>
  );
}
