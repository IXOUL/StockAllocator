"use client";

import * as XLSX from "xlsx-js-style";
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

const defaultColumns: ExportColumn[] = [
  { key: "sku", label: "SKU", get: (r) => r.sku },
  { key: "name", label: "名称", get: (r) => r.name ?? "" },
  { key: "year", label: "年份", get: (r) => r.year ?? "" },
  { key: "totalStock", label: "总库存", get: (r) => r.totalStock },
  { key: "platformFulfillment", label: "平台履约", get: (r) => r.platformFulfillment },
  { key: "realStock", label: "真实库存", get: (r) => r.realStock },
  { key: "xhsPending", label: "小红书待发", get: (r) => r.xhsPending },
  { key: "tbPending", label: "淘宝待发", get: (r) => r.tbPending },
  { key: "yzPending", label: "有赞待发", get: (r) => r.yzPending },
  { key: "allocatable", label: "可分配库存", get: (r) => r.allocatable },
  { key: "xhsListing", label: "小红书", get: (r) => r.xhsListing },
  { key: "tbListing", label: "淘宝", get: (r) => r.tbListing },
  { key: "yzListing", label: "有赞", get: (r) => r.yzListing },
  { key: "lowStock", label: "低库存", get: (r) => r.lowStock },
  { key: "needsRecalc", label: "需要重算", get: (r) => r.needsRecalc },
  { key: "reasons", label: "原因", get: (r) => r.reasons.join("; ") }
];

type CellStyle = {
  fill?: {
    patternType?: "solid";
    fgColor?: { rgb: string };
  };
  font?: { bold?: boolean };
  alignment?: { vertical?: "center"; horizontal?: "center" | "left" | "right" };
};

const headerStyle: CellStyle = {
  font: { bold: true },
  fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
  alignment: { vertical: "center" }
};

const rowStyles = {
  negative: { fill: { patternType: "solid", fgColor: { rgb: "EDE9FE" } } },
  changed: { fill: { patternType: "solid", fgColor: { rgb: "CFFAFE" } } },
  drop: { fill: { patternType: "solid", fgColor: { rgb: "FFEDD5" } } },
  low: { fill: { patternType: "solid", fgColor: { rgb: "FEE2E2" } } },
  recalc: { fill: { patternType: "solid", fgColor: { rgb: "DBEAFE" } } }
} satisfies Record<string, CellStyle>;

function getRowStyle(record: AllocationResult): CellStyle | undefined {
  if (record.realStock < 0) return rowStyles.negative;
  if (record.allocationChanged) return rowStyles.changed;
  if (record.totalStockDropOnly) return rowStyles.drop;
  if (record.lowStock) return rowStyles.low;
  if (record.needsRecalc) return rowStyles.recalc;
  return undefined;
}

function toWorkbook(records: AllocationResult[], columns?: ExportColumn[]) {
  const activeColumns = columns?.length ? columns : defaultColumns;
  const data: Array<Array<string | number | boolean | null | undefined>> = [
    activeColumns.map((col) => col.label),
    ...records.map((record) => activeColumns.map((col) => col.get(record)))
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");

  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    const cell = sheet[addr];
    if (cell) cell.s = headerStyle as any;
  }

  for (let r = 1; r <= records.length; r += 1) {
    const rowStyle = getRowStyle(records[r - 1]);
    if (!rowStyle) continue;
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell) cell.s = rowStyle as any;
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Export");
  return workbook;
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
        onClick={() => {
          const workbook = toWorkbook(records, columns);
          const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
          download(
            `${filenameBase}.xlsx`,
            buffer,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        }}
      >
        {buttonLabel} Excel
      </button>
    </div>
  );
}
