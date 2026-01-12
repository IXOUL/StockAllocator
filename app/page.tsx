"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ControlsPanel } from "./components/ControlsPanel";
import { ExportButton } from "./components/ExportButton";
import { ResultsTable } from "./components/ResultsTable";
import { RatioInput } from "./components/RatioInput";
import { DEFAULT_PENDING_CONFIG, DEFAULT_RATIOS, DEFAULT_THRESHOLDS } from "./lib/constants";
import { AllocationResult, PendingDeductConfig, Thresholds, WeeklyParams } from "./lib/types";
import { useWeeklyDataContext } from "./providers/WeeklyDataProvider";
import { useSearchParams } from "next/navigation";

function todayWeekId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function HomeContent() {
  const [weekId, setWeekId] = useState(() => todayWeekId());
  const [weekIdPrev, setWeekIdPrev] = useState("");
  const [year, setYear] = useState("2025");
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [ratios, setRatios] = useState(DEFAULT_RATIOS);
  const [pendingConfig, setPendingConfig] = useState<PendingDeductConfig>(DEFAULT_PENDING_CONFIG);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string>();
  const [showOtherYears, setShowOtherYears] = useState(false);
  const [weekIdTouched, setWeekIdTouched] = useState(false);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const {
    records,
    loading,
    error,
    baselineMissing,
    prevWeekUsed,
    processFile,
    resetError,
    loadStoredWeek,
    hydrateFromOutput,
    refreshStoredWeeks,
    storedWeeks
  } = useWeeklyDataContext();
  const searchParams = useSearchParams();
  const weekFromUrl = searchParams.get("week");
  const lowStockRecords = useMemo(() => records.filter((r) => r.lowStock), [records]);
  const reallocationRecords = useMemo(() => records.filter((r) => r.allocationChanged), [records]);
  const sortedReallocationRecords = useMemo(
    () => [...reallocationRecords].sort((a, b) => a.sku.localeCompare(b.sku)),
    [reallocationRecords]
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

  const params: WeeklyParams = useMemo(
    () => ({
      weekId,
      weekIdPrev: weekIdPrev || undefined,
      year,
      ratios,
      pendingDeduct: pendingConfig,
      thresholds
    }),
    [weekId, weekIdPrev, year, pendingConfig, thresholds, ratios]
  );

  const validate = () => {
    if (!params.weekId || !params.year) {
      setFormError("weekId 与 年份 必填");
      return false;
    }
    setFormError(undefined);
    resetError();
    return true;
  };

  useEffect(() => {
    if (!weekFromUrl || weekIdTouched) return;
    setWeekId(weekFromUrl);
    const output = loadStoredWeek(weekFromUrl);
    if (output) {
      hydrateFromOutput(output);
    }
  }, [weekFromUrl, loadStoredWeek, hydrateFromOutput, weekIdTouched]);

  const handleProcessUpload = async () => {
    if (!validate()) return;
    if (!selectedFile) {
      setFormError("请选择要上传的 Excel");
      return;
    }
    await processFile(selectedFile, params);
    refreshStoredWeeks();
  };

  const stats = useMemo(() => {
    const basePool = showLowOnly ? lowStockRecords : records;
    const visibleRecords = basePool.filter((r) => showOtherYears || r.yearGroup !== "other");
    const total = visibleRecords.length;
    const lowStockCount = visibleRecords.filter((r) => r.lowStock).length;
    const recalcCount = visibleRecords.filter((r) => r.needsRecalc).length;
    const allocationChangedCount = visibleRecords.filter((r) => r.allocationChanged).length;
    const allocSum = visibleRecords.reduce(
      (acc, r) => {
        acc.allocatable += r.allocatable;
        acc.xhs += r.xhsListing;
        acc.tb += r.tbListing;
        acc.yz += r.yzListing;
        return acc;
      },
      { allocatable: 0, xhs: 0, tb: 0, yz: 0 }
    );
    const hiddenCount = basePool.filter((r) => r.yearGroup === "other").length;
    return { total, lowStockCount, recalcCount, allocationChangedCount, allocSum, hiddenCount, visibleRecords };
  }, [records, showOtherYears, showLowOnly, lowStockRecords]);

  return (
    <main>
      <h1>Stock Allocator</h1>
      <p className="lead">
        导入 Excel 周报后，自动计算真实库存并进行库存分配；同时给出低库存提醒与上一周对比触发的“需要重算”标记。
      </p>

      <ControlsPanel
        weekId={weekId}
        weekIdPrev={weekIdPrev}
        year={year}
        thresholds={thresholds}
        pendingConfig={pendingConfig}
        loading={loading}
        formError={formError}
        onWeekIdChange={(v) => {
          setWeekIdTouched(true);
          setWeekId(v);
        }}
        onWeekIdPrevChange={setWeekIdPrev}
        onYearChange={setYear}
        onThresholdsChange={setThresholds}
        onPendingConfigChange={setPendingConfig}
        onFilePicked={setSelectedFile}
        onProcess={handleProcessUpload}
        storedWeeks={storedWeeks}
        onWeekIdPrevSelect={setWeekIdPrev}
      />
      <div className="card" style={{ marginBottom: 12 }}>
        <RatioInput ratios={ratios} onChange={setRatios} />
      </div>

      {(error || baselineMissing) && (
        <div className="banner">
          {error && (
            <div style={{ marginBottom: 6 }}>
              <span className="pill danger">错误</span> {error}
            </div>
          )}
          {baselineMissing && (
            <div>
              <span className="pill warn">提示</span> 缺少上一周 processed output，已默认用本周真实库存全部分配；本次结果会保存供下周对比。
            </div>
          )}
          {prevWeekUsed && (
            <div style={{ marginTop: 6, color: "#9ca3af" }}>对比基准 weekId：{prevWeekUsed}</div>
          )}
        </div>
      )}

      {records.length > 0 && (
        <div className="card" style={{ margin: "12px 0" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div className="pill muted">SKU 数：{stats.total}</div>
            <div className="pill danger">低库存：{stats.lowStockCount}</div>
            <div className="pill warn">需要重算：{stats.recalcCount}</div>
            <div className="pill info">分配变动：{stats.allocationChangedCount}</div>
            <div className="tag">
              allocatable 总计：{stats.allocSum.allocatable} （小红书 {stats.allocSum.xhs} / 淘宝{" "}
              {stats.allocSum.tb} / 有赞 {stats.allocSum.yz}）
            </div>
            <button className="secondary" onClick={() => setShowLowOnly((v) => !v)}>
              {showLowOnly ? "收起低库存预警" : "低库存预警"}
            </button>
            {stats.hiddenCount > 0 && (
              <button className="secondary" onClick={() => setShowOtherYears((v) => !v)}>
                {showOtherYears ? "隐藏其他年份" : `展开其他年份 (${stats.hiddenCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
          <ExportButton weekId={weekId} records={sortedRecords} label="全部结果" />
          <ExportButton
            weekId={weekId}
            records={sortedReallocationRecords}
            label="重新分配结果（隐藏库存/待发）"
            filenamePrefix="reallocated"
            columns={reallocationExportBaseColumns}
          />
          <ExportButton
            weekId={weekId}
            records={sortedReallocationRecords}
            label="重新分配结果（含库存/待发）"
            filenamePrefix="reallocated_with_stock"
            columns={reallocationExportColumns}
          />
        </div>
      )}
      <ResultsTable records={stats.visibleRecords ?? records} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="card">加载中…</div>}>
      <HomeContent />
    </Suspense>
  );
}
