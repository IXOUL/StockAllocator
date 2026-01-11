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
  onProcessDefault: () => void;
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
  onProcessDefault
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
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="grid">
        <label>
          本周 weekId
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={weekId}
              onChange={(e) => onWeekIdChange(e.target.value)}
              placeholder="必填，例如 20250112（可点右侧填入今日）"
            />
            <button type="button" className="secondary" onClick={() => onWeekIdChange(formatToday())}>
              填入今日
            </button>
          </div>
        </label>
        <label>
          上一周 weekId（可选）
          <input
            value={weekIdPrev ?? ""}
            onChange={(e) => onWeekIdPrevChange(e.target.value)}
            placeholder="留空则自动 weekId-1"
          />
        </label>
        <label>
          年份（必填，例如 2025）
          <input value={year} onChange={(e) => onYearChange(e.target.value)} />
        </label>
        <label>
          低库存阈值
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
        </label>
        <label>
          周变化阈值（%）
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
        </label>
        <label>
          待发扣减策略
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
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
        />
        <button className="primary" disabled={loading} onClick={onProcess}>
          {loading ? "处理中…" : "用上传的 Excel 计算"}
        </button>
        <button className="secondary" disabled={loading} onClick={onProcessDefault}>
          {loading ? "处理中…" : "使用默认 in_stock.xlsx"}
        </button>
        <span className="tag">配比：小红书 70% / 淘宝 20% / 有赞 10%</span>
      </div>
      {formError && (
        <div className="banner">
          <span className="pill danger">校验</span> {formError}
        </div>
      )}
      <div className="banner">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>口径提示</div>
        <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6 }}>
          待发（预售/待履约）视为需求/占用；库存分配输出的是各平台实际上架数量（可卖/配额）。
          缺口时请调整扣减策略或回传真实口径。
        </div>
      </div>
    </div>
  );
}
