"use client";

import { AllocationResult } from "../lib/types";

interface ExportButtonProps {
  weekId: string;
  records: AllocationResult[];
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

function toCsv(records: AllocationResult[]): string {
  const headers = [
    "sku",
    "name",
    "year",
    "totalStock",
    "platformFulfillment",
    "realStock",
    "xhsPending",
    "tbPending",
    "yzPending",
    "allocatable",
    "xhsListing",
    "tbListing",
    "yzListing",
    "lowStock",
    "needsRecalc",
    "reasons"
  ];
  const lines = records.map((r) =>
    [
      r.sku,
      r.name ?? "",
      r.year ?? "",
      r.totalStock,
      r.platformFulfillment,
      r.realStock,
      r.xhsPending,
      r.tbPending,
      r.yzPending,
      r.allocatable,
      r.xhsListing,
      r.tbListing,
      r.yzListing,
      r.lowStock,
      r.needsRecalc,
      `"${r.reasons.join("; ")}"`
    ].join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export function ExportButton({ weekId, records }: ExportButtonProps) {
  if (!records.length) return null;

  const filenameBase = weekId ? `processed_${weekId}` : "processed";

  return (
    <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
      <button
        className="secondary"
        onClick={() => download(`${filenameBase}.json`, JSON.stringify(records, null, 2), "application/json")}
      >
        导出 JSON
      </button>
      <button className="secondary" onClick={() => download(`${filenameBase}.csv`, toCsv(records), "text/csv")}>
        导出 CSV
      </button>
    </div>
  );
}
