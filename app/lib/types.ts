export type PlatformKey = "xhs" | "tb" | "yz";

export interface AllocationRatios {
  xhs: number;
  tb: number;
  yz: number;
}

export interface PendingDeductConfig {
  /** all: deduct all pending; none: ignore pending; custom: deduct selected pending fields */
  strategy: "all" | "none" | "custom";
  customFields?: PlatformKey[];
}

export interface Thresholds {
  lowStockThreshold: number;
  changeThresholdPercent: number;
}

export interface WeeklyParams {
  weekId: string;
  year: string;
  weekIdPrev?: string;
  ratios: AllocationRatios;
  pendingDeduct: PendingDeductConfig;
  thresholds: Thresholds;
}

export interface RawRecord {
  sku: string;
  name?: string;
  year?: number;
  totalStock: number;
  platformFulfillment: number;
  xhsPending: number;
  tbPending: number;
  yzPending: number;
}

export interface AllocationResult extends RawRecord {
  realStock: number;
  allocatable: number;
  xhsListing: number;
  tbListing: number;
  yzListing: number;
  yearGroup: "current" | "previous" | "other";
  allocationChanged: boolean;
  totalStockDropOnly: boolean;
  lowStock: boolean;
  needsRecalc: boolean;
  reasons: string[];
  missingPrev?: boolean;
  prevSnapshot?: {
    totalStock: number;
    platformFulfillment: number;
    realStock: number;
    allocatable: number;
    xhsListing: number;
    tbListing: number;
    yzListing: number;
  };
}

export interface ProcessedOutput {
  weekId: string;
  generatedAt: string;
  records: AllocationResult[];
  thresholds: Thresholds;
  ratios: AllocationRatios;
  pendingDeduct: PendingDeductConfig;
}
