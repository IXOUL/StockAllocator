import { AllocationRatios, PendingDeductConfig, Thresholds } from "./types";

export const DEFAULT_RATIOS: AllocationRatios = { xhs: 0.7, tb: 0.2, yz: 0.1 };

export const DEFAULT_PENDING_CONFIG: PendingDeductConfig = {
  strategy: "all"
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  lowStockThreshold: 2,
  changeThresholdPercent: 20
};
