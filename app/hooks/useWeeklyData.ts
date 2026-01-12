"use client";

import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import { allocateListings, computeRealStock, detectTriggers } from "../lib/allocation";
import { DEFAULT_RATIOS } from "../lib/constants";
import { loadProcessedOutput, saveProcessedOutput } from "../lib/storage";
import { AllocationResult, ProcessedOutput, RawRecord, WeeklyParams } from "../lib/types";

interface ParseOutcome {
  records: AllocationResult[];
  baselineMissing: boolean;
  prevWeekUsed?: string;
}

const fieldAliases = {
  sku: ["sku", "SKU", "Sku", "货号", "sku编号"],
  name: ["name", "名称", "商品名"],
  year: ["年份", "year", "Year"],
  totalStock: ["总库存", "库存", "stock", "Stock", "总量"],
  platformFulfillment: ["全平台代发", "全平台待发", "代发", "代发总计"],
  xhsPending: ["xhsPending", "小红书待发", "小红书预售", "小红书需求"],
  tbPending: ["tbPending", "淘宝待发", "淘宝预售", "淘宝需求"],
  yzPending: ["yzPending", "有赞待发", "有赞预售", "有赞需求"]
};

function coerceNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/\d{2,4}/);
    if (match) {
      return Number(match[0]);
    }
  }
  return undefined;
}

function pick<T>(row: Record<string, any>, keys: string[]): T | undefined {
  const entry = keys.find((k) => row[k] !== undefined);
  return entry !== undefined ? row[entry] : undefined;
}

function normalizeRow(row: Record<string, any>): RawRecord | null {
  const sku = String(pick<string>(row, fieldAliases.sku) ?? "").trim();
  if (!sku) return null;
  const name = pick<string>(row, fieldAliases.name) ?? "";
  const yearRaw = pick<string | number>(row, fieldAliases.year);
  const year = parseYear(yearRaw);

  return {
    sku,
    name,
    year,
    totalStock: coerceNumber(pick<number>(row, fieldAliases.totalStock) ?? 0),
    platformFulfillment: coerceNumber(pick<number>(row, fieldAliases.platformFulfillment) ?? 0),
    xhsPending: coerceNumber(pick<number>(row, fieldAliases.xhsPending) ?? 0),
    tbPending: coerceNumber(pick<number>(row, fieldAliases.tbPending) ?? 0),
    yzPending: coerceNumber(pick<number>(row, fieldAliases.yzPending) ?? 0)
  };
}

function normalizeYearTwoDigit(year?: number): number | undefined {
  if (year === undefined) return undefined;
  const yr = year > 2000 ? year - 2000 : year;
  return yr;
}

function resolveYearGroup(year: number | undefined, yearInput: string): "current" | "previous" | "other" {
  if (!yearInput) return "other";
  const targetTwo = Number(yearInput.slice(-2));
  const prevTwo = (targetTwo + 99) % 100;
  const yr = normalizeYearTwoDigit(year);
  if (yr === targetTwo) return "current";
  if (yr === prevTwo) return "previous";
  return "other";
}

function buildRecords(rawRecords: RawRecord[], params: WeeklyParams): ParseOutcome {
  const prevOutput = loadProcessedOutput(params.weekIdPrev);
  const prevMap = new Map<string, AllocationResult>();
  if (prevOutput) {
    prevOutput.records.forEach((r) => prevMap.set(r.sku, r));
  }

  const records: AllocationResult[] = rawRecords.map((row) => {
    const realStock = computeRealStock(row.totalStock, row.platformFulfillment);
    const prev = prevMap.get(row.sku);
    // 现阶段口径：allocatable 等同于真实库存
    const allocatable = realStock;
    const freshlyAllocated = allocateListings(allocatable, params.ratios || DEFAULT_RATIOS);
    const yearGroup = resolveYearGroup(row.year, params.year);
    const totalStockDropOnly =
      !!prev &&
      row.totalStock < prev.totalStock &&
      row.platformFulfillment === prev.platformFulfillment;
    const prevSnapshot = prev
      ? {
          totalStock: prev.totalStock,
          platformFulfillment: prev.platformFulfillment,
          realStock: prev.realStock,
          allocatable: prev.allocatable,
          xhsListing: prev.xhsListing,
          tbListing: prev.tbListing,
          yzListing: prev.yzListing
        }
      : undefined;

    const base: AllocationResult = {
      ...row,
      realStock,
      allocatable,
      xhsListing: freshlyAllocated.xhsListing,
      tbListing: freshlyAllocated.tbListing,
      yzListing: freshlyAllocated.yzListing,
      yearGroup,
      allocationChanged: false,
      totalStockDropOnly: false,
      prevSnapshot,
      lowStock: realStock < params.thresholds.lowStockThreshold,
      needsRecalc: false,
      reasons: []
    };

    const triggers = detectTriggers(base, prev, params.thresholds);
    const prevListingSum = prev ? prev.xhsListing + prev.tbListing + prev.yzListing : 0;
    const canReusePrev = !!prev && !triggers.needsRecalc && prevListingSum <= allocatable;

    const finalListings = canReusePrev
      ? {
          xhsListing: prev.xhsListing,
          tbListing: prev.tbListing,
          yzListing: prev.yzListing
        }
      : freshlyAllocated;

    const allocationChanged =
      !!prev &&
      (prev.xhsListing !== finalListings.xhsListing ||
        prev.tbListing !== finalListings.tbListing ||
        prev.yzListing !== finalListings.yzListing);

    return {
      ...base,
      ...finalListings,
      allocationChanged,
      totalStockDropOnly: totalStockDropOnly && !allocationChanged,
      needsRecalc: triggers.needsRecalc,
      reasons: canReusePrev ? [...triggers.reasons, "沿用上一周分配（未超阈值）"] : triggers.reasons,
      missingPrev: triggers.missingPrev
    };
  });

  const order = { current: 0, previous: 1, other: 2 } as const;
  records.sort((a, b) => {
    if (a.allocationChanged !== b.allocationChanged) return Number(b.allocationChanged) - Number(a.allocationChanged);
    const groupDiff = order[a.yearGroup] - order[b.yearGroup];
    if (groupDiff !== 0) return groupDiff;
    if (b.realStock !== a.realStock) return b.realStock - a.realStock;
    return a.sku.localeCompare(b.sku);
  });

  return {
    records,
    baselineMissing: !prevOutput,
    prevWeekUsed: prevOutput?.weekId
  };
}

async function parseWorkbook(buffer: ArrayBuffer): Promise<RawRecord[]> {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // range:1 ensures we skip the first row (杂项数字)，使用第二行作为表头
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 1 });
  const normalized: RawRecord[] = [];
  rows.forEach((row) => {
    const record = normalizeRow(row);
    if (record) normalized.push(record);
  });
  return normalized;
}

export function useWeeklyData() {
  const [records, setRecords] = useState<AllocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [baselineMissing, setBaselineMissing] = useState(false);
  const [prevWeekUsed, setPrevWeekUsed] = useState<string | undefined>();
  const [lastWeekId, setLastWeekId] = useState<string | undefined>();

  const processBuffer = useCallback(
    async (buffer: ArrayBuffer, params: WeeklyParams) => {
      setLoading(true);
      setError(undefined);
      setLastWeekId(params.weekId);
      try {
        const rawRecords = await parseWorkbook(buffer);
        const { records: computed, baselineMissing, prevWeekUsed } = buildRecords(rawRecords, params);
        setRecords(computed);
        setBaselineMissing(baselineMissing);
        setPrevWeekUsed(prevWeekUsed);

        const output: ProcessedOutput = {
          weekId: params.weekId,
          generatedAt: new Date().toISOString(),
          records: computed,
          thresholds: params.thresholds,
          ratios: params.ratios,
          pendingDeduct: params.pendingDeduct
        };
        saveProcessedOutput(output);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "处理 Excel 失败");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const processFile = useCallback(
    async (file: File, params: WeeklyParams) => {
      const buffer = await file.arrayBuffer();
      return processBuffer(buffer, params);
    },
    [processBuffer]
  );

  const processDefault = useCallback(
    async (params: WeeklyParams) => {
      const res = await fetch("/in_stock.xlsx");
      const buffer = await res.arrayBuffer();
      return processBuffer(buffer, params);
    },
    [processBuffer]
  );

  const hydrateFromOutput = useCallback((output: ProcessedOutput | null) => {
    if (!output) return;
    setRecords(output.records);
    setBaselineMissing(false);
    setPrevWeekUsed(output.weekId);
    setError(undefined);
    setLastWeekId(output.weekId);
  }, []);

  const clearData = useCallback(() => {
    setRecords([]);
    setBaselineMissing(false);
    setPrevWeekUsed(undefined);
    setError(undefined);
    setLastWeekId(undefined);
  }, []);

  return {
    records,
    loading,
    error,
    baselineMissing,
    prevWeekUsed,
    lastWeekId,
    processFile,
    processDefault,
    hydrateFromOutput,
    clearData,
    resetError: () => setError(undefined)
  };
}
