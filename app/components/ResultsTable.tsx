 "use client";

import React, { useState } from "react";
import { AllocationResult } from "../lib/types";

interface ResultsTableProps {
  records: AllocationResult[];
}

function StatusPills({ record }: { record: AllocationResult }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {(record.needsRecalc || record.allocationChanged) && <span className="pill info">分配变动</span>}
      {record.totalStockDropOnly && <span className="pill warn">总库存下降</span>}
      {record.lowStock && <span className="pill danger">低库存</span>}
      {record.missingPrev && <span className="pill muted">无上一周基准</span>}
      {record.reasons.map((r) => (
        <span key={r} className="tag">
          {r}
        </span>
      ))}
    </div>
  );
}

export function ResultsTable({ records }: ResultsTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showStock, setShowStock] = useState(false);

  const toggle = (sku: string) => {
    setExpanded((prev) => ({ ...prev, [sku]: !prev[sku] }));
  };

  if (!records.length) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>分配结果</div>
          <span className="pill muted">暂无数据</span>
        </div>
        <div style={{ color: "#9ca3af" }}>
          上传或使用默认 Excel 后查看全部 SKU 及分配数量。如果仍为空，请检查：1）是否已填写 weekId/年份 2）Excel 表头是否包含
          SKU/总库存/全平台代发/各平台待发 3）年份过滤是否把数据筛掉（无年份的行会自动保留）。
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>分配结果（全部货品）</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="secondary" onClick={() => setShowStock((v) => !v)} style={{ padding: "6px 10px" }}>
            {showStock ? "隐藏库存/待发列" : "展开库存/待发列"}
          </button>
          <div className="pill muted">SKU 数量：{records.length}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>名称</th>
            <th>年份</th>
            {showStock && (
              <>
                <th>总库存</th>
                <th>全平台代发</th>
                <th>真实库存</th>
                <th>小红书待发</th>
                <th>淘宝待发</th>
                <th>有赞待发</th>
              </>
            )}
            <th>allocatable</th>
            <th>上架-小红书</th>
            <th>上架-淘宝</th>
            <th>上架-有赞</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const rowClass = record.allocationChanged
              ? "row-changed"
              : record.totalStockDropOnly
              ? "row-drop"
              : record.lowStock
              ? "row-low"
              : record.needsRecalc
              ? "row-recalc"
              : "";
            return (
              <React.Fragment key={record.sku}>
                <tr className={rowClass}>
                  <td>{record.sku}</td>
                  <td>{record.name}</td>
                  <td>{record.year ?? "-"}</td>
                  {showStock && (
                    <>
                      <td>{record.totalStock}</td>
                      <td>{record.platformFulfillment}</td>
                      <td>{record.realStock}</td>
                      <td>{record.xhsPending}</td>
                      <td>{record.tbPending}</td>
                      <td>{record.yzPending}</td>
                    </>
                  )}
                  <td>{record.allocatable}</td>
                  <td>{record.xhsListing}</td>
                  <td>{record.tbListing}</td>
                  <td>{record.yzListing}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <StatusPills record={record} />
                      {record.allocationChanged && (
                        <button className="secondary" style={{ padding: "6px 10px" }} onClick={() => toggle(record.sku)}>
                          {expanded[record.sku] ? "收起对比" : "查看与上周对比"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {record.allocationChanged && expanded[record.sku] && record.prevSnapshot && (
                  <tr className="detail-row">
                    <td colSpan={showStock ? 14 : 8}>
                      <div className="compare">
                        <div>
                          <div className="compare-title">本周</div>
                          <div className="compare-grid">
                            <span>真实库存</span>
                            <span>{record.realStock}</span>
                            <span>allocatable</span>
                            <span>{record.allocatable}</span>
                            <span>小红书</span>
                            <span>{record.xhsListing}</span>
                            <span>淘宝</span>
                            <span>{record.tbListing}</span>
                            <span>有赞</span>
                            <span>{record.yzListing}</span>
                          </div>
                        </div>
                        <div>
                          <div className="compare-title">上一周</div>
                          <div className="compare-grid">
                            <span>真实库存</span>
                            <span>{record.prevSnapshot.realStock}</span>
                            <span>allocatable</span>
                            <span>{record.prevSnapshot.allocatable}</span>
                            <span>小红书</span>
                            <span>{record.prevSnapshot.xhsListing}</span>
                            <span>淘宝</span>
                            <span>{record.prevSnapshot.tbListing}</span>
                            <span>有赞</span>
                            <span>{record.prevSnapshot.yzListing}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
