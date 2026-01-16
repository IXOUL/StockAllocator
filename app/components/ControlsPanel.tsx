"use client";

import { useRef } from "react";
import { DEFAULT_THRESHOLDS } from "../lib/constants";
import { Thresholds } from "../lib/types";

interface ControlsPanelProps {
  weekId: string;
  weekIdPrev?: string;
  year: string;
  thresholds: Thresholds;
  ratios: { xhs: number; tb: number; yz: number };
  loading: boolean;
  formError?: string;
  onWeekIdChange: (value: string) => void;
  onWeekIdPrevChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onThresholdsChange: (value: Thresholds) => void;
  onRatiosChange: (value: { xhs: number; tb: number; yz: number }) => void;
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
  ratios,
  loading,
  formError,
  onWeekIdChange,
  onWeekIdPrevChange,
  onYearChange,
  onThresholdsChange,
  onRatiosChange,
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

  return (
    <div className="controls-panel">
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
          <label>平台配比（可自定义，默认 70/20/10）</label>
          <div className="ratio-row">
            <label>
              小红书（%）
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={ratios.xhs}
                onChange={(e) => onRatiosChange({ ...ratios, xhs: Number(e.target.value || 0) })}
              />
            </label>
            <label>
              淘宝（%）
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={ratios.tb}
                onChange={(e) => onRatiosChange({ ...ratios, tb: Number(e.target.value || 0) })}
              />
            </label>
            <label>
              有赞（%）
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={ratios.yz}
                onChange={(e) => onRatiosChange({ ...ratios, yz: Number(e.target.value || 0) })}
              />
            </label>
          </div>
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
