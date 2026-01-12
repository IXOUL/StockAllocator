import { AllocationRatios, AllocationResult, PendingDeductConfig, RawRecord, Thresholds } from "./types";

export function computeRealStock(totalStock: number, platformFulfillment: number): number {
  return Math.max(0, totalStock - platformFulfillment);
}

export function computeAllocatable(
  realStock: number,
  record: Pick<RawRecord, "xhsPending" | "tbPending" | "yzPending">,
  pendingDeduct: PendingDeductConfig
): number {
  let deduction = 0;
  if (pendingDeduct.strategy === "all") {
    deduction = record.xhsPending + record.tbPending + record.yzPending;
  } else if (pendingDeduct.strategy === "custom" && pendingDeduct.customFields?.length) {
    deduction = pendingDeduct.customFields.reduce((acc, key) => {
      const map = {
        xhs: record.xhsPending,
        tb: record.tbPending,
        yz: record.yzPending
      } as const;
      return acc + (map[key] ?? 0);
    }, 0);
  }
  // strategy "none" means deduction stays 0
  return Math.max(0, realStock - deduction);
}

export interface ListingAllocations {
  xhsListing: number;
  tbListing: number;
  yzListing: number;
}

function normalizeRatios(ratios: AllocationRatios): AllocationRatios {
  const sum = ratios.xhs + ratios.tb + ratios.yz || 1;
  return {
    xhs: ratios.xhs / sum,
    tb: ratios.tb / sum,
    yz: ratios.yz / sum
  };
}

export function allocateListings(allocatable: number, ratios: AllocationRatios): ListingAllocations {
  if (allocatable <= 0) {
    return { xhsListing: 0, tbListing: 0, yzListing: 0 };
  }

  if (allocatable === 1) {
    return { xhsListing: 1, tbListing: 0, yzListing: 0 };
  }

  if (allocatable === 2) {
    return { xhsListing: 1, tbListing: 1, yzListing: 0 };
  }

  const normalized = normalizeRatios(ratios);
  const targets = {
    xhs: allocatable * normalized.xhs,
    tb: allocatable * normalized.tb,
    yz: allocatable * normalized.yz
  };

  const floors = {
    xhs: Math.floor(targets.xhs),
    tb: Math.floor(targets.tb),
    yz: Math.floor(targets.yz)
  };

  let allocations = { ...floors };
  let remainder = allocatable - (floors.xhs + floors.tb + floors.yz);

  // distribute remaining units based on largest fractional parts
  if (remainder > 0) {
    const fractional = [
      { key: "xhs" as const, frac: targets.xhs - floors.xhs },
      { key: "tb" as const, frac: targets.tb - floors.tb },
      { key: "yz" as const, frac: targets.yz - floors.yz }
    ].sort((a, b) => b.frac - a.frac);

    for (const entry of fractional) {
      if (remainder <= 0) break;
      allocations = { ...allocations, [entry.key]: allocations[entry.key] + 1 };
      remainder -= 1;
    }
  }

  // Enforce minimum 1 per platform when allocatable >= 3
  const keys: Array<keyof ListingAllocations> = ["xhsListing", "tbListing", "yzListing"];
  const allocKeys = ["xhs", "tb", "yz"] as const;
  if (allocatable >= 3) {
    const mutable = {
      xhs: allocations.xhs,
      tb: allocations.tb,
      yz: allocations.yz
    };
    for (const key of allocKeys) {
      if (mutable[key] < 1) {
        const donor = allocKeys.find((k) => mutable[k] > 1);
        if (donor) {
          mutable[donor] -= 1;
          mutable[key] += 1;
        }
      }
    }
    allocations = mutable;
  }

  return {
    xhsListing: allocations.xhs,
    tbListing: allocations.tb,
    yzListing: allocations.yz
  };
}

export function detectTriggers(
  current: AllocationResult,
  previous: AllocationResult | undefined,
  thresholds: Thresholds
): { needsRecalc: boolean; reasons: string[]; missingPrev?: boolean } {
  if (!previous) {
    return { needsRecalc: false, reasons: [], missingPrev: true };
  }

  const reasons: string[] = [];
  if (current.realStock < previous.realStock) {
    const drop = (previous.realStock - current.realStock) / Math.max(1, previous.realStock);
    reasons.push(`真实库存下降 ${Math.round(drop * 100)}% 需要重新分配`);
  }

  ([
    ["xhsPending", "小红书"],
    ["tbPending", "淘宝"],
    ["yzPending", "有赞"]
  ] as const).forEach(([key, label]) => {
    if (previous[key] > 0 && current[key] === 0) {
      reasons.push(`${label} 待发从 ${previous[key]} 变为 0`);
    }
  });

  if (previous.allocatable > 0 && current.allocatable === 0) {
    reasons.push("allocatable 从有货变为 0，原分配失效");
  } else if (previous.allocatable >= 3 && current.allocatable < 3) {
    reasons.push("allocatable 由 ≥3 降为 <3，约束变化");
  }

  return { needsRecalc: reasons.length > 0, reasons };
}
