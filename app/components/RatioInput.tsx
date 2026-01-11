"use client";

import { AllocationRatios } from "../lib/types";

interface RatioInputProps {
  ratios: AllocationRatios;
  onChange: (r: AllocationRatios) => void;
}

export function RatioInput({ ratios, onChange }: RatioInputProps) {
  const update = (key: keyof AllocationRatios, value: number) => {
    const next = { ...ratios, [key]: value };
    const sum = next.xhs + next.tb + next.yz || 1;
    onChange({
      xhs: next.xhs / sum,
      tb: next.tb / sum,
      yz: next.yz / sum
    });
  };

  return (
    <div className="ratio-row">
      <div className="tag">平台配比（可自定义，默认 70/20/10）</div>
      <label>
        小红书 (%)
        <input
          type="number"
          min={0}
          value={Math.round(ratios.xhs * 100)}
          onChange={(e) => update("xhs", Number(e.target.value || 0) / 100)}
        />
      </label>
      <label>
        淘宝 (%)
        <input
          type="number"
          min={0}
          value={Math.round(ratios.tb * 100)}
          onChange={(e) => update("tb", Number(e.target.value || 0) / 100)}
        />
      </label>
      <label>
        有赞 (%)
        <input
          type="number"
          min={0}
          value={Math.round(ratios.yz * 100)}
          onChange={(e) => update("yz", Number(e.target.value || 0) / 100)}
        />
      </label>
    </div>
  );
}
