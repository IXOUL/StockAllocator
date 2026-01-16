import { AllocationRatios, PendingDeductConfig, Thresholds } from "./types";

export const DEFAULT_RATIOS: AllocationRatios = { xhs: 70, tb: 20, yz: 10 };

export const DEFAULT_PENDING_CONFIG: PendingDeductConfig = {
  strategy: "all"
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  lowStockThreshold: 2,
  changeThresholdPercent: 20
};
