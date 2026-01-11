"use client";

import { useEffect, useMemo, useState } from "react";
import { ControlsPanel } from "./components/ControlsPanel";
import { ExportButton } from "./components/ExportButton";
import { ResultsTable } from "./components/ResultsTable";
import { DEFAULT_PENDING_CONFIG, DEFAULT_RATIOS, DEFAULT_THRESHOLDS } from "./lib/constants";
import { PendingDeductConfig, Thresholds, WeeklyParams } from "./lib/types";
import { useWeeklyDataContext } from "./providers/WeeklyDataProvider";
import { useSearchParams } from "next/navigation";

function guessPrevWeek(weekId: string): string | undefined {
  const asNum = Number(weekId);
  if (!Number.isFinite(asNum)) return undefined;
  const prev = asNum - 1;
  return prev > 0 ? String(prev) : undefined;
}

function todayWeekId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export default function Home() {
  const [weekId, setWeekId] = useState(() => todayWeekId());
  const [weekIdPrev, setWeekIdPrev] = useState("");
  const [year, setYear] = useState("2025");
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [pendingConfig, setPendingConfig] = useState<PendingDeductConfig>(DEFAULT_PENDING_CONFIG);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string>();
  const [showOtherYears, setShowOtherYears] = useState(false);
  const [weekIdTouched, setWeekIdTouched] = useState(false);
  const {
    records,
    loading,
    error,
    baselineMissing,
    prevWeekUsed,
    processFile,
    processDefault,
    resetError,
    loadStoredWeek,
    hydrateFromOutput,
    refreshStoredWeeks
  } = useWeeklyDataContext();
  const searchParams = useSearchParams();
  const weekFromUrl = searchParams.get("week");
  const lowStockRecords = useMemo(() => records.filter((r) => r.lowStock), [records]);
  const lowStockVisible = useMemo(
    () =>
      showOtherYears ? lowStockRecords : lowStockRecords.filter((r) => r.yearGroup === "current" || r.yearGroup === "previous"),
    [lowStockRecords, showOtherYears]
  );
  const lowStockHiddenCount = lowStockRecords.length - lowStockVisible.length;

  const params: WeeklyParams = useMemo(
    () => ({
      weekId,
      weekIdPrev: weekIdPrev || guessPrevWeek(weekId),
      year,
      ratios: DEFAULT_RATIOS,
      pendingDeduct: pendingConfig,
      thresholds
    }),
    [weekId, weekIdPrev, year, pendingConfig, thresholds]
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

  const handleProcessDefault = async () => {
    if (!validate()) return;
    await processDefault(params);
    refreshStoredWeeks();
  };

  const stats = useMemo(() => {
    const visibleRecords = showOtherYears ? records : records.filter((r) => r.yearGroup !== "other");
    const total = visibleRecords.length;
    const lowStockCount = visibleRecords.filter((r) => r.lowStock).length;
    const recalcCount = visibleRecords.filter((r) => r.needsRecalc).length;
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
    const hiddenCount = records.length - visibleRecords.length;
    return { total, lowStockCount, recalcCount, allocSum, hiddenCount, visibleRecords };
  }, [records, showOtherYears]);

  return (
    <main>
      <h1>周度上架分配（小红书 / 淘宝 / 有赞）</h1>
      <p className="lead">
        导入 Excel 周报后，自动计算真实库存、可上架库存（allocatable），并按 70/20/10 配比生成建议上架数量。
        同时给出低库存提醒与上一周对比触发的“需要重算”标记。
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
        onProcessDefault={handleProcessDefault}
      />

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
            <div className="tag">
              allocatable 总计：{stats.allocSum.allocatable} （小红书 {stats.allocSum.xhs} / 淘宝{" "}
              {stats.allocSum.tb} / 有赞 {stats.allocSum.yz}）
            </div>
            {stats.hiddenCount > 0 && (
              <button className="secondary" onClick={() => setShowOtherYears((v) => !v)}>
                {showOtherYears ? "隐藏其他年份" : `展开其他年份 (${stats.hiddenCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      <ExportButton weekId={weekId} records={records} />
      <ResultsTable records={stats.visibleRecords ?? records} />
    </main>
  );
}
