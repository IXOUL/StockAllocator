"use client";

import { AllocationResult } from "../lib/types";

interface ExportColumn {
  key: string;
  label: string;
  get: (record: AllocationResult) => string | number | boolean | null | undefined;
}

interface ExportButtonProps {
  weekId: string;
  records: AllocationResult[];
  label?: string;
  filenamePrefix?: string;
  columns?: ExportColumn[];
}

function download(filename: string, data: BlobPart, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, "\"\"")}"`;
}

function toCsv(records: AllocationResult[], columns?: ExportColumn[]): string {
  const defaultColumns: ExportColumn[] = [
    { key: "sku", label: "sku", get: (r) => r.sku },
    { key: "name", label: "name", get: (r) => r.name ?? "" },
    { key: "year", label: "year", get: (r) => r.year ?? "" },
    { key: "totalStock", label: "totalStock", get: (r) => r.totalStock },
    { key: "platformFulfillment", label: "platformFulfillment", get: (r) => r.platformFulfillment },
    { key: "realStock", label: "realStock", get: (r) => r.realStock },
    { key: "xhsPending", label: "xhsPending", get: (r) => r.xhsPending },
    { key: "tbPending", label: "tbPending", get: (r) => r.tbPending },
    { key: "yzPending", label: "yzPending", get: (r) => r.yzPending },
    { key: "allocatable", label: "allocatable", get: (r) => r.allocatable },
    { key: "xhsListing", label: "xhsListing", get: (r) => r.xhsListing },
    { key: "tbListing", label: "tbListing", get: (r) => r.tbListing },
    { key: "yzListing", label: "yzListing", get: (r) => r.yzListing },
    { key: "lowStock", label: "lowStock", get: (r) => r.lowStock },
    { key: "needsRecalc", label: "needsRecalc", get: (r) => r.needsRecalc },
    { key: "reasons", label: "reasons", get: (r) => r.reasons.join("; ") }
  ];
  const activeColumns = columns?.length ? columns : defaultColumns;
  const headers = activeColumns.map((c) => c.label);
  const lines = records.map((record) =>
    activeColumns.map((col) => csvEscape(col.get(record))).join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export function ExportButton({ weekId, records, label, filenamePrefix, columns }: ExportButtonProps) {
  if (!records.length) return null;

  const filenameBase = `${filenamePrefix ?? "processed"}${weekId ? `_${weekId}` : ""}`;
  const buttonLabel = label ? `导出${label}` : "导出";
  const payload =
    columns?.length
      ? records.map((record) =>
          columns.reduce<Record<string, string | number | boolean | null | undefined>>((acc, col) => {
            acc[col.key] = col.get(record);
            return acc;
          }, {})
        )
      : records;

  return (
    <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
      <button
        className="secondary"
        onClick={() => download(`${filenameBase}.json`, JSON.stringify(payload, null, 2), "application/json")}
      >
        {buttonLabel} JSON
      </button>
      <button
        className="secondary"
        onClick={() => download(`${filenameBase}.csv`, toCsv(records, columns), "text/csv")}
      >
        {buttonLabel} CSV
      </button>
    </div>
  );
}
