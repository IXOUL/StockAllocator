"use client";

import { useRef } from "react";
import { DEFAULT_THRESHOLDS } from "../lib/constants";
import { PendingDeductConfig, Thresholds } from "../lib/types";

interface ControlsPanelProps {
  weekId: string;
  weekIdPrev?: string;
  year: string;
  thresholds: Thresholds;
  pendingConfig: PendingDeductConfig;
  loading: boolean;
  formError?: string;
  onWeekIdChange: (value: string) => void;
  onWeekIdPrevChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onThresholdsChange: (value: Thresholds) => void;
  onPendingConfigChange: (value: PendingDeductConfig) => void;
  onFilePicked: (file: File | null) => void;
  onProcess: () => void;
  storedWeeks?: string[];
  onWeekIdPrevSelect?: (value: string) => void;
}

export function ControlsPanel({
  weekId,
  weekIdPrev,
  year,
  thresholds,
  pendingConfig,
  loading,
  formError,
  onWeekIdChange,
  onWeekIdPrevChange,
  onYearChange,
  onThresholdsChange,
  onPendingConfigChange,
  onFilePicked,
  onProcess,
  storedWeeks,
  onWeekIdPrevSelect
}: ControlsPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const formatToday = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleStrategyChange = (strategy: PendingDeductConfig["strategy"]) => {
    onPendingConfigChange({
      strategy,
      customFields: strategy === "custom" ? ["xhs", "tb", "yz"] : undefined
    });
  };

  return (
    <div className="card controls-card">
      <div className="controls-grid two-row">
        <div className="field">
          <label>本次Id</label>
          <div className="inline">
            <input
              value={weekId}
              onChange={(e) => onWeekIdChange(e.target.value)}
              placeholder="必填，例如 20250112"
            />
            <button type="button" className="secondary small" onClick={() => onWeekIdChange(formatToday())}>
              填入今日
            </button>
          </div>
        </div>
        <div className="field">
          <label>上次Id（可选）</label>
          <select
            value={weekIdPrev ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onWeekIdPrevChange(v);
              if (v) onWeekIdPrevSelect?.(v);
            }}
          >
            <option value="">历史记录（可留空）</option>
            {storedWeeks?.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>年份（必填，例如 2025）</label>
          <input value={year} onChange={(e) => onYearChange(e.target.value)} />
        </div>
        <div className="field inline stretch">
          <div style={{ flex: 1 }}>
            <label>低库存阈值</label>
            <input
              type="number"
              min={0}
              value={thresholds.lowStockThreshold}
              onChange={(e) =>
                onThresholdsChange({
                  ...thresholds,
                  lowStockThreshold: Number(e.target.value || DEFAULT_THRESHOLDS.lowStockThreshold)
                })
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>周变化阈值（%）</label>
            <input
              type="number"
              min={0}
              value={thresholds.changeThresholdPercent}
              onChange={(e) =>
                onThresholdsChange({
                  ...thresholds,
                  changeThresholdPercent: Number(
                    e.target.value || DEFAULT_THRESHOLDS.changeThresholdPercent
                  )
                })
              }
            />
          </div>
        </div>
        <div className="field">
          <label>待发扣减策略</label>
          <select
            value={pendingConfig.strategy}
            onChange={(e) => handleStrategyChange(e.target.value as PendingDeductConfig["strategy"])}
          >
            <option value="all">扣减全部待发（默认）</option>
            <option value="none">不扣待发</option>
            <option value="custom">自定义字段</option>
          </select>
          {pendingConfig.strategy === "custom" && (
            <span className="tag">当前：{pendingConfig.customFields?.join(", ")}</span>
          )}
        </div>
        <div className="field upload-stack">
          <label>上传 Excel</label>
          <div className="upload-row">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
            />
            <button className="primary" disabled={loading} onClick={onProcess}>
              {loading ? "处理中…" : "上传并计算"}
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div className="banner">
          <span className="pill danger">校验</span> {formError}
        </div>
      )}
    </div>
  );
}
